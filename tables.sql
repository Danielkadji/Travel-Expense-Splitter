-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(60) NOT NULL
);

-- Index on 'email' for quick user lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON users (email);

-- Create the 'trips' table
CREATE TABLE IF NOT EXISTS trips (
    trip_id UUID PRIMARY KEY,
    trip_name VARCHAR(100) NOT NULL,
    trip_date DATE NOT NULL,
    creator_id UUID REFERENCES users(user_id)
);

-- Index on 'creator_id' for quick trips created by a specific user
CREATE INDEX IF NOT EXISTS idx_trip_creator_id ON trips (creator_id);

-- Create the 'expenses' table
CREATE TABLE IF NOT EXISTS expenses (
    expense_id serial PRIMARY KEY,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    trip_id UUID REFERENCES trips(trip_id),
    user_id UUID REFERENCES users(user_id)
);

-- Index on 'trip_id' for improved expense retrieval for a specific trip
CREATE INDEX IF NOT EXISTS idx_expense_trip_id ON expenses (trip_id);

-- Create the 'payments' table
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payer_id UUID REFERENCES users(user_id),
    payee_id UUID REFERENCES users(user_id),
    trip_id UUID REFERENCES trips(trip_id)
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payment_payer_id ON payments (payer_id);
CREATE INDEX IF NOT EXISTS idx_payment_trip_id ON payments (trip_id);

