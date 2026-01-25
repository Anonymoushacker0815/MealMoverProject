CREATE TABLE IF NOT EXISTS user_activity_events (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type varchar(50) NOT NULL CHECK (event_type IN ('login', 'register', 'status_change')),
  actor_user_id int REFERENCES users(id) ON DELETE SET NULL,  -- admin who changed status, null for login/register
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_events_created_at ON user_activity_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_events_type_created_at ON user_activity_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_events_user_id_created_at ON user_activity_events(user_id, created_at);
