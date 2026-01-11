CREATE TABLE IF NOT EXISTS o_status (
id serial PRIMARY KEY,
name varchar(255),
description text
);

CREATE TABLE IF NOT EXISTS orders (
id serial PRIMARY KEY,
customer_id int,
restaurant_id int,
order_time timestamp DEFAULT NOW(),
delivery_time timestamp,
status_id int,
price money,
CONSTRAINT FK_status_order FOREIGN KEY (status_id) REFERENCES o_status(id)
);

CREATE TABLE IF NOT EXISTS o_dishes (
order_id int,
dish_id int,
PRIMARY KEY (order_id, dish_id),
CONSTRAINT FK_order_dish FOREIGN KEY (order_id) REFERENCES orders(id)
);

