CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,

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


INSERT INTO replies (thread_id, content, author_name)
VALUES
(
  (SELECT id FROM threads WHERE title = 'Best Meal Prep for Office?' LIMIT 1),
  'I prep rice bowls and swap proteins (chicken/tofu) + different sauces.',
  'lea'
),
(
  (SELECT id FROM threads WHERE title = 'Best Meal Prep for Office?' LIMIT 1),
  'Overnight oats + a big salad base are super easy for weekdays.',
  'lukas'
),
(
  (SELECT id FROM threads WHERE title = 'High protein vegan meals' LIMIT 1),
  'Tofu, lentils, chickpeas, and edamame are my go-to protein sources.',
  'lukas'
),
(
  (SELECT id FROM threads WHERE title = 'High protein vegan meals' LIMIT 1),
  'Try tempeh stir-fry and lentil pasta. Easy to hit protein goals.',
  'lea'
);
