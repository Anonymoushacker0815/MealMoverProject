CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS threads (
  id Serial PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_id UUID,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replies (
  id Serial PRIMARY KEY,
  thread_id int NOT NULL REFERENCES threads(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  author_name VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
  author_id UUID,

  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_replies_thread_id_created_at
  ON replies(thread_id, created_at DESC);
