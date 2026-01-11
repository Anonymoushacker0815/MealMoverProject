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
