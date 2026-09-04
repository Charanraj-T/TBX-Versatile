-- ==============================================================================
-- DEMO DATA — REPLACE WITH TBX DATASET
-- TBX FinOps Assistant - Seed Data (10-20 sample records)
-- ==============================================================================

-- Insert Vendors
INSERT INTO vendors (id, name, category, status) VALUES
(1, 'Vendor A', 'Cloud Infrastructure', 'ACTIVE'),
(2, 'Vendor B', 'SaaS Subscriptions', 'ACTIVE'),
(3, 'Vendor C', 'Security & Compliance', 'ACTIVE'),
(4, 'Vendor D', 'Consulting Services', 'ACTIVE');

-- Reset vendor sequence
SELECT setval('vendors_id_seq', (SELECT MAX(id) FROM vendors));

-- Insert Transactions
-- Vendor A: Jan ($75,000) + Feb ($50,000) = $125,000 total
INSERT INTO transactions (id, vendor_id, amount, currency, description, transaction_date, department, status) VALUES
(1,  1, 50000.00, 'USD', 'Compute cluster instances - us-east', '2025-01-15', 'Engineering', 'COMPLETED'),
(2,  1, 25000.00, 'USD', 'Object storage ingress & egress',    '2025-01-28', 'Engineering', 'COMPLETED'),
(3,  1, 30000.00, 'USD', 'Managed PostgreSQL cluster hosting', '2025-02-10', 'Data Platform', 'COMPLETED'),
(4,  1, 20000.00, 'USD', 'CDN & network bandwidth transfer',   '2025-02-22', 'Engineering', 'COMPLETED'),

-- Vendor B: Jan ($15,000) + Feb ($23,500) = $38,500 total
(5,  2, 15000.00, 'USD', 'Product analytics enterprise license', '2025-01-05', 'Product',     'COMPLETED'),
(6,  2, 15000.00, 'USD', 'Product analytics enterprise license', '2025-02-05', 'Product',     'COMPLETED'),
(7,  2,  8500.00, 'USD', 'Customer success seats add-on',       '2025-02-18', 'Support',     'COMPLETED'),

-- Vendor C: Total $44,500
(8,  3, 12000.00, 'USD', 'SOC2 continuous monitoring platform',  '2025-01-20', 'Security',    'COMPLETED'),
(9,  3, 14500.00, 'USD', 'Penetration testing & audit report',  '2025-02-14', 'Security',    'COMPLETED'),
(10, 3, 18000.00, 'USD', 'Identity & access management license', '2025-03-01', 'IT Ops',      'COMPLETED'),

-- Vendor D: Total $12,200
(11, 4,  5000.00, 'USD', 'Cloud FinOps advisory workshop',      '2025-01-12', 'Finance',     'COMPLETED'),
(12, 4,  7200.00, 'USD', 'Kubernetes cost optimization review',  '2025-02-20', 'Engineering', 'COMPLETED');

-- Reset transactions sequence
SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));

-- Insert Payments
INSERT INTO payments (id, transaction_id, paid_amount, payment_method, payment_date, reference_code, status) VALUES
(1,  1,  50000.00, 'ACH_TRANSFER', '2025-01-20', 'PAY-2025-001', 'SETTLED'),
(2,  2,  25000.00, 'ACH_TRANSFER', '2025-02-01', 'PAY-2025-002', 'SETTLED'),
(3,  3,  30000.00, 'ACH_TRANSFER', '2025-02-15', 'PAY-2025-003', 'SETTLED'),
(4,  4,  20000.00, 'ACH_TRANSFER', '2025-02-28', 'PAY-2025-004', 'SETTLED'),
(5,  5,  15000.00, 'CORPORATE_CARD', '2025-01-06', 'PAY-2025-005', 'SETTLED'),
(6,  6,  15000.00, 'CORPORATE_CARD', '2025-02-06', 'PAY-2025-006', 'SETTLED'),
(7,  7,   8500.00, 'CORPORATE_CARD', '2025-02-19', 'PAY-2025-007', 'SETTLED'),
(8,  8,  12000.00, 'WIRE_TRANSFER',  '2025-01-25', 'PAY-2025-008', 'SETTLED'),
(9,  9,  14500.00, 'WIRE_TRANSFER',  '2025-02-20', 'PAY-2025-009', 'SETTLED'),
(10, 10, 18000.00, 'WIRE_TRANSFER',  '2025-03-05', 'PAY-2025-010', 'SETTLED'),
(11, 11,  5000.00, 'ACH_TRANSFER',   '2025-01-18', 'PAY-2025-011', 'SETTLED'),
(12, 12,  7200.00, 'ACH_TRANSFER',   '2025-02-25', 'PAY-2025-012', 'SETTLED');

-- Reset payments sequence
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

