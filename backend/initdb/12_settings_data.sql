INSERT INTO settings ( delivery_distance, discount, service_fee) VALUES
(10, 3, 13);
--percent for percent discounts like 5%
--and amount for fixed amounts like 10€
INSERT INTO discount_codes (code, percent, amount) VALUES
('disc', 5, null),
('dis43', null, 5.00),
('less50', 50, null),
('reduce10', null, 10.00);