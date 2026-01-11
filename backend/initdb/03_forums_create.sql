CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS threads (
  id serial PRIMARY KEY,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  author_name varchar(100) NOT NULL,
  author_id int,
  likes int DEFAULT 0,
  dislikes int DEFAULT 0,
  views int DEFAULT 0,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replies (
  id serial PRIMARY KEY,
  thread_id int NOT NULL REFERENCES threads(id) ON DELETE CASCADE,

  content text NOT NULL,
  author_name varchar(100) NOT NULL DEFAULT 'Anonymous',
  author_id int,

  likes int DEFAULT 0,
  dislikes int DEFAULT 0,

  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE INDEX idx_replies_thread_id_created_at
  ON replies(thread_id, created_at DESC);
