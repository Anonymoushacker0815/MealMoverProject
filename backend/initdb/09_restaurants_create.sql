CREATE TABLE IF NOT EXISTS r_status(
id serial PRIMARY KEY,
name varchar(255),
description varchar(255)
);

CREATE TABLE IF NOT EXISTS restaurants (
id serial PRIMARY KEY,
name varchar(255),
location jsonb,
email varchar (255),
phone varchar(20),
delivery_zone varchar(255),
opening_hours jsonb,
user_id int,
status_id int DEFAULT 2,
CONSTRAINT FK_status_restaurant FOREIGN KEY (status_id) REFERENCES r_status(id)
);

CREATE TABLE IF NOT EXISTS categories (
id serial PRIMARY KEY,
name varchar (255),
description text,
restaurant_id int,
CONSTRAINT FK_category_resturant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE IF NOT EXISTS r_dishes (
id serial PRIMARY KEY,
name varchar(255),
description text,
price money,
picture_path varchar(255),
restaurant_id int,
CONSTRAINT FK_dishes_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
category_id int,
CONSTRAINT FK_dishes_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS sort_index int;

ALTER TABLE r_dishes
ADD COLUMN IF NOT EXISTS sort_index int;

UPDATE categories SET sort_index = id WHERE sort_index IS NULL;
UPDATE r_dishes  SET sort_index = id WHERE sort_index IS NULL;
