CREATE TABLE IF NOT EXISTS u_status
    (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
    );
	
CREATE TABLE IF NOT EXISTS users 
	(	
	id serial PRIMARY KEY,
	email varchar(255) UNIQUE NOT NULL,
	password varchar(255),
    --username for forum?
	username varchar(100) UNIQUE,
    --GeoJSON
	location JSONB,
    -- Constraint to the 3 types
	user_type VARCHAR(50) CHECK (user_type IN ('Customer', 'Restaurant','Admin')),
	loyalty_points int DEFAULT 0,
    status_id int,
	CONSTRAINT FK_status_users FOREIGN KEY (status_id) REFERENCES u_status(id)
	);