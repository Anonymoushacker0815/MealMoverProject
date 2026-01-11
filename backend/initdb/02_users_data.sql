INSERT INTO u_status (name, description) VALUES
     ('Active', 'Standard'),
     ('Suspended', 'User violated terms of service');

INSERT INTO users(email, password, username, user_type, status_id) VALUES
	('admin', 'admin', 'admin', 'Admin', 1),
	('george@mail.com', 'pwd', 'george', 'Customer', '1'),
	('lisa@mail.com', 'pwd', 'lisa', 'Customer', '1');