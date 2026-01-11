INSERT INTO ustatus (name, description) VALUES
     ('Active', 'Standard'),
     ('Suspended', 'User violated terms of service');

Insert into users(email, password, username, user_type, status_id) values
	('admin', 'admin', 'admin', 'Admin', 1),
	('george@mail.com', 'pwd', 'george', 'Customer', '1');