INSERT INTO u_status (name, description) VALUES
     ('Active', 'Standard'),
     ('Suspended', 'User violated terms of service');


--Passwords must be prehashed - 10 rounds of salting with Bcrypt
INSERT INTO users(email, password, username, user_type, status_id) VALUES
--Admin Pass: admin
	('admin', '$2a$12$zTRYyYVrTmIMhdgkS2LY7.5TXiR0yb95bb9QVvJ4Y3UHZJRQTVPRW', 'admin', 'Admin', 1),
--George Pass: pwd
--Lisa Pass: pwd
	('george@mail.com', '$2a$12$XFSm1i.8b0URsvtBs1JqSehmFo1w1TUS.yHmZTEtdRqG2gHoyLzby', 'george', 'Customer', '1'),
	('lisa@mail.com', '$2a$12$XFSm1i.8b0URsvtBs1JqSehmFo1w1TUS.yHmZTEtdRqG2gHoyLzby', 'lisa', 'Customer', '1');