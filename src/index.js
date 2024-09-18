import { PGlite } from "@electric-sql/pglite";

// this starts an in-memory database
const db = new PGlite();

await db.exec(`
	CREATE TABLE users (
			id bigint primary key generated always as identity,
			name text NOT NULL,
			email text UNIQUE NOT NULL,
			created_at timestamp with time zone DEFAULT now()
	);

	CREATE TABLE cars (
			id bigint primary key generated always as identity,
			user_id bigint NOT NULL REFERENCES users(id),
			make text NOT NULL,
			model text NOT NULL,
			year integer NOT NULL,
			created_at timestamp with time zone DEFAULT now()
	);

	INSERT INTO users (name, email)
	SELECT 
			'User ' || i, 
			'user' || i || '@example.com'
	FROM generate_series(1, 100) AS s(i);

	DO $$
	DECLARE
			car_makes text[] := ARRAY['Toyota', 'Ford', 'Chevrolet', 'Honda', 'Nissan'];
			car_models text[] := ARRAY['Corolla', 'F-150', 'Camaro', 'Civic', 'Altima'];
			num_cars int;
	BEGIN
			-- Clear existing data
			TRUNCATE TABLE cars;

			-- Insert cars for each user with random count between 1 and 3
			FOR i IN 1..20 LOOP
					num_cars := (random() * 3 + 1)::int;  -- Número aleatório entre 1 e 3
					user_selected = (floor(random() * 100) + 1)::int;
					FOR j IN 1..num_cars LOOP
							INSERT INTO cars (user_id, make, model, year)
							VALUES (
									user_selected,
									car_makes[(floor(random() * array_length(car_makes, 1)) + 1)::int],
									car_models[(floor(random() * array_length(car_models, 1)) + 1)::int],
									2000 + (random() * 23)::int
							);
					END LOOP;
			END LOOP;
	END $$;
`);

const res = await db.query(`
	-- Check distribution of car counts
	SELECT car_count, COUNT(*) as user_count
	FROM (
		SELECT u.id, COUNT(c.id) as car_count
    FROM users u JOIN cars c ON u.id = c.user_id
    GROUP BY u.id
	) as user_car_counts
	GROUP BY car_count
	ORDER BY car_count;
`);
console.log(res.rows);

const ret = await db.query(`
	SELECT u.name AS user_name, COUNT(c.id) AS car_count
	FROM users u JOIN cars c ON u.id = c.user_id
	WHERE u.id IN (SELECT user_id FROM cars WHERE make = 'Toyota')
	GROUP BY u.name
	ORDER BY car_count DESC
	LIMIT 5;
`);
console.log(ret.rows);

const ret1 = await db.query(`
	SELECT u.name AS user_name,
		STRING_AGG(c.make || ' ' || c.model || ' (' || c.year || ')', ', ') AS car_list,
		COUNT(c.id) AS car_count
	FROM users u JOIN cars c ON u.id = c.user_id
	WHERE u.id IN (SELECT user_id FROM cars WHERE make = 'Toyota')
	GROUP BY u.name
	ORDER BY car_count DESC
	LIMIT 5;
`);
console.log(ret1.rows);
