CREATE TABLE IF NOT EXISTS settings (
id int DEFAULT 0,
delivery_distance int,
discount int,
service_fee money
);

CREATE TABLE IF NOT EXISTS discount_codes (
code varchar(255) PRIMARY KEY,
percent int,
amount money
);