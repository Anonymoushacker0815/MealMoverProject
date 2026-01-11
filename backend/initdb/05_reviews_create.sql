CREATE TABLE IF NOT EXISTS reviews(
id serial PRIMARY KEY,
rating int,
details text,
user_id int NOT NULL,
restaurant_id int NOT NULL,
dish_id int
);

