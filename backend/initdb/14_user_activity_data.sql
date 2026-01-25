INSERT INTO user_activity_events (user_id, event_type, created_at)
VALUES
  ((SELECT id FROM users WHERE email='george@mail.com'), 'login', NOW() - INTERVAL '6 days'),
  ((SELECT id FROM users WHERE email='george@mail.com'), 'login', NOW() - INTERVAL '3 days'),
  ((SELECT id FROM users WHERE email='george@mail.com'), 'login', NOW() - INTERVAL '1 day'),

  ((SELECT id FROM users WHERE email='lisa@mail.com'), 'login', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM users WHERE email='lisa@mail.com'), 'login', NOW() - INTERVAL '2 days'),

  ((SELECT id FROM users WHERE email='markus@mail.com'), 'login', NOW() - INTERVAL '6 days'),
  ((SELECT id FROM users WHERE email='markus@mail.com'), 'login', NOW() - INTERVAL '4 days'),
  ((SELECT id FROM users WHERE email='markus@mail.com'), 'login', NOW() - INTERVAL '1 day'),

  ((SELECT id FROM users WHERE email='max@mail.com'), 'login', NOW() - INTERVAL '4 days'),
  ((SELECT id FROM users WHERE email='max@mail.com'), 'login', NOW() - INTERVAL '2 days');

INSERT INTO user_activity_events (user_id, event_type, created_at, meta)
VALUES
  ((SELECT id FROM users WHERE email='george@mail.com'), 'register', NOW() - INTERVAL '30 days', jsonb_build_object('user_type','Customer')),
  ((SELECT id FROM users WHERE email='lisa@mail.com'), 'register', NOW() - INTERVAL '20 days', jsonb_build_object('user_type','Customer')),
  ((SELECT id FROM users WHERE email='markus@mail.com'), 'register', NOW() - INTERVAL '14 days', jsonb_build_object('user_type','Restaurant')),
  ((SELECT id FROM users WHERE email='max@mail.com'), 'register', NOW() - INTERVAL '10 days', jsonb_build_object('user_type','Restaurant'));

INSERT INTO user_activity_events (user_id, event_type, actor_user_id, created_at, meta)
VALUES
  (
    (SELECT id FROM users WHERE email='markus@mail.com'),
    'status_change',
    (SELECT id FROM users WHERE email='admin'),
    NOW() - INTERVAL '2 days',
    jsonb_build_object('from','Pending','to','Active')
  ),
  (
    (SELECT id FROM users WHERE email='max@mail.com'),
    'status_change',
    (SELECT id FROM users WHERE email='admin'),
    NOW() - INTERVAL '1 day',
    jsonb_build_object('from','Active','to','Suspended')
  );
