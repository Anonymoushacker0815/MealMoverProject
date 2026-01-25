INSERT INTO reviews (rating, details, user_id, restaurant_id, dish_id, created_at) VALUES
(4, 'pretty good, actually', 2, 1, 2, NOW() - INTERVAL '6 days'),
(1, 'never again', 3, 2, null, NOW() - INTERVAL '3 days'),
(3, 'eh kinda mid, wish there was more vegies', 2, 1, 1, NOW() - INTERVAL '1 day');
