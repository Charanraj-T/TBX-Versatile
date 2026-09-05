CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS bank (
    bank_code VARCHAR(10) PRIMARY KEY,
    bank_name VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS account (
    account_id VARCHAR(36) PRIMARY KEY,
    entity_id VARCHAR(36) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    program_id INT NOT NULL,
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    bank_code VARCHAR(10) NOT NULL REFERENCES bank(bank_code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaction (
    transaction_id VARCHAR(36) PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
    transaction_date TIMESTAMP(6) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    description VARCHAR(500) DEFAULT NULL,
    transaction_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    transaction_reference_id VARCHAR(64) DEFAULT NULL,
    utr_number VARCHAR(256) DEFAULT NULL
);

CREATE OR REPLACE VIEW transactions AS 
SELECT * FROM transaction;

CREATE INDEX idx_account_bank_code ON account(bank_code);
CREATE INDEX idx_account_entity_id ON account(entity_id);
CREATE INDEX idx_account_number ON account(account_number);
CREATE INDEX idx_transaction_account_id ON transaction(account_id);
CREATE INDEX idx_transaction_date ON transaction(transaction_date);
CREATE INDEX idx_transaction_type ON transaction(transaction_type);
CREATE INDEX idx_transaction_ref_id ON transaction(transaction_reference_id);
CREATE INDEX idx_txn_utr ON transaction(utr_number);

CREATE INDEX idx_txn_acc_date ON transaction(account_id, transaction_date DESC);
CREATE INDEX idx_txn_date_type ON transaction(transaction_date DESC, transaction_type);

CREATE INDEX idx_txn_desc_trgm ON transaction USING gin (description gin_trgm_ops);
CREATE INDEX idx_account_number_trgm ON account USING gin (account_number gin_trgm_ops);
CREATE INDEX idx_txn_utr_trgm ON transaction USING gin (utr_number gin_trgm_ops);

CREATE INDEX idx_account_id_prefix ON account (account_id varchar_pattern_ops);
CREATE INDEX idx_txn_id_prefix ON transaction (transaction_id varchar_pattern_ops);
CREATE INDEX idx_txn_ref_prefix ON transaction (transaction_reference_id varchar_pattern_ops);