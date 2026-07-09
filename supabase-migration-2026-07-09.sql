-- ============================================================
-- Twin Loop Pricing Update — 2026-07-09
-- Run this entire script in the Supabase SQL Editor (once only)
--
-- Cover material costs updated to match
-- "Twin Loop Pricing Reference (002).xlsx" (Covers sheet).
-- Frosted and Poly Prop (0.6mm) already matched live data — no change.
-- ============================================================

-- ── PVC ─────────────────────────────────────────────────────────────────────
UPDATE covers SET cost = 0.20 WHERE name = 'PVC' AND leaf_size = 'A6'; -- was 0.10
UPDATE covers SET cost = 0.12 WHERE name = 'PVC' AND leaf_size = 'A5'; -- was 0.10
UPDATE covers SET cost = 0.22 WHERE name = 'PVC' AND leaf_size = 'B5'; -- was 0.20
UPDATE covers SET cost = 0.22 WHERE name = 'PVC' AND leaf_size = 'A4'; -- was 0.20
UPDATE covers SET cost = 0.40 WHERE name = 'PVC' AND leaf_size = 'A3'; -- was 0.35

-- ── Leathergrain - Black ────────────────────────────────────────────────────
UPDATE covers SET cost = 0.11 WHERE name = 'Leathergrain - Black' AND leaf_size = 'A6'; -- was 0.10
UPDATE covers SET cost = 0.11 WHERE name = 'Leathergrain - Black' AND leaf_size = 'A5'; -- was 0.10
UPDATE covers SET cost = 0.22 WHERE name = 'Leathergrain - Black' AND leaf_size = 'B5'; -- was 0.20
UPDATE covers SET cost = 0.22 WHERE name = 'Leathergrain - Black' AND leaf_size = 'A4'; -- was 0.20
UPDATE covers SET cost = 0.40 WHERE name = 'Leathergrain - Black' AND leaf_size = 'A3'; -- was 0.35

-- ── Leathergrain - Coloured ─────────────────────────────────────────────────
UPDATE covers SET cost = 0.12 WHERE name = 'Leathergrain - Coloured' AND leaf_size = 'A6'; -- was 0.10
UPDATE covers SET cost = 0.12 WHERE name = 'Leathergrain - Coloured' AND leaf_size = 'A5'; -- was 0.10
UPDATE covers SET cost = 0.25 WHERE name = 'Leathergrain - Coloured' AND leaf_size = 'B5'; -- was 0.22
UPDATE covers SET cost = 0.25 WHERE name = 'Leathergrain - Coloured' AND leaf_size = 'A4'; -- was 0.22
UPDATE covers SET cost = 0.40 WHERE name = 'Leathergrain - Coloured' AND leaf_size = 'A3'; -- was 0.35

-- ── Plain Backing Boards ────────────────────────────────────────────────────
UPDATE covers SET cost = 0.11 WHERE name = 'Plain Backing Boards' AND leaf_size = 'A6'; -- was 0.10
UPDATE covers SET cost = 0.11 WHERE name = 'Plain Backing Boards' AND leaf_size = 'A5'; -- was 0.10
UPDATE covers SET cost = 0.22 WHERE name = 'Plain Backing Boards' AND leaf_size = 'B5'; -- was 0.20
UPDATE covers SET cost = 0.22 WHERE name = 'Plain Backing Boards' AND leaf_size = 'A4'; -- was 0.20
UPDATE covers SET cost = 0.40 WHERE name = 'Plain Backing Boards' AND leaf_size = 'A3'; -- was 0.35
