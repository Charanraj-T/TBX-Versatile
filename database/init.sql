-- ==============================================================================
-- DEMO DATA — REPLACE WITH TBX DATASET
-- TBX FinOps Assistant - Initial Schema
-- ==============================================================================

-- Drop tables if they exist (for clean initialization)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- 1. Vendors Table
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    transaction_date DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    paid_amount NUMERIC(12, 2) NOT NULL CHECK (paid_amount >= 0),
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    reference_code VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'SETTLED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

