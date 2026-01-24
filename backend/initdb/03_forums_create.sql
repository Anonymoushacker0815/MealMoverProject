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

CREATE INDEX IF NOT EXISTS idx_replies_thread_id_created_at
  ON replies(thread_id, created_at DESC);

CREATE TABLE IF NOT EXISTS thread_votes (
  user_id   int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id int NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  vote_type varchar(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_votes_thread_id ON thread_votes(thread_id);

ALTER TABLE threads
  ADD CONSTRAINT fk_threads_author
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE replies
  ADD CONSTRAINT fk_replies_author
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

