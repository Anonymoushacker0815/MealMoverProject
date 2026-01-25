
INSERT INTO o_status (name, description) VALUES
('placed', 'order has been placed'),
('preparing', 'order is being prepared'),
('delivering', 'the order is on its way'),
('completed', 'the order has been delivered');

INSERT INTO orders (customer_id, restaurant_id, status_id, price, order_time) VALUES
(2, 1, 4, 23.50, NOW() - INTERVAL '20 days'),
(3, 1, 4, 39.99, NOW() - INTERVAL '19 days'),
(2, 1, 4, 20.00, NOW() - INTERVAL '19 days'),
(2, 1, 4, 18.50, NOW() - INTERVAL '17 days'),
(3, 1, 4, 14.90, NOW() - INTERVAL '17 days');

INSERT INTO o_dishes (order_id, dish_id, ammount) VALUES
(1,2,5),
(1,1,2),
(2,3,2),
(2,4,5),
(3,3,1),
(4,3,1),
(4,4,2),
(5,1,2),
(5,2,1);