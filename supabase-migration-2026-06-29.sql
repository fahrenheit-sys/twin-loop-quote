-- ============================================================
-- Twin Loop Pricing Update — 2026-06-29
-- Run this entire script in the Supabase SQL Editor (once only)
-- ============================================================

-- ── 1. CELLO GLAZING: Gloss Double Sided cost $0.30 → $0.60
UPDATE cello_glazing SET cost = 0.60 WHERE id = 2; -- Gloss - Double Sided

-- ── 2. COVERS: Fix cover thickness (mm) values
UPDATE covers SET mm = 0.25 WHERE name = 'PVC';
UPDATE covers SET mm = 0.25 WHERE name = 'Frosted';
UPDATE covers SET mm = 0.30 WHERE name = 'Leathergrain - Black';
UPDATE covers SET mm = 0.30 WHERE name = 'Leathergrain - Coloured';
UPDATE covers SET mm = 0.30 WHERE name = 'Plain Backing Boards';
-- Poly Prop (0.6mm) stays at 0.6 — correct

-- ── 3. COLLATING: Rate per 1,000 sheets $10 → $11
UPDATE collating_general SET rate_per_1000 = 11 WHERE id = 1;

-- ── 4. EXTRAS: Ribbons $1.00 → $1.50
UPDATE extras SET cost = 1.50 WHERE id = 4; -- Ribbons

-- ── 5. VOLUME DISCOUNTS: Add binding_type column and restructure
ALTER TABLE volume_discount ADD COLUMN IF NOT EXISTS binding_type text DEFAULT 'general';

DELETE FROM volume_discount; -- clear old single-table structure

-- General (Wire Binding, Plastic Spiral, Plastic Comb, Comb)
INSERT INTO volume_discount (start_qty, end_qty, rate, binding_type) VALUES
  (1,     200,   0.00, 'general'),
  (201,   2000,  0.05, 'general'),
  (2001,  5000,  0.10, 'general'),
  (5001,  10000, 0.15, 'general'),
  (10001, 100000,0.20, 'general');

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

-- Perfect Binding (note: stored as 'Prefect Binding' to match codebase)
INSERT INTO volume_discount (start_qty, end_qty, rate, binding_type) VALUES
  (1,     100,   0.00, 'Prefect Binding'),
  (101,   500,   0.05, 'Prefect Binding'),
  (501,   2000,  0.10, 'Prefect Binding'),
  (2001,  5000,  0.15, 'Prefect Binding'),
  (5001,  100000,0.20, 'Prefect Binding');

-- ── 6. BINDING COSTS: Update 208 changed values
UPDATE binding_costs SET cost = 1.25 WHERE id = 86;
UPDATE binding_costs SET cost = 1.15 WHERE id = 99;
UPDATE binding_costs SET cost = 1.25 WHERE id = 136;
UPDATE binding_costs SET cost = 1.25 WHERE id = 112;
UPDATE binding_costs SET cost = 1.85 WHERE id = 125;
UPDATE binding_costs SET cost = 1.35 WHERE id = 87;
UPDATE binding_costs SET cost = 1.35 WHERE id = 100;
UPDATE binding_costs SET cost = 1.45 WHERE id = 137;
UPDATE binding_costs SET cost = 1.45 WHERE id = 113;
UPDATE binding_costs SET cost = 2.05 WHERE id = 126;
UPDATE binding_costs SET cost = 1.45 WHERE id = 88;
UPDATE binding_costs SET cost = 1.55 WHERE id = 101;
UPDATE binding_costs SET cost = 1.65 WHERE id = 138;
UPDATE binding_costs SET cost = 1.65 WHERE id = 114;
UPDATE binding_costs SET cost = 2.25 WHERE id = 127;
UPDATE binding_costs SET cost = 1.55 WHERE id = 89;
UPDATE binding_costs SET cost = 1.75 WHERE id = 102;
UPDATE binding_costs SET cost = 1.85 WHERE id = 139;
UPDATE binding_costs SET cost = 1.85 WHERE id = 115;
UPDATE binding_costs SET cost = 2.45 WHERE id = 128;
UPDATE binding_costs SET cost = 1.75 WHERE id = 90;
UPDATE binding_costs SET cost = 1.95 WHERE id = 103;
UPDATE binding_costs SET cost = 2.05 WHERE id = 140;
UPDATE binding_costs SET cost = 2.05 WHERE id = 116;
UPDATE binding_costs SET cost = 2.55 WHERE id = 129;
UPDATE binding_costs SET cost = 2.1  WHERE id = 104;
UPDATE binding_costs SET cost = 2.2  WHERE id = 141;
UPDATE binding_costs SET cost = 2.2  WHERE id = 117;
UPDATE binding_costs SET cost = 2.8  WHERE id = 130;
UPDATE binding_costs SET cost = 2.05 WHERE id = 92;
UPDATE binding_costs SET cost = 2.25 WHERE id = 105;
UPDATE binding_costs SET cost = 2.45 WHERE id = 142;
UPDATE binding_costs SET cost = 2.45 WHERE id = 118;
UPDATE binding_costs SET cost = 2.55 WHERE id = 106;
UPDATE binding_costs SET cost = 2.75 WHERE id = 143;
UPDATE binding_costs SET cost = 2.75 WHERE id = 119;
UPDATE binding_costs SET cost = 3.95 WHERE id = 131;
UPDATE binding_costs SET cost = 2.65 WHERE id = 107;
UPDATE binding_costs SET cost = 2.85 WHERE id = 144;
UPDATE binding_costs SET cost = 2.85 WHERE id = 120;
UPDATE binding_costs SET cost = 4.25 WHERE id = 132;
UPDATE binding_costs SET cost = 3.05 WHERE id = 108;
UPDATE binding_costs SET cost = 3.25 WHERE id = 145;
UPDATE binding_costs SET cost = 3.25 WHERE id = 121;
UPDATE binding_costs SET cost = 4.35 WHERE id = 133;
UPDATE binding_costs SET cost = 4.05 WHERE id = 109;
UPDATE binding_costs SET cost = 4.25 WHERE id = 146;
UPDATE binding_costs SET cost = 4.25 WHERE id = 122;
UPDATE binding_costs SET cost = 6.25 WHERE id = 134;
UPDATE binding_costs SET cost = 4.55 WHERE id = 110;
UPDATE binding_costs SET cost = 4.75 WHERE id = 147;
UPDATE binding_costs SET cost = 4.75 WHERE id = 123;
UPDATE binding_costs SET cost = 6.55 WHERE id = 135;
UPDATE binding_costs SET cost = 5.25 WHERE id = 111;
UPDATE binding_costs SET cost = 1.05 WHERE id = 68;
UPDATE binding_costs SET cost = 1.05 WHERE id = 62;
UPDATE binding_costs SET cost = 1.3  WHERE id = 64;
UPDATE binding_costs SET cost = 1.15 WHERE id = 69;
UPDATE binding_costs SET cost = 1.15 WHERE id = 63;
UPDATE binding_costs SET cost = 1.4  WHERE id = 65;
UPDATE binding_costs SET cost = 1.1  WHERE id = 70;
UPDATE binding_costs SET cost = 1.1  WHERE id = 74;
UPDATE binding_costs SET cost = 1.15 WHERE id = 78;
UPDATE binding_costs SET cost = 1.15 WHERE id = 71;
UPDATE binding_costs SET cost = 1.15 WHERE id = 75;
UPDATE binding_costs SET cost = 1.25 WHERE id = 79;
UPDATE binding_costs SET cost = 1.35 WHERE id = 72;
UPDATE binding_costs SET cost = 1.35 WHERE id = 76;
UPDATE binding_costs SET cost = 1.45 WHERE id = 80;
UPDATE binding_costs SET cost = 1.5  WHERE id = 73;
UPDATE binding_costs SET cost = 1.5  WHERE id = 77;
UPDATE binding_costs SET cost = 1.6  WHERE id = 81;
UPDATE binding_costs SET cost = 1.25 WHERE id = 149;
UPDATE binding_costs SET cost = 1.15 WHERE id = 162;
UPDATE binding_costs SET cost = 1.25 WHERE id = 199;
UPDATE binding_costs SET cost = 1.25 WHERE id = 175;
UPDATE binding_costs SET cost = 1.85 WHERE id = 188;
UPDATE binding_costs SET cost = 1.35 WHERE id = 150;
UPDATE binding_costs SET cost = 1.35 WHERE id = 163;
UPDATE binding_costs SET cost = 1.45 WHERE id = 200;
UPDATE binding_costs SET cost = 1.45 WHERE id = 176;
UPDATE binding_costs SET cost = 2.05 WHERE id = 189;
UPDATE binding_costs SET cost = 1.45 WHERE id = 151;
UPDATE binding_costs SET cost = 1.55 WHERE id = 164;
UPDATE binding_costs SET cost = 1.65 WHERE id = 201;
UPDATE binding_costs SET cost = 1.65 WHERE id = 177;
UPDATE binding_costs SET cost = 2.25 WHERE id = 190;
UPDATE binding_costs SET cost = 1.55 WHERE id = 152;
UPDATE binding_costs SET cost = 1.75 WHERE id = 165;
UPDATE binding_costs SET cost = 1.85 WHERE id = 202;
UPDATE binding_costs SET cost = 1.85 WHERE id = 178;
UPDATE binding_costs SET cost = 2.45 WHERE id = 191;
UPDATE binding_costs SET cost = 1.75 WHERE id = 153;
UPDATE binding_costs SET cost = 1.95 WHERE id = 166;
UPDATE binding_costs SET cost = 2.05 WHERE id = 203;
UPDATE binding_costs SET cost = 2.05 WHERE id = 179;
UPDATE binding_costs SET cost = 2.55 WHERE id = 192;
UPDATE binding_costs SET cost = 2.1  WHERE id = 167;
UPDATE binding_costs SET cost = 2.2  WHERE id = 204;
UPDATE binding_costs SET cost = 2.2  WHERE id = 180;
UPDATE binding_costs SET cost = 2.8  WHERE id = 193;
UPDATE binding_costs SET cost = 2.05 WHERE id = 155;
UPDATE binding_costs SET cost = 2.25 WHERE id = 168;
UPDATE binding_costs SET cost = 2.45 WHERE id = 205;
UPDATE binding_costs SET cost = 2.45 WHERE id = 181;
UPDATE binding_costs SET cost = 2.55 WHERE id = 169;
UPDATE binding_costs SET cost = 2.75 WHERE id = 206;
UPDATE binding_costs SET cost = 2.75 WHERE id = 182;
UPDATE binding_costs SET cost = 3.95 WHERE id = 194;
UPDATE binding_costs SET cost = 2.65 WHERE id = 170;
UPDATE binding_costs SET cost = 2.85 WHERE id = 207;
UPDATE binding_costs SET cost = 2.85 WHERE id = 183;
UPDATE binding_costs SET cost = 4.25 WHERE id = 195;
UPDATE binding_costs SET cost = 3.05 WHERE id = 171;
UPDATE binding_costs SET cost = 3.25 WHERE id = 208;
UPDATE binding_costs SET cost = 3.25 WHERE id = 184;
UPDATE binding_costs SET cost = 4.35 WHERE id = 196;
UPDATE binding_costs SET cost = 4.05 WHERE id = 172;
UPDATE binding_costs SET cost = 4.25 WHERE id = 209;
UPDATE binding_costs SET cost = 4.25 WHERE id = 185;
UPDATE binding_costs SET cost = 6.25 WHERE id = 197;
UPDATE binding_costs SET cost = 4.55 WHERE id = 173;
UPDATE binding_costs SET cost = 4.75 WHERE id = 210;
UPDATE binding_costs SET cost = 4.75 WHERE id = 186;
UPDATE binding_costs SET cost = 6.55 WHERE id = 198;
UPDATE binding_costs SET cost = 5.25 WHERE id = 174;
UPDATE binding_costs SET cost = 11.5  WHERE id = 212;
UPDATE binding_costs SET cost = 11.4  WHERE id = 225;
UPDATE binding_costs SET cost = 11.5  WHERE id = 251;
UPDATE binding_costs SET cost = 11.5  WHERE id = 238;
UPDATE binding_costs SET cost = 11.6  WHERE id = 213;
UPDATE binding_costs SET cost = 11.6  WHERE id = 226;
UPDATE binding_costs SET cost = 11.7  WHERE id = 252;
UPDATE binding_costs SET cost = 11.7  WHERE id = 239;
UPDATE binding_costs SET cost = 11.7  WHERE id = 214;
UPDATE binding_costs SET cost = 11.8  WHERE id = 227;
UPDATE binding_costs SET cost = 11.9  WHERE id = 253;
UPDATE binding_costs SET cost = 11.9  WHERE id = 240;
UPDATE binding_costs SET cost = 11.8  WHERE id = 215;
UPDATE binding_costs SET cost = 12.0  WHERE id = 228;
UPDATE binding_costs SET cost = 12.1  WHERE id = 254;
UPDATE binding_costs SET cost = 12.1  WHERE id = 241;
UPDATE binding_costs SET cost = 12.0  WHERE id = 216;
UPDATE binding_costs SET cost = 12.2  WHERE id = 229;
UPDATE binding_costs SET cost = 12.3  WHERE id = 255;
UPDATE binding_costs SET cost = 12.3  WHERE id = 242;
UPDATE binding_costs SET cost = 12.15 WHERE id = 217;
UPDATE binding_costs SET cost = 12.35 WHERE id = 230;
UPDATE binding_costs SET cost = 12.45 WHERE id = 256;
UPDATE binding_costs SET cost = 12.45 WHERE id = 243;
UPDATE binding_costs SET cost = 12.3  WHERE id = 218;
UPDATE binding_costs SET cost = 12.5  WHERE id = 231;
UPDATE binding_costs SET cost = 12.7  WHERE id = 257;
UPDATE binding_costs SET cost = 12.7  WHERE id = 244;
UPDATE binding_costs SET cost = 12.8  WHERE id = 219;
UPDATE binding_costs SET cost = 12.8  WHERE id = 232;
UPDATE binding_costs SET cost = 13.0  WHERE id = 258;
UPDATE binding_costs SET cost = 13.0  WHERE id = 245;
UPDATE binding_costs SET cost = 12.9  WHERE id = 220;
UPDATE binding_costs SET cost = 12.9  WHERE id = 233;
UPDATE binding_costs SET cost = 13.1  WHERE id = 259;
UPDATE binding_costs SET cost = 13.1  WHERE id = 246;
UPDATE binding_costs SET cost = 13.3  WHERE id = 221;
UPDATE binding_costs SET cost = 13.3  WHERE id = 234;
UPDATE binding_costs SET cost = 13.5  WHERE id = 260;
UPDATE binding_costs SET cost = 13.5  WHERE id = 247;
UPDATE binding_costs SET cost = 14.3  WHERE id = 222;
UPDATE binding_costs SET cost = 14.3  WHERE id = 235;
UPDATE binding_costs SET cost = 14.5  WHERE id = 261;
UPDATE binding_costs SET cost = 14.5  WHERE id = 248;
UPDATE binding_costs SET cost = 14.8  WHERE id = 223;
UPDATE binding_costs SET cost = 14.8  WHERE id = 236;
UPDATE binding_costs SET cost = 15.0  WHERE id = 262;
UPDATE binding_costs SET cost = 15.0  WHERE id = 249;
UPDATE binding_costs SET cost = 15.5  WHERE id = 224;
UPDATE binding_costs SET cost = 15.5  WHERE id = 237;
UPDATE binding_costs SET cost = 15.75 WHERE id = 263;
UPDATE binding_costs SET cost = 15.75 WHERE id = 250;
UPDATE binding_costs SET cost = 1.1   WHERE id = 9;
UPDATE binding_costs SET cost = 2.3   WHERE id = 38;
UPDATE binding_costs SET cost = 1.85  WHERE id = 13;
UPDATE binding_costs SET cost = 2.55  WHERE id = 39;
UPDATE binding_costs SET cost = 2.3   WHERE id = 15;
UPDATE binding_costs SET cost = 2.5   WHERE id = 52;
UPDATE binding_costs SET cost = 2.5   WHERE id = 28;
UPDATE binding_costs SET cost = 2.8   WHERE id = 17;
UPDATE binding_costs SET cost = 3.0   WHERE id = 54;
UPDATE binding_costs SET cost = 3.0   WHERE id = 30;
UPDATE binding_costs SET cost = 4.3   WHERE id = 19;
UPDATE binding_costs SET cost = 5.0   WHERE id = 20;
UPDATE binding_costs SET cost = 5.25  WHERE id = 57;
UPDATE binding_costs SET cost = 5.25  WHERE id = 33;
UPDATE binding_costs SET cost = 0.95  WHERE id = 264;
UPDATE binding_costs SET cost = 0.9   WHERE id = 277;
UPDATE binding_costs SET cost = 1.0   WHERE id = 315;
UPDATE binding_costs SET cost = 1.0   WHERE id = 290;
UPDATE binding_costs SET cost = 1.05  WHERE id = 265;
UPDATE binding_costs SET cost = 1.1   WHERE id = 278;
UPDATE binding_costs SET cost = 1.2   WHERE id = 316;
UPDATE binding_costs SET cost = 1.2   WHERE id = 291;
UPDATE binding_costs SET cost = 1.15  WHERE id = 266;
UPDATE binding_costs SET cost = 1.25  WHERE id = 267;
UPDATE binding_costs SET cost = 1.25  WHERE id = 268;
UPDATE binding_costs SET cost = 2.5   WHERE id = 285;
UPDATE binding_costs SET cost = 2.7   WHERE id = 286;
UPDATE binding_costs SET cost = 3.7   WHERE id = 274;
UPDATE binding_costs SET cost = 4.1   WHERE id = 275;
UPDATE binding_costs SET cost = 4.8   WHERE id = 276;

-- ── 7. BINDING COSTS: Add 3 missing rows (Wire A3 5/8")
INSERT INTO binding_costs (category, subtype, leaf_size, wire_size, cost) VALUES
  ('Wire Binding', '1/2 Canadian',        'A3', '5/8"', 3.75),
  ('Wire Binding', 'Full Canadian',        'A3', '5/8"', 3.75),
  ('Wire Binding', 'Standard Wire binding','A3', '5/8"', 3.50);

-- ── 8. BINDING COSTS: Remove rows not in Excel (A6 large wire for 1/2 & Full Canadian)
DELETE FROM binding_costs WHERE id IN (93,94,95,96,97,98);   -- 1/2 Canadian A6 3/4"–1 1/2"
DELETE FROM binding_costs WHERE id IN (156,157,158,159,160,161); -- Full Canadian A6 3/4"–1 1/2"
