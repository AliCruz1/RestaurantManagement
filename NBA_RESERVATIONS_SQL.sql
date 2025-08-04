-- NBA Player Reservations - Copy this entire block into Supabase SQL Editor
-- Generated on: 2025-08-02T23:56:34.008Z
-- Total: 193 reservations with mix of past/future dates, various party sizes, all statuses
-- Both guest and authenticated user reservations
-- Fixed to respect check_reservation_owner constraint

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status) 
VALUES ('LeBron James', 'theking@lakers.com', '323-555-2023', 2, '2025-07-20T01:00:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('LeBron James', 'theking@lakers.com', '323-555-2023', 4, '2025-08-04T21:00:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('LeBron James', 'theking@lakers.com', '323-555-2023', 4, '2025-08-24T00:30:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('LeBron James', 'theking@lakers.com', '323-555-2023', 6, '2025-07-07T01:45:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Stephen Curry', 'chef.curry@warriors.net', '415-555-3030', 2, '2025-07-17T00:30:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Stephen Curry', 'chef.curry@warriors.net', '415-555-3030', 12, '2025-08-21T22:00:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Stephen Curry', 'chef.curry@warriors.net', '415-555-3030', 4, '2025-08-16T22:00:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Stephen Curry', 'chef.curry@warriors.net', '415-555-3030', 12, '2025-09-16T23:30:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Stephen Curry', 'chef.curry@warriors.net', '415-555-3030', 4, '2025-07-22T00:45:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Kevin Durant', 'kd35@suns.basketball', '602-555-3535', 6, '2025-09-29T23:45:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Kevin Durant', 'kd35@suns.basketball', '602-555-3535', 10, '2025-09-29T22:15:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kevin Durant', 'kd35@suns.basketball', '602-555-3535', 8, '2025-08-13T00:30:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Kevin Durant', 'kd35@suns.basketball', '602-555-3535', 6, '2025-08-20T21:45:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kevin Durant', 'kd35@suns.basketball', '602-555-3535', 12, '2025-07-14T00:30:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Giannis Antetokounmpo', 'greek.freak@bucks.mil', '414-555-3434', 12, '2025-09-24T22:30:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Giannis Antetokounmpo', 'greek.freak@bucks.mil', '414-555-3434', 6, '2025-08-05T01:00:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Giannis Antetokounmpo', 'greek.freak@bucks.mil', '414-555-3434', 2, '2025-09-25T21:30:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Giannis Antetokounmpo', 'greek.freak@bucks.mil', '414-555-3434', 8, '2025-08-19T21:00:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Luka Dončić', 'luka.magic@mavs.dallas', '214-555-7777', 12, '2025-09-21T01:45:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Luka Dončić', 'luka.magic@mavs.dallas', '214-555-7777', 4, '2025-09-12T01:30:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Luka Dončić', 'luka.magic@mavs.dallas', '214-555-7777', 12, '2025-08-09T01:00:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Luka Dončić', 'luka.magic@mavs.dallas', '214-555-7777', 6, '2025-07-18T21:30:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Luka Dončić', 'luka.magic@mavs.dallas', '214-555-7777', 4, '2025-07-29T00:45:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jayson Tatum', 'jt.deuce@celtics.com', '617-555-0017', 4, '2025-08-22T22:15:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jayson Tatum', 'jt.deuce@celtics.com', '617-555-0017', 2, '2025-07-23T00:45:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jayson Tatum', 'jt.deuce@celtics.com', '617-555-0017', 4, '2025-09-19T23:15:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Joel Embiid', 'the.process@sixers.phila', '215-555-2121', 2, '2025-09-04T00:15:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Joel Embiid', 'the.process@sixers.phila', '215-555-2121', 8, '2025-09-01T00:15:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Joel Embiid', 'the.process@sixers.phila', '215-555-2121', 4, '2025-08-16T00:45:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Nikola Jokić', 'big.honey@nuggets.den', '303-555-1515', 2, '2025-09-09T00:00:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Nikola Jokić', 'big.honey@nuggets.den', '303-555-1515', 2, '2025-08-13T23:45:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Nikola Jokić', 'big.honey@nuggets.den', '303-555-1515', 2, '2025-09-17T21:45:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jimmy Butler', 'jimmy.buckets@heat.miami', '305-555-2222', 2, '2025-07-05T21:30:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jimmy Butler', 'jimmy.buckets@heat.miami', '305-555-2222', 2, '2025-08-30T00:00:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jimmy Butler', 'jimmy.buckets@heat.miami', '305-555-2222', 4, '2025-07-31T00:00:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jimmy Butler', 'jimmy.buckets@heat.miami', '305-555-2222', 2, '2025-08-13T01:45:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kawhi Leonard', 'klaw@clippers.la', '213-555-0002', 2, '2025-09-09T23:00:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kawhi Leonard', 'klaw@clippers.la', '213-555-0002', 4, '2025-08-22T00:00:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Kawhi Leonard', 'klaw@clippers.la', '213-555-0002', 6, '2025-08-09T22:30:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kawhi Leonard', 'klaw@clippers.la', '213-555-0002', 4, '2025-08-04T23:15:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Ja Morant', 'ja12@grizzlies.mem', '901-555-1212', 2, '2025-09-30T01:45:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Ja Morant', 'ja12@grizzlies.mem', '901-555-1212', 2, '2025-07-07T23:45:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Ja Morant', 'ja12@grizzlies.mem', '901-555-1212', 6, '2025-07-08T01:15:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Ja Morant', 'ja12@grizzlies.mem', '901-555-1212', 4, '2025-08-30T01:30:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Zion Williamson', 'zion1@pelicans.nola', '504-555-0001', 4, '2025-07-08T01:30:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Zion Williamson', 'zion1@pelicans.nola', '504-555-0001', 4, '2025-07-29T22:00:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Zion Williamson', 'zion1@pelicans.nola', '504-555-0001', 12, '2025-07-30T22:00:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Trae Young', 'ice.trae@hawks.atl', '404-555-1111', 4, '2025-08-04T22:45:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Trae Young', 'ice.trae@hawks.atl', '404-555-1111', 4, '2025-07-21T22:30:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Trae Young', 'ice.trae@hawks.atl', '404-555-1111', 12, '2025-08-26T22:00:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Trae Young', 'ice.trae@hawks.atl', '404-555-1111', 2, '2025-08-18T01:45:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Trae Young', 'ice.trae@hawks.atl', '404-555-1111', 10, '2025-07-20T00:30:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Devin Booker', 'book1@suns.phx', '602-555-0001', 12, '2025-08-09T22:30:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Devin Booker', 'book1@suns.phx', '602-555-0001', 6, '2025-07-26T00:30:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Devin Booker', 'book1@suns.phx', '602-555-0001', 4, '2025-07-25T22:15:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Devin Booker', 'book1@suns.phx', '602-555-0001', 4, '2025-08-02T01:45:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Donovan Mitchell', 'spida45@cavs.cleveland', '216-555-4545', 12, '2025-07-19T22:00:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Donovan Mitchell', 'spida45@cavs.cleveland', '216-555-4545', 4, '2025-07-21T22:45:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Donovan Mitchell', 'spida45@cavs.cleveland', '216-555-4545', 8, '2025-09-21T23:30:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Donovan Mitchell', 'spida45@cavs.cleveland', '216-555-4545', 10, '2025-08-14T22:30:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Donovan Mitchell', 'spida45@cavs.cleveland', '216-555-4545', 4, '2025-07-30T22:15:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('De''Aaron Fox', 'swipa@kings.sac', '916-555-0005', 4, '2025-09-06T00:45:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('De''Aaron Fox', 'swipa@kings.sac', '916-555-0005', 6, '2025-09-02T22:00:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('De''Aaron Fox', 'swipa@kings.sac', '916-555-0005', 2, '2025-07-29T01:45:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('De''Aaron Fox', 'swipa@kings.sac', '916-555-0005', 4, '2025-09-18T22:30:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Anthony Edwards', 'ant1@wolves.minn', '612-555-0001', 12, '2025-08-11T23:15:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Anthony Edwards', 'ant1@wolves.minn', '612-555-0001', 6, '2025-07-18T23:00:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Anthony Edwards', 'ant1@wolves.minn', '612-555-0001', 8, '2025-09-22T22:45:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Paolo Banchero', 'paolo5@magic.orlando', '407-555-0005', 2, '2025-07-27T21:30:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Paolo Banchero', 'paolo5@magic.orlando', '407-555-0005', 12, '2025-08-23T01:45:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Paolo Banchero', 'paolo5@magic.orlando', '407-555-0005', 2, '2025-09-15T01:45:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Paolo Banchero', 'paolo5@magic.orlando', '407-555-0005', 4, '2025-09-14T22:15:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Paolo Banchero', 'paolo5@magic.orlando', '407-555-0005', 4, '2025-07-10T21:00:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Scottie Barnes', 'scottie4@raptors.toronto', '416-555-0004', 2, '2025-09-06T22:30:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Scottie Barnes', 'scottie4@raptors.toronto', '416-555-0004', 8, '2025-08-17T22:15:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Scottie Barnes', 'scottie4@raptors.toronto', '416-555-0004', 2, '2025-08-23T01:30:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Franz Wagner', 'franz22@magic.orlando', '407-555-0022', 4, '2025-07-31T01:45:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Franz Wagner', 'franz22@magic.orlando', '407-555-0022', 2, '2025-09-04T23:45:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Franz Wagner', 'franz22@magic.orlando', '407-555-0022', 6, '2025-09-23T01:45:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Franz Wagner', 'franz22@magic.orlando', '407-555-0022', 2, '2025-07-04T22:00:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Michael Jordan', 'his.airness@bulls.legend', '312-555-2323', 2, '2025-08-07T23:15:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Michael Jordan', 'his.airness@bulls.legend', '312-555-2323', 2, '2025-07-27T21:15:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Michael Jordan', 'his.airness@bulls.legend', '312-555-2323', 4, '2025-09-26T23:00:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Michael Jordan', 'his.airness@bulls.legend', '312-555-2323', 4, '2025-08-12T23:30:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Michael Jordan', 'his.airness@bulls.legend', '312-555-2323', 6, '2025-08-05T21:15:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kobe Bryant', 'mamba.mentality@lakers.forever', '323-555-2424', 12, '2025-07-15T21:00:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kobe Bryant', 'mamba.mentality@lakers.forever', '323-555-2424', 12, '2025-09-25T00:30:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Kobe Bryant', 'mamba.mentality@lakers.forever', '323-555-2424', 4, '2025-07-28T23:30:00.000Z', 'confirmed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Magic Johnson', 'magic32@showtime.lakers', '323-555-3232', 12, '2025-08-21T23:15:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Magic Johnson', 'magic32@showtime.lakers', '323-555-3232', 4, '2025-08-29T00:00:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Magic Johnson', 'magic32@showtime.lakers', '323-555-3232', 10, '2025-08-22T01:45:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Magic Johnson', 'magic32@showtime.lakers', '323-555-3232', 12, '2025-08-11T21:30:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Larry Bird', 'larry.legend@celtics.boston', '617-555-3333', 8, '2025-08-15T00:15:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Larry Bird', 'larry.legend@celtics.boston', '617-555-3333', 4, '2025-09-19T00:15:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Larry Bird', 'larry.legend@celtics.boston', '617-555-3333', 4, '2025-09-29T22:15:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Shaquille O''Neal', 'big.diesel@lakers.shaq', '323-555-3434', 4, '2025-09-23T01:30:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Shaquille O''Neal', 'big.diesel@lakers.shaq', '323-555-3434', 12, '2025-07-21T22:30:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Shaquille O''Neal', 'big.diesel@lakers.shaq', '323-555-3434', 4, '2025-09-27T01:30:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Shaquille O''Neal', 'big.diesel@lakers.shaq', '323-555-3434', 10, '2025-09-14T01:45:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Tim Duncan', 'big.fundamental@spurs.sa', '210-555-2121', 6, '2025-09-17T00:30:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Tim Duncan', 'big.fundamental@spurs.sa', '210-555-2121', 6, '2025-08-31T01:00:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Tim Duncan', 'big.fundamental@spurs.sa', '210-555-2121', 10, '2025-09-26T22:30:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Tim Duncan', 'big.fundamental@spurs.sa', '210-555-2121', 4, '2025-09-06T21:15:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Hakeem Olajuwon', 'the.dream@rockets.houston', '713-555-3434', 2, '2025-09-29T23:30:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Hakeem Olajuwon', 'the.dream@rockets.houston', '713-555-3434', 4, '2025-07-23T00:30:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Hakeem Olajuwon', 'the.dream@rockets.houston', '713-555-3434', 2, '2025-07-07T22:45:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Charles Barkley', 'sir.charles@suns.phoenix', '602-555-3434', 10, '2025-09-18T01:00:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Charles Barkley', 'sir.charles@suns.phoenix', '602-555-3434', 10, '2025-08-01T22:15:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Charles Barkley', 'sir.charles@suns.phoenix', '602-555-3434', 6, '2025-09-26T23:00:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Charles Barkley', 'sir.charles@suns.phoenix', '602-555-3434', 12, '2025-09-04T00:15:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Charles Barkley', 'sir.charles@suns.phoenix', '602-555-3434', 4, '2025-09-26T01:30:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Allen Iverson', 'the.answer@sixers.phila', '215-555-0003', 12, '2025-08-24T23:15:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Allen Iverson', 'the.answer@sixers.phila', '215-555-0003', 4, '2025-08-03T21:45:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Allen Iverson', 'the.answer@sixers.phila', '215-555-0003', 4, '2025-08-05T21:15:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Allen Iverson', 'the.answer@sixers.phila', '215-555-0003', 2, '2025-09-12T00:00:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Dirk Nowitzki', 'dirk41@mavs.dallas', '214-555-4141', 4, '2025-07-16T23:45:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Dirk Nowitzki', 'dirk41@mavs.dallas', '214-555-4141', 4, '2025-08-15T00:00:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Dirk Nowitzki', 'dirk41@mavs.dallas', '214-555-4141', 12, '2025-09-15T23:00:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Damian Lillard', 'dame.time@bucks.milwaukee', '414-555-0000', 10, '2025-07-18T21:30:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Damian Lillard', 'dame.time@bucks.milwaukee', '414-555-0000', 4, '2025-07-22T22:45:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Damian Lillard', 'dame.time@bucks.milwaukee', '414-555-0000', 12, '2025-09-12T01:00:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Damian Lillard', 'dame.time@bucks.milwaukee', '414-555-0000', 8, '2025-07-31T21:15:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Paul George', 'pg13@clippers.la', '213-555-1313', 2, '2025-09-04T00:30:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Paul George', 'pg13@clippers.la', '213-555-1313', 4, '2025-09-13T21:30:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Paul George', 'pg13@clippers.la', '213-555-1313', 12, '2025-09-13T23:45:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Paul George', 'pg13@clippers.la', '213-555-1313', 10, '2025-09-05T01:30:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Russell Westbrook', 'russ0@clippers.la', '213-555-0000', 2, '2025-08-22T00:45:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Russell Westbrook', 'russ0@clippers.la', '213-555-0000', 12, '2025-07-20T23:15:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Russell Westbrook', 'russ0@clippers.la', '213-555-0000', 6, '2025-07-19T21:45:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Russell Westbrook', 'russ0@clippers.la', '213-555-0000', 10, '2025-07-15T22:15:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Kyrie Irving', 'uncle.drew@mavs.dallas', '214-555-1111', 2, '2025-07-09T21:00:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kyrie Irving', 'uncle.drew@mavs.dallas', '214-555-1111', 2, '2025-08-25T01:45:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Kyrie Irving', 'uncle.drew@mavs.dallas', '214-555-1111', 12, '2025-07-12T23:00:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kyrie Irving', 'uncle.drew@mavs.dallas', '214-555-1111', 2, '2025-09-10T01:45:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Bradley Beal', 'bb3@suns.phoenix', '602-555-0003', 4, '2025-09-01T00:00:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Bradley Beal', 'bb3@suns.phoenix', '602-555-0003', 6, '2025-09-26T21:00:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Bradley Beal', 'bb3@suns.phoenix', '602-555-0003', 2, '2025-09-11T01:00:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jrue Holiday', 'jrue11@celtics.boston', '617-555-1111', 4, '2025-07-18T22:45:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jrue Holiday', 'jrue11@celtics.boston', '617-555-1111', 8, '2025-08-23T01:15:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Jrue Holiday', 'jrue11@celtics.boston', '617-555-1111', 2, '2025-08-14T21:30:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status) 
VALUES ('Jrue Holiday', 'jrue11@celtics.boston', '617-555-1111', 2, '2025-09-17T01:45:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kristaps Porziņģis', 'unicorn@celtics.boston', '617-555-0006', 6, '2025-08-05T21:15:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Kristaps Porziņģis', 'unicorn@celtics.boston', '617-555-0006', 2, '2025-07-08T21:30:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Kristaps Porziņģis', 'unicorn@celtics.boston', '617-555-0006', 4, '2025-09-25T23:00:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Kristaps Porziņģis', 'unicorn@celtics.boston', '617-555-0006', 6, '2025-09-04T22:15:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Tyler Herro', 'tyler14@heat.miami', '305-555-1414', 2, '2025-08-04T21:45:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Tyler Herro', 'tyler14@heat.miami', '305-555-1414', 8, '2025-09-30T21:15:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Tyler Herro', 'tyler14@heat.miami', '305-555-1414', 12, '2025-08-25T23:00:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Bam Adebayo', 'bam13@heat.miami', '305-555-1313', 2, '2025-07-17T00:15:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Bam Adebayo', 'bam13@heat.miami', '305-555-1313', 8, '2025-08-29T22:30:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Bam Adebayo', 'bam13@heat.miami', '305-555-1313', 6, '2025-07-14T22:00:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Shai Gilgeous-Alexander', 'shai2@thunder.okc', '405-555-0002', 2, '2025-07-28T21:30:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Shai Gilgeous-Alexander', 'shai2@thunder.okc', '405-555-0002', 2, '2025-08-19T00:45:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Shai Gilgeous-Alexander', 'shai2@thunder.okc', '405-555-0002', 6, '2025-07-17T00:15:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Victor Wembanyama', 'wemby1@spurs.sa', '210-555-0001', 10, '2025-08-29T23:15:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Victor Wembanyama', 'wemby1@spurs.sa', '210-555-0001', 2, '2025-09-20T00:45:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Victor Wembanyama', 'wemby1@spurs.sa', '210-555-0001', 8, '2025-08-14T22:30:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Alperen Şengün', 'sengun28@rockets.houston', '713-555-2828', 10, '2025-09-14T22:00:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Alperen Şengün', 'sengun28@rockets.houston', '713-555-2828', 2, '2025-08-30T22:45:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Alperen Şengün', 'sengun28@rockets.houston', '713-555-2828', 2, '2025-09-07T00:00:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Lauri Markkanen', 'lauri24@jazz.utah', '801-555-2424', 2, '2025-08-26T01:30:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Lauri Markkanen', 'lauri24@jazz.utah', '801-555-2424', 2, '2025-08-25T23:00:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Lauri Markkanen', 'lauri24@jazz.utah', '801-555-2424', 12, '2025-08-28T01:15:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Lauri Markkanen', 'lauri24@jazz.utah', '801-555-2424', 10, '2025-07-23T01:00:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Domantas Sabonis', 'sabonis10@kings.sac', '916-555-1010', 2, '2025-08-05T00:15:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Domantas Sabonis', 'sabonis10@kings.sac', '916-555-1010', 2, '2025-08-11T00:30:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Domantas Sabonis', 'sabonis10@kings.sac', '916-555-1010', 4, '2025-09-05T23:45:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Domantas Sabonis', 'sabonis10@kings.sac', '916-555-1010', 4, '2025-09-17T21:00:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Rudy Gobert', 'rudy27@wolves.minn', '612-555-2727', 8, '2025-07-06T01:15:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Rudy Gobert', 'rudy27@wolves.minn', '612-555-2727', 2, '2025-08-07T23:30:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Rudy Gobert', 'rudy27@wolves.minn', '612-555-2727', 10, '2025-07-28T23:45:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Rudy Gobert', 'rudy27@wolves.minn', '612-555-2727', 4, '2025-07-04T00:00:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Pascal Siakam', 'spicy.p@pacers.indiana', '317-555-4343', 12, '2025-08-13T00:45:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Pascal Siakam', 'spicy.p@pacers.indiana', '317-555-4343', 2, '2025-07-18T01:30:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Pascal Siakam', 'spicy.p@pacers.indiana', '317-555-4343', 8, '2025-07-07T23:15:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Pascal Siakam', 'spicy.p@pacers.indiana', '317-555-4343', 6, '2025-07-07T22:30:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Pascal Siakam', 'spicy.p@pacers.indiana', '317-555-4343', 6, '2025-07-24T23:00:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('OG Anunoby', 'og3@knicks.nyc', '212-555-0003', 12, '2025-07-25T01:15:00.000Z', 'no-show'); 

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('OG Anunoby', 'og3@knicks.nyc', '212-555-0003', 8, '2025-08-10T22:15:00.000Z', 'no-show');  

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('OG Anunoby', 'og3@knicks.nyc', '212-555-0003', 2, '2025-09-25T00:30:00.000Z', 'no-show');  

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('OG Anunoby', 'og3@knicks.nyc', '212-555-0003', 10, '2025-09-06T01:30:00.000Z', 'completed');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Evan Mobley', 'evan4@cavs.cleveland', '216-555-0004', 2, '2025-08-20T01:15:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Evan Mobley', 'evan4@cavs.cleveland', '216-555-0004', 2, '2025-08-05T22:45:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Evan Mobley', 'evan4@cavs.cleveland', '216-555-0004', 4, '2025-09-22T22:15:00.000Z', 'no-show');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Evan Mobley', 'evan4@cavs.cleveland', '216-555-0004', 2, '2025-08-26T01:00:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Cade Cunningham', 'cade2@pistons.detroit', '313-555-0002', 2, '2025-07-29T23:00:00.000Z', 'completed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Cade Cunningham', 'cade2@pistons.detroit', '313-555-0002', 6, '2025-07-23T00:00:00.000Z', 'pending');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Cade Cunningham', 'cade2@pistons.detroit', '313-555-0002', 2, '2025-09-10T00:30:00.000Z', 'cancelled');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Cade Cunningham', 'cade2@pistons.detroit', '313-555-0002', 2, '2025-07-08T01:45:00.000Z', 'no-show');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jalen Green', 'jalen4@rockets.houston', '713-555-0004', 2, '2025-08-19T00:15:00.000Z', 'confirmed');

INSERT INTO reservations (name, email, phone, party_size, datetime, status)
VALUES ('Jalen Green', 'jalen4@rockets.houston', '713-555-0004', 2, '2025-08-16T01:45:00.000Z', 'pending');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Jalen Green', 'jalen4@rockets.houston', '713-555-0004', 6, '2025-08-15T00:15:00.000Z', 'cancelled');

INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, datetime, status)
VALUES ('Jalen Green', 'jalen4@rockets.houston', '713-555-0004', 6, '2025-08-28T21:15:00.000Z', 'completed');

-- End of NBA Reservations
-- Total: 193 reservations
-- Mix of past/future dates, various party sizes, all statuses
-- Both guest and authenticated user reservations
