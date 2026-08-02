CREATE TABLE daily_motions (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  focus focus_area NOT NULL,
  scheduled_date date NOT NULL,
  completed_at timestamptz,
  visibility visibility NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX daily_motions_owner_date_idx
  ON daily_motions(owner_id,scheduled_date)
  WHERE deleted_at IS NULL;

CREATE TABLE library_progress (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id text NOT NULL,
  saved boolean NOT NULL DEFAULT false,
  checklist jsonb NOT NULL DEFAULT '[]',
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,resource_id)
);

CREATE TABLE project_updates (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
CREATE INDEX project_updates_timeline_idx
  ON project_updates(project_id,created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE push_devices (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('ios','android')),
  enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE moderation_reports (
  id uuid PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('member','room_message','direct_message','project_update')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  detail text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  assigned_to uuid REFERENCES users(id),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX moderation_reports_status_idx ON moderation_reports(status,created_at);

CREATE TABLE member_blocks (
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(blocker_id,blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE direct_threads ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX direct_thread_pair_unique
  ON direct_threads ((metadata->>'pair_key'))
  WHERE metadata ? 'pair_key';
