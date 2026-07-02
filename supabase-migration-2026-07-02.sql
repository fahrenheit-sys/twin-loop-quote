-- ============================================================
-- Twin Loop Pricing Update — 2026-07-02
-- Run this entire script in the Supabase SQL Editor (once only)
--
-- The 2026-06-29 migration's volume_discount changes were never
-- actually applied to the live database (it still had the old
-- single-tier structure with no binding_type column). This
-- reissues that fix using the exact bracket table supplied by
-- the client, split into per-category rows.
-- ============================================================

ALTER TABLE volume_discount ADD COLUMN IF NOT EXISTS binding_type text DEFAULT 'general';

DELETE FROM volume_discount;

-- Wire Binding, Plastic Spiral, Plastic Comb (all read the 'general' bucket)
INSERT INTO volume_discount (start_qty, end_qty, rate, binding_type) VALUES
  (1,     200,    0.00, 'general'),
  (201,   2000,   0.05, 'general'),
  (2001,  5000,   0.10, 'general'),
  (5001,  10000,  0.15, 'general'),
  (10001, 50000,  0.20, 'general'),
  (50001, 100000, 0.20, 'general');

-- Case Binding
INSERT INTO volume_discount (start_qty, end_qty, rate, binding_type) VALUES
  (1,   20,    0.00, 'Case Binding'),
  (21,  30,    0.10, 'Case Binding'),
  (31,  50,    0.15, 'Case Binding'),
  (51,  100,   0.30, 'Case Binding'),
  (101, 200,   0.40, 'Case Binding'),
  (201, 300,   0.50, 'Case Binding'),
  (301, 500,   0.55, 'Case Binding'),
  (501, 10000, 0.60, 'Case Binding');

-- Perfect Binding (stored as 'Prefect Binding' to match the codebase's existing typo)
INSERT INTO volume_discount (start_qty, end_qty, rate, binding_type) VALUES
  (1,     100,    0.00, 'Prefect Binding'),
  (101,   500,    0.05, 'Prefect Binding'),
  (501,   2000,   0.10, 'Prefect Binding'),
  (2001,  5000,   0.15, 'Prefect Binding'),
  (5001,  10000,  0.20, 'Prefect Binding'),
  (10001, 100000, 0.20, 'Prefect Binding');
