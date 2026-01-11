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
Constraint FK_StatusOrder FOREIGN KEY (status_id) REFERENCES o_status(id)
);

Create table dishes (
order_id int,
dish_id int,
Primary KEY (order_id, dish_id),
Constraint FK_order_dish FOREIGN KEY (order_id) REFERENCES orders(id)
);

