
INSERT INTO r_status (name, description) values
('Active', 'Standard'),
('Pending', 'To be accepted by the Admin'),
('Suspended', 'Restaurant violated terms of service');

INSERT INTO restaurants (name, email, phone, user_id, status_id) VALUES
('SpeedEat', 'speed.eat@mail.com', '95839682', 4, 2),
('Gimme Foods', 'gimme.foods@email.com', '8533455', 5, 1);

INSERT INTO categories (name, description, restaurant_id) VALUES
('fish', 'contains fish', 1),
('vegan', 'does not contain animal products', 1),
('vegitarian', 'no meat included', 1),
('curry', 'part of the curry collection', 2),
('pasta', 'part of the past collection', 2),
('dessert', 'part of the dessert collection', 2);

INSERT INTO r_dishes (name, description, price, restaurant_id, category_id) VALUES
('sweet treat', 'strawberry cheese cake', 1.50, 2, 6),
('spaghetti', 'spaghetti cabonara', 2.67, 2, 5),
('mixed salat', 'karrots, radish, cabage in one salat', 0.90, 1, 2),
('fish sticks', 'sticks of very tasty fish', 3.50, 1, 1);