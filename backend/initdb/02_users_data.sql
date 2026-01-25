INSERT INTO u_status (name, description) VALUES
     ('Active', 'Standard'),
     ('Suspended', 'User violated terms of service'),
     ('Pending', 'Restaurant account awaiting approval');

--Passwords must be prehashed - 10 rounds of salting with Bcrypt
INSERT INTO users(email, password, username, user_type, status_id) VALUES
--Admin Pass: admin
	('admin', '$2a$12$zTRYyYVrTmIMhdgkS2LY7.5TXiR0yb95bb9QVvJ4Y3UHZJRQTVPRW', 'admin', 'Admin', 1);

INSERT INTO users(email, password, username, user_type, status_id, location) VALUES
--George Pass: pwd
--Lisa Pass: pwd
	('george@mail.com', '$2a$12$XFSm1i.8b0URsvtBs1JqSehmFo1w1TUS.yHmZTEtdRqG2gHoyLzby', 'george', 'Customer', 1, '{"type": "Point", "coordinates": [14.291144052848148, 46.661944400567066]}'),
	('lisa@mail.com', '$2a$12$XFSm1i.8b0URsvtBs1JqSehmFo1w1TUS.yHmZTEtdRqG2gHoyLzby', 'lisa', 'Customer', 1, '{"type": "Point", "coordinates": [14.33104861471981, 46.610378443367786]}'),
--Markus Pass: pwd
--Max Pass: pwd
    ('markus@mail.com', '$2a$12$XFSm1i.8b0URsvtBs1JqSehmFo1w1TUS.yHmZTEtdRqG2gHoyLzby', 'markus', 'Restaurant', 1, '{"type": "Point", "coordinates": [14.299591003901329, 46.62504993899363]}'),
    ('max@mail.com', '$2a$12$XFSm1i.8b0URsvtBs1JqSehmFo1w1TUS.yHmZTEtdRqG2gHoyLzby', 'max', 'Restaurant', 1, '{"type": "Point", "coordinates": [14.295221891287628, 46.602274114923205]}');