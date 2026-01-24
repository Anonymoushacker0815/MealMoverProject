INSERT INTO threads (title, content, author_name, author_id, likes, dislikes, views)
VALUES
(
  'Best Meal Prep for Office?', 
  'What meals do you prep for a 9-5 office job?',
  'george',
  (SELECT id FROM users WHERE username = 'george' LIMIT 1),
  12,
  1,
  245
),
(
  'High protein vegan meals',
  'High protein vegan meal ideas without meat?',
  'lisa',
  (SELECT id FROM users WHERE username = 'lisa' LIMIT 1),
  7,
  0,
  180
);


INSERT INTO replies (thread_id, content, author_name, author_id)
VALUES
(
  (SELECT id FROM threads WHERE title = 'Best Meal Prep for Office?' LIMIT 1),
  'I prep rice bowls and swap proteins (chicken/tofu) + different sauces.',
  'lisa',
  (SELECT id FROM users WHERE username = 'lisa' LIMIT 1)
),
(
  (SELECT id FROM threads WHERE title = 'Best Meal Prep for Office?' LIMIT 1),
  'Overnight oats + a big salad base are super easy for weekdays.',
  'george',
  (SELECT id FROM users WHERE username = 'george' LIMIT 1)
),
(
  (SELECT id FROM threads WHERE title = 'High protein vegan meals' LIMIT 1),
  'Tofu, lentils, chickpeas, and edamame are my go-to protein sources.',
  'george',
  (SELECT id FROM users WHERE username = 'george' LIMIT 1)
),
(
  (SELECT id FROM threads WHERE title = 'High protein vegan meals' LIMIT 1),
  'Try tempeh stir-fry and lentil pasta. Easy to hit protein goals.',
  'lisa',
  (SELECT id FROM users WHERE username = 'lisa' LIMIT 1)
);

INSERT INTO moderation_thread_reports (thread_id, reporter_id, reason, status, created_at)
VALUES
(
  (SELECT id FROM threads WHERE title = 'Best Meal Prep for Office?' LIMIT 1),
  (SELECT id FROM users WHERE username = 'lisa' LIMIT 1),
  'Spam / off-topic',
  'open',
  NOW()
),
(
  (SELECT id FROM threads WHERE title = 'High protein vegan meals' LIMIT 1),
  (SELECT id FROM users WHERE username = 'george' LIMIT 1),
  'Harassment / inappropriate language',
  'open',
  NOW()
);
