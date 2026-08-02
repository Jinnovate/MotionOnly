CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE member_status AS ENUM ('invited','active','suspended','deleted');
CREATE TYPE member_role AS ENUM ('member','moderator','admin');
CREATE TYPE visibility AS ENUM ('private','members','shared');
CREATE TYPE focus_area AS ENUM ('Business','Trading','Fitness');

CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  password_hash text NOT NULL,
  status member_status NOT NULL DEFAULT 'active',
  email_verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email)) WHERE deleted_at IS NULL;

CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text,
  focuses focus_area[] NOT NULL DEFAULT ARRAY[]::focus_area[],
  avatar_key text,
  onboarding_completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile_visibility visibility NOT NULL DEFAULT 'members',
  progress_visibility visibility NOT NULL DEFAULT 'private',
  messaging_permission text NOT NULL DEFAULT 'members',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member'
);

CREATE TABLE invitations (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  role member_role NOT NULL DEFAULT 'member',
  invited_by uuid REFERENCES users(id),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES users(id),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invitations_email_idx ON invitations (lower(email));

CREATE TABLE goals (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  focus focus_area NOT NULL,
  progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target_date date,
  status text NOT NULL DEFAULT 'active',
  visibility visibility NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX goals_owner_idx ON goals (owner_id,created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE goal_updates (
  id uuid PRIMARY KEY,
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress smallint NOT NULL CHECK (progress BETWEEN 0 AND 100),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE habits (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  focus focus_area NOT NULL,
  cadence jsonb NOT NULL DEFAULT '{"frequency":"daily"}',
  visibility visibility NOT NULL DEFAULT 'private',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE habit_checkins (
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (habit_id,checkin_date)
);

CREATE TABLE rooms (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  focus focus_area,
  is_private boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE room_members (
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id,user_id)
);

CREATE TABLE room_messages (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
CREATE INDEX room_messages_timeline_idx ON room_messages (room_id,created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE direct_threads (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE direct_thread_members (
  thread_id uuid NOT NULL REFERENCES direct_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id,user_id)
);
CREATE TABLE direct_messages (
  id uuid PRIMARY KEY,
  thread_id uuid NOT NULL REFERENCES direct_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE projects (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES users(id),
  visibility visibility NOT NULL DEFAULT 'private',
  progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE TABLE project_members (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id,user_id)
);

CREATE TABLE achievements (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  evidence_file_id uuid,
  visibility visibility NOT NULL DEFAULT 'private',
  achieved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE private_files (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key text NOT NULL UNIQUE,
  original_name text NOT NULL,
  content_type text NOT NULL,
  byte_size bigint NOT NULL,
  sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE achievements ADD CONSTRAINT achievements_evidence_fk FOREIGN KEY (evidence_file_id) REFERENCES private_files(id);

CREATE TABLE notifications (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id,created_at DESC);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION bootstrap_member_defaults() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO privacy_settings(user_id) VALUES (NEW.id);
  RETURN NEW;
END $$;
CREATE TRIGGER users_defaults AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION bootstrap_member_defaults();
