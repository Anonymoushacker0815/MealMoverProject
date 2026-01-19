
INSERT INTO o_status (name, description) VALUES
('placed', 'order has been placed'),
('preparing', 'order is being prepared'),
('delivering', 'the order is on its way'),
('completed', 'the order has been delivered');

INSERT INTO orders (customer_id, restaurant_id, status_id, price) VALUES
(2, 3, 2, 23.50),
(3, 2, 1, 39.99),
(2, 1, 4, 20.00);

INSERT INTO o_dishes (order_id, dish_id, ammount) VALUES
(1,2,5),
(1,1,2),
(2,3,2),
(2,4,5),
(3,3,1);