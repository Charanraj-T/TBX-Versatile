-- ==============================================================================
-- TBX FinOps Assistant (Tiby) - Database Schema
-- Project: TransBnk / Tiby Finance Assistant
-- Tables: bank, account, transaction
-- ==============================================================================

DROP VIEW IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS transaction CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS bank CASCADE;

-- 1. Bank Table
CREATE TABLE bank (
    bank_code VARCHAR(10) PRIMARY KEY,
    bank_name VARCHAR(150) NOT NULL
);

-- 2. Account Table
CREATE TABLE account (
    account_id        VARCHAR(36) PRIMARY KEY,
    entity_id         VARCHAR(36) NOT NULL,
    account_number    VARCHAR(20) NOT NULL,
    program_id        INT NOT NULL,
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    bank_code         VARCHAR(10) NOT NULL REFERENCES bank(bank_code)
);

-- 3. Transaction Table
CREATE TABLE transaction (
    transaction_id           VARCHAR(36) PRIMARY KEY,
    account_id               VARCHAR(36) NOT NULL REFERENCES account(account_id),
    transaction_date         TIMESTAMP(6) NOT NULL,
    transaction_type         VARCHAR(10) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    description              VARCHAR(500) DEFAULT NULL,
    transaction_amount       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    transaction_reference_id VARCHAR(64) DEFAULT NULL,
    utr_number               VARCHAR(256) DEFAULT NULL
);

-- Compatibility view for plural reference
CREATE OR REPLACE VIEW transactions AS SELECT * FROM transaction;

-- Performance Indexes
CREATE INDEX idx_account_bank_code ON account(bank_code);
CREATE INDEX idx_account_entity_id ON account(entity_id);
CREATE INDEX idx_account_number ON account(account_number);
CREATE INDEX idx_transaction_account_id ON transaction(account_id);
CREATE INDEX idx_transaction_date ON transaction(transaction_date);
CREATE INDEX idx_transaction_ref_id ON transaction(transaction_reference_id);
CREATE INDEX idx_transaction_type ON transaction(transaction_type);
