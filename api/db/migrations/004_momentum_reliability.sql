CREATE OR REPLACE FUNCTION settle_momentum_weeks(p_week_start date)
RETURNS TABLE(user_id uuid,status momentum_week_status,bonus_xp integer)
LANGUAGE plpgsql AS $$
DECLARE
  week_row momentum_weeks%ROWTYPE;
  profile_row progression_profiles%ROWTYPE;
  reward integer;
BEGIN
  FOR week_row IN
    SELECT * FROM momentum_weeks
    WHERE week_start=p_week_start
      AND momentum_weeks.status='building'
      AND p_week_start < local_week_start(momentum_weeks.user_id)
    FOR UPDATE
  LOOP
    SELECT * INTO profile_row FROM progression_profiles
      WHERE progression_profiles.user_id=week_row.user_id FOR UPDATE;
    IF week_row.points >= 100 THEN
      reward := least(200,100+(profile_row.momentum_streak*25));
      UPDATE momentum_weeks SET
        status='secured',bonus_xp=reward,secured_at=now(),settled_at=now(),updated_at=now()
        WHERE id=week_row.id;
      UPDATE progression_profiles SET
        lifetime_xp=lifetime_xp+reward,
        momentum_streak=momentum_streak+1,
        best_momentum_streak=greatest(best_momentum_streak,momentum_streak+1),
        updated_at=now()
        WHERE progression_profiles.user_id=week_row.user_id;
      INSERT INTO progression_events(
        user_id,event_type,source_type,idempotency_key,xp_points,momentum_points,metadata
      ) VALUES(
        week_row.user_id,'momentum_bonus','momentum_week',
        'momentum-week:'||p_week_start,reward,0,jsonb_build_object('weekStart',p_week_start)
      ) ON CONFLICT DO NOTHING;
      user_id:=week_row.user_id;status:='secured';bonus_xp:=reward;RETURN NEXT;
    ELSE
      UPDATE momentum_weeks SET
        status='missed',bonus_xp=0,settled_at=now(),updated_at=now()
        WHERE id=week_row.id;
      UPDATE progression_profiles SET momentum_streak=0,updated_at=now()
        WHERE progression_profiles.user_id=week_row.user_id;
      user_id:=week_row.user_id;status:='missed';bonus_xp:=0;RETURN NEXT;
    END IF;
  END LOOP;
  UPDATE progression_profiles p SET current_level=coalesce(
    (SELECT max(level) FROM level_definitions WHERE xp_required<=p.lifetime_xp),1
  )
  WHERE p.user_id IN (
    SELECT mw.user_id FROM momentum_weeks mw
    WHERE mw.week_start=p_week_start AND mw.settled_at IS NOT NULL
  );
END $$;

CREATE FUNCTION settle_due_momentum_weeks()
RETURNS TABLE(user_id uuid,status momentum_week_status,bonus_xp integer)
LANGUAGE plpgsql AS $$
DECLARE
  due_week date;
BEGIN
  FOR due_week IN
    SELECT DISTINCT mw.week_start FROM momentum_weeks mw
    WHERE mw.status='building' AND mw.week_start < local_week_start(mw.user_id)
    ORDER BY mw.week_start
  LOOP
    RETURN QUERY SELECT * FROM settle_momentum_weeks(due_week);
  END LOOP;
END $$;
