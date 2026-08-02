CREATE TYPE momentum_week_status AS ENUM ('building','secured','missed');

ALTER TABLE profiles ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';

CREATE TABLE level_definitions (
  level smallint PRIMARY KEY,
  name text NOT NULL UNIQUE,
  xp_required integer NOT NULL UNIQUE CHECK (xp_required >= 0)
);
INSERT INTO level_definitions(level,name,xp_required) VALUES
  (1,'Starting Line',0),
  (2,'Foundation',150),
  (3,'Rhythm',350),
  (4,'Operator',650),
  (5,'Pacesetter',1050),
  (6,'Force',1600),
  (7,'Vanguard',2300),
  (8,'Apex',3200);

CREATE TABLE progression_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  lifetime_xp integer NOT NULL DEFAULT 0 CHECK (lifetime_xp >= 0),
  current_level smallint NOT NULL DEFAULT 1 REFERENCES level_definitions(level),
  momentum_streak integer NOT NULL DEFAULT 0 CHECK (momentum_streak >= 0),
  best_momentum_streak integer NOT NULL DEFAULT 0 CHECK (best_momentum_streak >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE momentum_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  points smallint NOT NULL DEFAULT 0 CHECK (points BETWEEN 0 AND 100),
  status momentum_week_status NOT NULL DEFAULT 'building',
  bonus_xp integer NOT NULL DEFAULT 0 CHECK (bonus_xp >= 0),
  secured_at timestamptz,
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,week_start)
);

CREATE TABLE progression_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  source_type text NOT NULL,
  source_id uuid,
  idempotency_key text NOT NULL,
  xp_points smallint NOT NULL DEFAULT 0 CHECK (xp_points >= 0),
  momentum_points smallint NOT NULL DEFAULT 0 CHECK (momentum_points >= 0),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}',
  UNIQUE(user_id,idempotency_key)
);
CREATE INDEX progression_events_timeline_idx ON progression_events(user_id,occurred_at DESC);

CREATE TABLE member_unlocks (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unlock_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY(user_id,unlock_key)
);

CREATE TABLE weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  reflection text NOT NULL,
  wins jsonb NOT NULL DEFAULT '[]',
  next_week_focus text NOT NULL,
  visibility visibility NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,week_start)
);

CREATE FUNCTION local_week_start(p_user_id uuid, p_at timestamptz DEFAULT now())
RETURNS date LANGUAGE sql STABLE AS $$
  SELECT local_date - (extract(isodow FROM local_date)::integer - 1)
  FROM (
    SELECT (p_at AT TIME ZONE coalesce((SELECT timezone FROM profiles WHERE user_id=p_user_id),'UTC'))::date local_date
  ) d
$$;

CREATE FUNCTION award_progress_event(
  p_user_id uuid,
  p_event_type text,
  p_source_type text,
  p_source_id uuid,
  p_idempotency_key text,
  p_xp smallint,
  p_momentum smallint,
  p_daily_cap smallint
) RETURNS TABLE(awarded boolean,lifetime_xp integer,current_level smallint,weekly_points smallint)
LANGUAGE plpgsql AS $$
DECLARE
  v_local_date date;
  v_timezone text;
  v_week_start date;
  v_count integer;
BEGIN
  SELECT coalesce(timezone,'UTC') INTO v_timezone FROM profiles WHERE user_id=p_user_id;
  v_timezone := coalesce(v_timezone,'UTC');
  v_local_date := (now() AT TIME ZONE v_timezone)::date;
  v_week_start := v_local_date - (extract(isodow FROM v_local_date)::integer - 1);

  IF EXISTS(SELECT 1 FROM progression_events WHERE user_id=p_user_id AND idempotency_key=p_idempotency_key) THEN
    RETURN QUERY SELECT false,p.lifetime_xp,p.current_level,coalesce(w.points,0::smallint)
      FROM progression_profiles p LEFT JOIN momentum_weeks w ON w.user_id=p.user_id AND w.week_start=v_week_start
      WHERE p.user_id=p_user_id;
    RETURN;
  END IF;

  SELECT count(*) INTO v_count FROM progression_events
    WHERE user_id=p_user_id AND event_type=p_event_type
      AND (occurred_at AT TIME ZONE v_timezone)::date=v_local_date;
  IF v_count >= p_daily_cap THEN
    RETURN QUERY SELECT false,p.lifetime_xp,p.current_level,coalesce(w.points,0::smallint)
      FROM progression_profiles p LEFT JOIN momentum_weeks w ON w.user_id=p.user_id AND w.week_start=v_week_start
      WHERE p.user_id=p_user_id;
    RETURN;
  END IF;

  INSERT INTO progression_events(user_id,event_type,source_type,source_id,idempotency_key,xp_points,momentum_points)
    VALUES(p_user_id,p_event_type,p_source_type,p_source_id,p_idempotency_key,p_xp,p_momentum);
  INSERT INTO momentum_weeks(user_id,week_start,points)
    VALUES(p_user_id,v_week_start,least(100,p_momentum))
    ON CONFLICT(user_id,week_start) DO UPDATE
      SET points=least(100,momentum_weeks.points+excluded.points),updated_at=now();
  UPDATE progression_profiles p SET lifetime_xp=p.lifetime_xp+p_xp,updated_at=now() WHERE p.user_id=p_user_id;
  UPDATE progression_profiles p SET current_level=coalesce(
    (SELECT max(level) FROM level_definitions WHERE xp_required<=p.lifetime_xp),1
  ) WHERE p.user_id=p_user_id;

  RETURN QUERY SELECT true,p.lifetime_xp,p.current_level,w.points
    FROM progression_profiles p JOIN momentum_weeks w ON w.user_id=p.user_id AND w.week_start=v_week_start
    WHERE p.user_id=p_user_id;
END $$;

CREATE FUNCTION settle_momentum_weeks(p_week_start date)
RETURNS TABLE(user_id uuid,status momentum_week_status,bonus_xp integer)
LANGUAGE plpgsql AS $$
DECLARE
  week_row momentum_weeks%ROWTYPE;
  profile_row progression_profiles%ROWTYPE;
  reward integer;
BEGIN
  FOR week_row IN SELECT * FROM momentum_weeks WHERE week_start=p_week_start AND momentum_weeks.status='building' FOR UPDATE
  LOOP
    SELECT * INTO profile_row FROM progression_profiles WHERE progression_profiles.user_id=week_row.user_id FOR UPDATE;
    IF week_row.points >= 100 THEN
      reward := least(200,100+(profile_row.momentum_streak*25));
      UPDATE momentum_weeks SET status='secured',bonus_xp=reward,secured_at=now(),settled_at=now(),updated_at=now() WHERE id=week_row.id;
      UPDATE progression_profiles SET
        lifetime_xp=lifetime_xp+reward,
        momentum_streak=momentum_streak+1,
        best_momentum_streak=greatest(best_momentum_streak,momentum_streak+1),
        updated_at=now()
      WHERE progression_profiles.user_id=week_row.user_id;
      INSERT INTO progression_events(user_id,event_type,source_type,idempotency_key,xp_points,momentum_points,metadata)
        VALUES(week_row.user_id,'momentum_bonus','momentum_week','momentum-week:'||p_week_start,reward,0,jsonb_build_object('weekStart',p_week_start));
      user_id:=week_row.user_id;status:='secured';bonus_xp:=reward;RETURN NEXT;
    ELSE
      UPDATE momentum_weeks SET status='missed',bonus_xp=0,settled_at=now(),updated_at=now() WHERE id=week_row.id;
      UPDATE progression_profiles SET momentum_streak=0,updated_at=now() WHERE progression_profiles.user_id=week_row.user_id;
      user_id:=week_row.user_id;status:='missed';bonus_xp:=0;RETURN NEXT;
    END IF;
  END LOOP;
  UPDATE progression_profiles p SET current_level=coalesce(
    (SELECT max(level) FROM level_definitions WHERE xp_required<=p.lifetime_xp),1
  );
END $$;

CREATE FUNCTION bootstrap_progression() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO progression_profiles(user_id) VALUES(NEW.id);
  RETURN NEW;
END $$;
CREATE TRIGGER users_progression AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION bootstrap_progression();
INSERT INTO progression_profiles(user_id) SELECT id FROM users ON CONFLICT(user_id) DO NOTHING;
