-- ============================================================
-- Twin Loop Pricing Update — 2026-07-01
-- Run this entire script in the Supabase SQL Editor (once only)
-- ============================================================

-- ── 1. EXTRAS: Add Buckram Material and Leather Material (Case Binding only, +$3/book)
INSERT INTO extras (name, cost, exclude_bindings, only_bindings) VALUES
  ('Buckram Material', 3.00, '{}', '{"Case Binding"}'),
  ('Leather Material', 3.00, '{}', '{"Case Binding"}');
