CREATE TABLE IF NOT EXISTS u_status
    (
    id serial PRIMARY KEY,
    name varchar(50) NOT NULL UNIQUE,
    description text
    );
	
CREATE TABLE IF NOT EXISTS users 
	(	
	id serial PRIMARY KEY,
	email varchar(255) UNIQUE NOT NULL,
	password varchar(255),
    --username for forum?
	username varchar(100) UNIQUE,
    --GeoJSON
	location jsonb,
    -- Constraint to the 3 types
	user_type varchar(50) CHECK (user_type IN ('Customer', 'Restaurant','Admin')),
	loyalty_points int DEFAULT 0,
    status_id int,
	CONSTRAINT FK_status_users FOREIGN KEY (status_id) REFERENCES u_status(id)
	);