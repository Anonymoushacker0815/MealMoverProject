CREATE TABLE status
    (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
    );

CREATE TABLE IF NOT EXISTS users
    (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    --GeoJSON
    location JSONB,
    -- Constraints to the 3 types.
    user_type VARCHAR(50) CHECK (user_type IN ('Customer', 'Restaurant','Admin')),
    loyalty_points INTEGER DEFAULT 0,
    status_id INTEGER REFERENCES status(id)
    );

INSERT INTO status (name, description) VALUES
     ('Active', 'Standard'),
     ('Suspended', 'User violated terms of service');