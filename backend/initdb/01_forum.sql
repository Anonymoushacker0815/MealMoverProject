CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

INSERT INTO threads (title, content, author_name, likes, dislikes, views)
VALUES
(
  'Best Meal Prep for Office?',
  'What meals do you prep for a 9-5 office job?',
  'lukas',
  12,
  1,
  245
),
(
  'High protein vegan meals',
  'High protein vegan meal ideas without meat?',
  'lea',
  7,
  0,
  180
);
