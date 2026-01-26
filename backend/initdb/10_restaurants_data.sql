
INSERT INTO r_status (name, description) VALUES
('Active', 'Standard'),
('Pending', 'To be accepted by the Admin'),
('Suspended', 'Restaurant violated terms of service');

INSERT INTO restaurants (
    name,
    email,
    phone,
    delivery_zone,
    opening_hours,
    user_id,
    status_id,
    location
) VALUES
      (
          'SpeedEat',
          'speed.eat@mail.com',
          '95839682',
          '3 km radius',
          '{
            "mon": {"label":"Mon","closed":false,"open":"09:00","close":"18:00"},
            "tue": {"label":"Tue","closed":false,"open":"09:00","close":"18:00"},
            "wed": {"label":"Wed","closed":false,"open":"09:00","close":"18:00"},
            "thu": {"label":"Thu","closed":false,"open":"09:00","close":"18:00"},
            "fri": {"label":"Fri","closed":false,"open":"09:00","close":"20:00"},
            "sat": {"label":"Sat","closed":false,"open":"10:00","close":"20:00"},
            "sun": {"label":"Sun","closed":true,"open":"00:00","close":"00:00"}
          }'::jsonb,
          4,
          1,
          '{"type":"Point","coordinates":[14.299591003901329,46.62504993899363]}'
      ),
      (
          'Gimme Foods',
          'gimme.foods@email.com',
          '8533455',
          '5 km radius',
          '{
            "mon": {"label":"Mon","closed":false,"open":"10:00","close":"18:00"},
            "tue": {"label":"Tue","closed":false,"open":"10:00","close":"18:00"},
            "wed": {"label":"Wed","closed":false,"open":"10:00","close":"18:00"},
            "thu": {"label":"Thu","closed":false,"open":"10:00","close":"18:00"},
            "fri": {"label":"Fri","closed":false,"open":"10:00","close":"20:00"},
            "sat": {"label":"Sat","closed":false,"open":"12:00","close":"20:00"},
            "sun": {"label":"Sun","closed":true,"open":"00:00","close":"00:00"}
          }'::jsonb,
          5,
          2,
          '{"type":"Point","coordinates":[14.295221891287628,46.602274114923205]}'
      );


INSERT INTO categories (name, description, restaurant_id) VALUES
('fish', 'contains fish', 1),
('vegan', 'does not contain animal products', 1),
('vegitarian', 'no meat included', 1),
('curry', 'part of the curry collection', 2),
('pasta', 'part of the past collection', 2),
('dessert', 'part of the dessert collection', 2);

INSERT INTO r_dishes (name, description, price, restaurant_id, category_id) VALUES
('sweet treat', 'strawberry cheese cake', 1.50, 2, 6),
('spaghetti', 'spaghetti cabonara', 2.67, 2, 5),
('mixed salat', 'karrots, radish, cabage in one salat', 0.90, 1, 2),
('fish sticks', 'sticks of very tasty fish', 3.50, 1, 1);