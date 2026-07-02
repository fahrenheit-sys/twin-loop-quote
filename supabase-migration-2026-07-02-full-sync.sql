-- ============================================================
-- Twin Loop Pricing Update — 2026-07-02 (full sync with Excel)
-- Run this entire script in the Supabase SQL Editor (once only)
--
-- Compared every live pricing table against
-- "Twin Loop Pricing Reference (002).xlsx" (2026-06-01 Jun folder).
-- Everything below is currently WRONG in the live database.
-- Most of this matches the never-applied 2026-06-29 migration —
-- that file appears to have never actually been run against
-- production (only its volume_discount section has been applied,
-- via the 2026-07-02 migration already run today).
-- ============================================================

-- ── 1. COVERS: fix cover thickness (mm) values ────────────────────────────────
UPDATE covers SET mm = 0.25 WHERE name = 'PVC';
UPDATE covers SET mm = 0.25 WHERE name = 'Frosted';
UPDATE covers SET mm = 0.30 WHERE name = 'Leathergrain - Black';
UPDATE covers SET mm = 0.30 WHERE name = 'Leathergrain - Coloured';
UPDATE covers SET mm = 0.30 WHERE name = 'Plain Backing Boards';

-- ── 2. CELLO GLAZING: Gloss Double Sided cost $0.30 → $0.60 ───────────────────
UPDATE cello_glazing SET cost = 0.60 WHERE label = 'Gloss - Double Sided';

-- ── 3. COLLATING: Rate per 1,000 sheets $10 → $11 ─────────────────────────────
UPDATE collating_general SET rate_per_1000 = 11 WHERE id = 1;

-- ── 4. EXTRAS: Ribbons $1.00 → $1.50 ──────────────────────────────────────────
UPDATE extras SET cost = 1.50 WHERE name = 'Ribbons';

-- ── 5. BINDING COSTS: 208 corrections (existing rows priced incorrectly) ─────
-- Wire Binding "Hard Cover" was underpriced by roughly 10x (e.g. A4 1/4" was
-- $1.00, should be $11.50). "1/2 Canadian" and "Full Canadian" were
-- underpriced by $0.25/book across almost every size and thickness.
UPDATE binding_costs SET cost = 1.0 WHERE id = 290; -- Plastic Spiral / - / A4 / 1/4" was 1.2
UPDATE binding_costs SET cost = 1.2 WHERE id = 291; -- Plastic Spiral / - / A4 / 5/16" was 1.3
UPDATE binding_costs SET cost = 2.7 WHERE id = 286; -- Plastic Spiral / - / A5 / 1" was 2.8
UPDATE binding_costs SET cost = 0.9 WHERE id = 277; -- Plastic Spiral / - / A5 / 1/4" was 1.15
UPDATE binding_costs SET cost = 1.1 WHERE id = 278; -- Plastic Spiral / - / A5 / 5/16" was 1.25
UPDATE binding_costs SET cost = 2.5 WHERE id = 285; -- Plastic Spiral / - / A5 / 7/8" was 2.4
UPDATE binding_costs SET cost = 4.8 WHERE id = 276; -- Plastic Spiral / - / A6 / 1 1/2" was 4.85
UPDATE binding_costs SET cost = 4.1 WHERE id = 275; -- Plastic Spiral / - / A6 / 1 1/4" was 4.5
UPDATE binding_costs SET cost = 3.7 WHERE id = 274; -- Plastic Spiral / - / A6 / 1 1/8" was 3.1
UPDATE binding_costs SET cost = 1.25 WHERE id = 268; -- Plastic Spiral / - / A6 / 1/2" was 1.3
UPDATE binding_costs SET cost = 0.95 WHERE id = 264; -- Plastic Spiral / - / A6 / 1/4" was 1.05
UPDATE binding_costs SET cost = 1.15 WHERE id = 266; -- Plastic Spiral / - / A6 / 3/8" was 1.2
UPDATE binding_costs SET cost = 1.05 WHERE id = 265; -- Plastic Spiral / - / A6 / 5/16" was 1.15
UPDATE binding_costs SET cost = 1.25 WHERE id = 267; -- Plastic Spiral / - / A6 / 7/16" was 1.3
UPDATE binding_costs SET cost = 1.0 WHERE id = 315; -- Plastic Spiral / - / B5 / 1/4" was 1.2
UPDATE binding_costs SET cost = 1.2 WHERE id = 316; -- Plastic Spiral / - / B5 / 5/16" was 1.3
UPDATE binding_costs SET cost = 6.55 WHERE id = 135; -- Wire Binding / 1/2 Canadian / A3 / 1 1/4" was 6.3
UPDATE binding_costs SET cost = 6.25 WHERE id = 134; -- Wire Binding / 1/2 Canadian / A3 / 1 1/8" was 6.0
UPDATE binding_costs SET cost = 4.35 WHERE id = 133; -- Wire Binding / 1/2 Canadian / A3 / 1" was 4.1
UPDATE binding_costs SET cost = 2.55 WHERE id = 129; -- Wire Binding / 1/2 Canadian / A3 / 1/2" was 2.4
UPDATE binding_costs SET cost = 1.85 WHERE id = 125; -- Wire Binding / 1/2 Canadian / A3 / 1/4" was 1.6
UPDATE binding_costs SET cost = 3.95 WHERE id = 131; -- Wire Binding / 1/2 Canadian / A3 / 3/4" was 3.7
UPDATE binding_costs SET cost = 2.25 WHERE id = 127; -- Wire Binding / 1/2 Canadian / A3 / 3/8" was 2.0
UPDATE binding_costs SET cost = 2.05 WHERE id = 126; -- Wire Binding / 1/2 Canadian / A3 / 5/16" was 1.8
UPDATE binding_costs SET cost = 2.45 WHERE id = 128; -- Wire Binding / 1/2 Canadian / A3 / 7/16" was 2.2
UPDATE binding_costs SET cost = 4.25 WHERE id = 132; -- Wire Binding / 1/2 Canadian / A3 / 7/8" was 4.0
UPDATE binding_costs SET cost = 2.8 WHERE id = 130; -- Wire Binding / 1/2 Canadian / A3 / 9/16" was 2.6
UPDATE binding_costs SET cost = 4.75 WHERE id = 123; -- Wire Binding / 1/2 Canadian / A4 / 1 1/4" was 4.5
UPDATE binding_costs SET cost = 4.25 WHERE id = 122; -- Wire Binding / 1/2 Canadian / A4 / 1 1/8" was 4.0
UPDATE binding_costs SET cost = 3.25 WHERE id = 121; -- Wire Binding / 1/2 Canadian / A4 / 1" was 2.8
UPDATE binding_costs SET cost = 2.05 WHERE id = 116; -- Wire Binding / 1/2 Canadian / A4 / 1/2" was 1.8
UPDATE binding_costs SET cost = 1.25 WHERE id = 112; -- Wire Binding / 1/2 Canadian / A4 / 1/4" was 1.0
UPDATE binding_costs SET cost = 2.75 WHERE id = 119; -- Wire Binding / 1/2 Canadian / A4 / 3/4" was 2.4
UPDATE binding_costs SET cost = 1.65 WHERE id = 114; -- Wire Binding / 1/2 Canadian / A4 / 3/8" was 1.4
UPDATE binding_costs SET cost = 1.45 WHERE id = 113; -- Wire Binding / 1/2 Canadian / A4 / 5/16" was 1.2
UPDATE binding_costs SET cost = 2.45 WHERE id = 118; -- Wire Binding / 1/2 Canadian / A4 / 5/8" was 2.2
UPDATE binding_costs SET cost = 1.85 WHERE id = 115; -- Wire Binding / 1/2 Canadian / A4 / 7/16" was 1.6
UPDATE binding_costs SET cost = 2.85 WHERE id = 120; -- Wire Binding / 1/2 Canadian / A4 / 7/8" was 2.6
UPDATE binding_costs SET cost = 2.2 WHERE id = 117; -- Wire Binding / 1/2 Canadian / A4 / 9/16" was 1.95
UPDATE binding_costs SET cost = 5.25 WHERE id = 111; -- Wire Binding / 1/2 Canadian / A5 / 1 1/2" was 5.2
UPDATE binding_costs SET cost = 4.55 WHERE id = 110; -- Wire Binding / 1/2 Canadian / A5 / 1 1/4" was 4.2
UPDATE binding_costs SET cost = 4.05 WHERE id = 109; -- Wire Binding / 1/2 Canadian / A5 / 1 1/8" was 3.8
UPDATE binding_costs SET cost = 3.05 WHERE id = 108; -- Wire Binding / 1/2 Canadian / A5 / 1" was 2.6
UPDATE binding_costs SET cost = 1.95 WHERE id = 103; -- Wire Binding / 1/2 Canadian / A5 / 1/2" was 1.7
UPDATE binding_costs SET cost = 1.15 WHERE id = 99; -- Wire Binding / 1/2 Canadian / A5 / 1/4" was 0.9
UPDATE binding_costs SET cost = 2.55 WHERE id = 106; -- Wire Binding / 1/2 Canadian / A5 / 3/4" was 2.2
UPDATE binding_costs SET cost = 1.55 WHERE id = 101; -- Wire Binding / 1/2 Canadian / A5 / 3/8" was 1.3
UPDATE binding_costs SET cost = 1.35 WHERE id = 100; -- Wire Binding / 1/2 Canadian / A5 / 5/16" was 1.0
UPDATE binding_costs SET cost = 2.25 WHERE id = 105; -- Wire Binding / 1/2 Canadian / A5 / 5/8" was 2.0
UPDATE binding_costs SET cost = 1.75 WHERE id = 102; -- Wire Binding / 1/2 Canadian / A5 / 7/16" was 1.5
UPDATE binding_costs SET cost = 2.65 WHERE id = 107; -- Wire Binding / 1/2 Canadian / A5 / 7/8" was 2.4
UPDATE binding_costs SET cost = 2.1 WHERE id = 104; -- Wire Binding / 1/2 Canadian / A5 / 9/16" was 1.9
UPDATE binding_costs SET cost = 1.75 WHERE id = 90; -- Wire Binding / 1/2 Canadian / A6 / 1/2" was 1.7
UPDATE binding_costs SET cost = 1.25 WHERE id = 86; -- Wire Binding / 1/2 Canadian / A6 / 1/4" was 0.9
UPDATE binding_costs SET cost = 1.45 WHERE id = 88; -- Wire Binding / 1/2 Canadian / A6 / 3/8" was 1.3
UPDATE binding_costs SET cost = 1.35 WHERE id = 87; -- Wire Binding / 1/2 Canadian / A6 / 5/16" was 1.0
UPDATE binding_costs SET cost = 2.05 WHERE id = 92; -- Wire Binding / 1/2 Canadian / A6 / 5/8" was 2.0
UPDATE binding_costs SET cost = 1.55 WHERE id = 89; -- Wire Binding / 1/2 Canadian / A6 / 7/16" was 1.5
UPDATE binding_costs SET cost = 4.75 WHERE id = 147; -- Wire Binding / 1/2 Canadian / B5 / 1 1/4" was 4.5
UPDATE binding_costs SET cost = 4.25 WHERE id = 146; -- Wire Binding / 1/2 Canadian / B5 / 1 1/8" was 4.0
UPDATE binding_costs SET cost = 3.25 WHERE id = 145; -- Wire Binding / 1/2 Canadian / B5 / 1" was 2.8
UPDATE binding_costs SET cost = 2.05 WHERE id = 140; -- Wire Binding / 1/2 Canadian / B5 / 1/2" was 1.8
UPDATE binding_costs SET cost = 1.25 WHERE id = 136; -- Wire Binding / 1/2 Canadian / B5 / 1/4" was 1.0
UPDATE binding_costs SET cost = 2.75 WHERE id = 143; -- Wire Binding / 1/2 Canadian / B5 / 3/4" was 2.4
UPDATE binding_costs SET cost = 1.65 WHERE id = 138; -- Wire Binding / 1/2 Canadian / B5 / 3/8" was 1.4
UPDATE binding_costs SET cost = 1.45 WHERE id = 137; -- Wire Binding / 1/2 Canadian / B5 / 5/16" was 1.2
UPDATE binding_costs SET cost = 2.45 WHERE id = 142; -- Wire Binding / 1/2 Canadian / B5 / 5/8" was 2.2
UPDATE binding_costs SET cost = 1.85 WHERE id = 139; -- Wire Binding / 1/2 Canadian / B5 / 7/16" was 1.6
UPDATE binding_costs SET cost = 2.85 WHERE id = 144; -- Wire Binding / 1/2 Canadian / B5 / 7/8" was 2.6
UPDATE binding_costs SET cost = 2.2 WHERE id = 141; -- Wire Binding / 1/2 Canadian / B5 / 9/16" was 1.95
UPDATE binding_costs SET cost = 1.3 WHERE id = 64; -- Wire Binding / Calendar with hanger / A3 / 1/4" was 1.7
UPDATE binding_costs SET cost = 1.4 WHERE id = 65; -- Wire Binding / Calendar with hanger / A3 / 5/16" was 1.8
UPDATE binding_costs SET cost = 1.05 WHERE id = 62; -- Wire Binding / Calendar with hanger / A4 / 1/4" was 1.2
UPDATE binding_costs SET cost = 1.15 WHERE id = 63; -- Wire Binding / Calendar with hanger / A4 / 5/16" was 1.4
UPDATE binding_costs SET cost = 1.05 WHERE id = 68; -- Wire Binding / Calendar with hanger / B5 / 1/4" was 1.2
UPDATE binding_costs SET cost = 1.15 WHERE id = 69; -- Wire Binding / Calendar with hanger / B5 / 5/16" was 1.4
UPDATE binding_costs SET cost = 1.15 WHERE id = 78; -- Wire Binding / Calendar with tent stand / flip chart / A4 / 1/4" was 1.3
UPDATE binding_costs SET cost = 1.45 WHERE id = 80; -- Wire Binding / Calendar with tent stand / flip chart / A4 / 3/8" was 1.6
UPDATE binding_costs SET cost = 1.25 WHERE id = 79; -- Wire Binding / Calendar with tent stand / flip chart / A4 / 5/16" was 1.4
UPDATE binding_costs SET cost = 1.6 WHERE id = 81; -- Wire Binding / Calendar with tent stand / flip chart / A4 / 7/16" was 1.7
UPDATE binding_costs SET cost = 1.1 WHERE id = 74; -- Wire Binding / Calendar with tent stand / flip chart / A5 / 1/4" was 1.2
UPDATE binding_costs SET cost = 1.35 WHERE id = 76; -- Wire Binding / Calendar with tent stand / flip chart / A5 / 3/8" was 1.5
UPDATE binding_costs SET cost = 1.15 WHERE id = 75; -- Wire Binding / Calendar with tent stand / flip chart / A5 / 5/16" was 1.3
UPDATE binding_costs SET cost = 1.5 WHERE id = 77; -- Wire Binding / Calendar with tent stand / flip chart / A5 / 7/16" was 1.6
UPDATE binding_costs SET cost = 1.1 WHERE id = 70; -- Wire Binding / Calendar with tent stand / flip chart / A6 / 1/4" was 1.2
UPDATE binding_costs SET cost = 1.35 WHERE id = 72; -- Wire Binding / Calendar with tent stand / flip chart / A6 / 3/8" was 1.5
UPDATE binding_costs SET cost = 1.15 WHERE id = 71; -- Wire Binding / Calendar with tent stand / flip chart / A6 / 5/16" was 1.3
UPDATE binding_costs SET cost = 1.5 WHERE id = 73; -- Wire Binding / Calendar with tent stand / flip chart / A6 / 7/16" was 1.6
UPDATE binding_costs SET cost = 6.55 WHERE id = 198; -- Wire Binding / Full Canadian / A3 / 1 1/4" was 6.3
UPDATE binding_costs SET cost = 6.25 WHERE id = 197; -- Wire Binding / Full Canadian / A3 / 1 1/8" was 6.0
UPDATE binding_costs SET cost = 4.35 WHERE id = 196; -- Wire Binding / Full Canadian / A3 / 1" was 4.1
UPDATE binding_costs SET cost = 2.55 WHERE id = 192; -- Wire Binding / Full Canadian / A3 / 1/2" was 2.4
UPDATE binding_costs SET cost = 1.85 WHERE id = 188; -- Wire Binding / Full Canadian / A3 / 1/4" was 1.6
UPDATE binding_costs SET cost = 3.95 WHERE id = 194; -- Wire Binding / Full Canadian / A3 / 3/4" was 3.7
UPDATE binding_costs SET cost = 2.25 WHERE id = 190; -- Wire Binding / Full Canadian / A3 / 3/8" was 2.0
UPDATE binding_costs SET cost = 2.05 WHERE id = 189; -- Wire Binding / Full Canadian / A3 / 5/16" was 1.8
UPDATE binding_costs SET cost = 2.45 WHERE id = 191; -- Wire Binding / Full Canadian / A3 / 7/16" was 2.2
UPDATE binding_costs SET cost = 4.25 WHERE id = 195; -- Wire Binding / Full Canadian / A3 / 7/8" was 4.0
UPDATE binding_costs SET cost = 2.8 WHERE id = 193; -- Wire Binding / Full Canadian / A3 / 9/16" was 2.6
UPDATE binding_costs SET cost = 4.75 WHERE id = 186; -- Wire Binding / Full Canadian / A4 / 1 1/4" was 4.5
UPDATE binding_costs SET cost = 4.25 WHERE id = 185; -- Wire Binding / Full Canadian / A4 / 1 1/8" was 4.0
UPDATE binding_costs SET cost = 3.25 WHERE id = 184; -- Wire Binding / Full Canadian / A4 / 1" was 2.8
UPDATE binding_costs SET cost = 2.05 WHERE id = 179; -- Wire Binding / Full Canadian / A4 / 1/2" was 1.8
UPDATE binding_costs SET cost = 1.25 WHERE id = 175; -- Wire Binding / Full Canadian / A4 / 1/4" was 1.0
UPDATE binding_costs SET cost = 2.75 WHERE id = 182; -- Wire Binding / Full Canadian / A4 / 3/4" was 2.4
UPDATE binding_costs SET cost = 1.65 WHERE id = 177; -- Wire Binding / Full Canadian / A4 / 3/8" was 1.4
UPDATE binding_costs SET cost = 1.45 WHERE id = 176; -- Wire Binding / Full Canadian / A4 / 5/16" was 1.2
UPDATE binding_costs SET cost = 2.45 WHERE id = 181; -- Wire Binding / Full Canadian / A4 / 5/8" was 2.2
UPDATE binding_costs SET cost = 1.85 WHERE id = 178; -- Wire Binding / Full Canadian / A4 / 7/16" was 1.6
UPDATE binding_costs SET cost = 2.85 WHERE id = 183; -- Wire Binding / Full Canadian / A4 / 7/8" was 2.6
UPDATE binding_costs SET cost = 2.2 WHERE id = 180; -- Wire Binding / Full Canadian / A4 / 9/16" was 1.95
UPDATE binding_costs SET cost = 5.25 WHERE id = 174; -- Wire Binding / Full Canadian / A5 / 1 1/2" was 5.2
UPDATE binding_costs SET cost = 4.55 WHERE id = 173; -- Wire Binding / Full Canadian / A5 / 1 1/4" was 4.2
UPDATE binding_costs SET cost = 4.05 WHERE id = 172; -- Wire Binding / Full Canadian / A5 / 1 1/8" was 3.8
UPDATE binding_costs SET cost = 3.05 WHERE id = 171; -- Wire Binding / Full Canadian / A5 / 1" was 2.6
UPDATE binding_costs SET cost = 1.95 WHERE id = 166; -- Wire Binding / Full Canadian / A5 / 1/2" was 1.7
UPDATE binding_costs SET cost = 1.15 WHERE id = 162; -- Wire Binding / Full Canadian / A5 / 1/4" was 0.9
UPDATE binding_costs SET cost = 2.55 WHERE id = 169; -- Wire Binding / Full Canadian / A5 / 3/4" was 2.2
UPDATE binding_costs SET cost = 1.55 WHERE id = 164; -- Wire Binding / Full Canadian / A5 / 3/8" was 1.3
UPDATE binding_costs SET cost = 1.35 WHERE id = 163; -- Wire Binding / Full Canadian / A5 / 5/16" was 1.0
UPDATE binding_costs SET cost = 2.25 WHERE id = 168; -- Wire Binding / Full Canadian / A5 / 5/8" was 2.0
UPDATE binding_costs SET cost = 1.75 WHERE id = 165; -- Wire Binding / Full Canadian / A5 / 7/16" was 1.5
UPDATE binding_costs SET cost = 2.65 WHERE id = 170; -- Wire Binding / Full Canadian / A5 / 7/8" was 2.4
UPDATE binding_costs SET cost = 2.1 WHERE id = 167; -- Wire Binding / Full Canadian / A5 / 9/16" was 1.9
UPDATE binding_costs SET cost = 1.75 WHERE id = 153; -- Wire Binding / Full Canadian / A6 / 1/2" was 1.7
UPDATE binding_costs SET cost = 1.25 WHERE id = 149; -- Wire Binding / Full Canadian / A6 / 1/4" was 0.9
UPDATE binding_costs SET cost = 1.45 WHERE id = 151; -- Wire Binding / Full Canadian / A6 / 3/8" was 1.3
UPDATE binding_costs SET cost = 1.35 WHERE id = 150; -- Wire Binding / Full Canadian / A6 / 5/16" was 1.0
UPDATE binding_costs SET cost = 2.05 WHERE id = 155; -- Wire Binding / Full Canadian / A6 / 5/8" was 2.0
UPDATE binding_costs SET cost = 1.55 WHERE id = 152; -- Wire Binding / Full Canadian / A6 / 7/16" was 1.5
UPDATE binding_costs SET cost = 4.75 WHERE id = 210; -- Wire Binding / Full Canadian / B5 / 1 1/4" was 4.5
UPDATE binding_costs SET cost = 4.25 WHERE id = 209; -- Wire Binding / Full Canadian / B5 / 1 1/8" was 4.0
UPDATE binding_costs SET cost = 3.25 WHERE id = 208; -- Wire Binding / Full Canadian / B5 / 1" was 2.8
UPDATE binding_costs SET cost = 2.05 WHERE id = 203; -- Wire Binding / Full Canadian / B5 / 1/2" was 1.8
UPDATE binding_costs SET cost = 1.25 WHERE id = 199; -- Wire Binding / Full Canadian / B5 / 1/4" was 1.0
UPDATE binding_costs SET cost = 2.75 WHERE id = 206; -- Wire Binding / Full Canadian / B5 / 3/4" was 2.4
UPDATE binding_costs SET cost = 1.65 WHERE id = 201; -- Wire Binding / Full Canadian / B5 / 3/8" was 1.4
UPDATE binding_costs SET cost = 1.45 WHERE id = 200; -- Wire Binding / Full Canadian / B5 / 5/16" was 1.2
UPDATE binding_costs SET cost = 2.45 WHERE id = 205; -- Wire Binding / Full Canadian / B5 / 5/8" was 2.2
UPDATE binding_costs SET cost = 1.85 WHERE id = 202; -- Wire Binding / Full Canadian / B5 / 7/16" was 1.6
UPDATE binding_costs SET cost = 2.85 WHERE id = 207; -- Wire Binding / Full Canadian / B5 / 7/8" was 2.6
UPDATE binding_costs SET cost = 2.2 WHERE id = 204; -- Wire Binding / Full Canadian / B5 / 9/16" was 1.95
UPDATE binding_costs SET cost = 15.75 WHERE id = 250; -- Wire Binding / Hard Cover / A4 / 1 1/2" was 5.5
UPDATE binding_costs SET cost = 15.0 WHERE id = 249; -- Wire Binding / Hard Cover / A4 / 1 1/4" was 4.5
UPDATE binding_costs SET cost = 14.5 WHERE id = 248; -- Wire Binding / Hard Cover / A4 / 1 1/8" was 4.0
UPDATE binding_costs SET cost = 13.5 WHERE id = 247; -- Wire Binding / Hard Cover / A4 / 1" was 2.8
UPDATE binding_costs SET cost = 12.3 WHERE id = 242; -- Wire Binding / Hard Cover / A4 / 1/2" was 1.8
UPDATE binding_costs SET cost = 11.5 WHERE id = 238; -- Wire Binding / Hard Cover / A4 / 1/4" was 1.0
UPDATE binding_costs SET cost = 13.0 WHERE id = 245; -- Wire Binding / Hard Cover / A4 / 3/4" was 2.4
UPDATE binding_costs SET cost = 11.9 WHERE id = 240; -- Wire Binding / Hard Cover / A4 / 3/8" was 1.4
UPDATE binding_costs SET cost = 11.7 WHERE id = 239; -- Wire Binding / Hard Cover / A4 / 5/16" was 1.2
UPDATE binding_costs SET cost = 12.7 WHERE id = 244; -- Wire Binding / Hard Cover / A4 / 5/8" was 2.2
UPDATE binding_costs SET cost = 12.1 WHERE id = 241; -- Wire Binding / Hard Cover / A4 / 7/16" was 1.6
UPDATE binding_costs SET cost = 13.1 WHERE id = 246; -- Wire Binding / Hard Cover / A4 / 7/8" was 2.6
UPDATE binding_costs SET cost = 12.45 WHERE id = 243; -- Wire Binding / Hard Cover / A4 / 9/16" was 1.95
UPDATE binding_costs SET cost = 15.5 WHERE id = 237; -- Wire Binding / Hard Cover / A5 / 1 1/2" was 5.2
UPDATE binding_costs SET cost = 14.8 WHERE id = 236; -- Wire Binding / Hard Cover / A5 / 1 1/4" was 4.2
UPDATE binding_costs SET cost = 14.3 WHERE id = 235; -- Wire Binding / Hard Cover / A5 / 1 1/8" was 3.8
UPDATE binding_costs SET cost = 13.3 WHERE id = 234; -- Wire Binding / Hard Cover / A5 / 1" was 2.6
UPDATE binding_costs SET cost = 12.2 WHERE id = 229; -- Wire Binding / Hard Cover / A5 / 1/2" was 1.7
UPDATE binding_costs SET cost = 11.4 WHERE id = 225; -- Wire Binding / Hard Cover / A5 / 1/4" was 0.9
UPDATE binding_costs SET cost = 12.8 WHERE id = 232; -- Wire Binding / Hard Cover / A5 / 3/4" was 2.2
UPDATE binding_costs SET cost = 11.8 WHERE id = 227; -- Wire Binding / Hard Cover / A5 / 3/8" was 1.3
UPDATE binding_costs SET cost = 11.6 WHERE id = 226; -- Wire Binding / Hard Cover / A5 / 5/16" was 1.0
UPDATE binding_costs SET cost = 12.5 WHERE id = 231; -- Wire Binding / Hard Cover / A5 / 5/8" was 2.0
UPDATE binding_costs SET cost = 12.0 WHERE id = 228; -- Wire Binding / Hard Cover / A5 / 7/16" was 1.5
UPDATE binding_costs SET cost = 12.9 WHERE id = 233; -- Wire Binding / Hard Cover / A5 / 7/8" was 2.4
UPDATE binding_costs SET cost = 12.35 WHERE id = 230; -- Wire Binding / Hard Cover / A5 / 9/16" was 1.9
UPDATE binding_costs SET cost = 15.5 WHERE id = 224; -- Wire Binding / Hard Cover / A6 / 1 1/2" was 5.2
UPDATE binding_costs SET cost = 14.8 WHERE id = 223; -- Wire Binding / Hard Cover / A6 / 1 1/4" was 4.2
UPDATE binding_costs SET cost = 14.3 WHERE id = 222; -- Wire Binding / Hard Cover / A6 / 1 1/8" was 3.8
UPDATE binding_costs SET cost = 13.3 WHERE id = 221; -- Wire Binding / Hard Cover / A6 / 1" was 2.6
UPDATE binding_costs SET cost = 12.0 WHERE id = 216; -- Wire Binding / Hard Cover / A6 / 1/2" was 1.5
UPDATE binding_costs SET cost = 11.5 WHERE id = 212; -- Wire Binding / Hard Cover / A6 / 1/4" was 1.0
UPDATE binding_costs SET cost = 12.8 WHERE id = 219; -- Wire Binding / Hard Cover / A6 / 3/4" was 2.2
UPDATE binding_costs SET cost = 11.7 WHERE id = 214; -- Wire Binding / Hard Cover / A6 / 3/8" was 1.2
UPDATE binding_costs SET cost = 11.6 WHERE id = 213; -- Wire Binding / Hard Cover / A6 / 5/16" was 1.1
UPDATE binding_costs SET cost = 12.3 WHERE id = 218; -- Wire Binding / Hard Cover / A6 / 5/8" was 1.8
UPDATE binding_costs SET cost = 11.8 WHERE id = 215; -- Wire Binding / Hard Cover / A6 / 7/16" was 1.3
UPDATE binding_costs SET cost = 12.9 WHERE id = 220; -- Wire Binding / Hard Cover / A6 / 7/8" was 2.4
UPDATE binding_costs SET cost = 12.15 WHERE id = 217; -- Wire Binding / Hard Cover / A6 / 9/16" was 1.65
UPDATE binding_costs SET cost = 15.75 WHERE id = 263; -- Wire Binding / Hard Cover / B5 / 1 1/2" was 5.5
UPDATE binding_costs SET cost = 15.0 WHERE id = 262; -- Wire Binding / Hard Cover / B5 / 1 1/4" was 4.5
UPDATE binding_costs SET cost = 14.5 WHERE id = 261; -- Wire Binding / Hard Cover / B5 / 1 1/8" was 4.0
UPDATE binding_costs SET cost = 13.5 WHERE id = 260; -- Wire Binding / Hard Cover / B5 / 1" was 2.8
UPDATE binding_costs SET cost = 12.3 WHERE id = 255; -- Wire Binding / Hard Cover / B5 / 1/2" was 1.8
UPDATE binding_costs SET cost = 11.5 WHERE id = 251; -- Wire Binding / Hard Cover / B5 / 1/4" was 1.0
UPDATE binding_costs SET cost = 13.0 WHERE id = 258; -- Wire Binding / Hard Cover / B5 / 3/4" was 2.4
UPDATE binding_costs SET cost = 11.9 WHERE id = 253; -- Wire Binding / Hard Cover / B5 / 3/8" was 1.4
UPDATE binding_costs SET cost = 11.7 WHERE id = 252; -- Wire Binding / Hard Cover / B5 / 5/16" was 1.2
UPDATE binding_costs SET cost = 12.7 WHERE id = 257; -- Wire Binding / Hard Cover / B5 / 5/8" was 2.2
UPDATE binding_costs SET cost = 12.1 WHERE id = 254; -- Wire Binding / Hard Cover / B5 / 7/16" was 1.6
UPDATE binding_costs SET cost = 13.1 WHERE id = 259; -- Wire Binding / Hard Cover / B5 / 7/8" was 2.6
UPDATE binding_costs SET cost = 12.45 WHERE id = 256; -- Wire Binding / Hard Cover / B5 / 9/16" was 1.95
UPDATE binding_costs SET cost = 2.3 WHERE id = 38; -- Wire Binding / Standard Wire binding / A3 / 1/2" was 2.4
UPDATE binding_costs SET cost = 2.55 WHERE id = 39; -- Wire Binding / Standard Wire binding / A3 / 9/16" was 2.6
UPDATE binding_costs SET cost = 5.25 WHERE id = 33; -- Wire Binding / Standard Wire binding / A4 / 1 1/2" was 5.5
UPDATE binding_costs SET cost = 3.0 WHERE id = 30; -- Wire Binding / Standard Wire binding / A4 / 1" was 2.8
UPDATE binding_costs SET cost = 2.5 WHERE id = 28; -- Wire Binding / Standard Wire binding / A4 / 3/4" was 2.4
UPDATE binding_costs SET cost = 5.0 WHERE id = 20; -- Wire Binding / Standard Wire binding / A5 / 1 1/2" was 5.2
UPDATE binding_costs SET cost = 4.3 WHERE id = 19; -- Wire Binding / Standard Wire binding / A5 / 1 1/4" was 4.2
UPDATE binding_costs SET cost = 2.8 WHERE id = 17; -- Wire Binding / Standard Wire binding / A5 / 1" was 2.6
UPDATE binding_costs SET cost = 2.3 WHERE id = 15; -- Wire Binding / Standard Wire binding / A5 / 3/4" was 2.2
UPDATE binding_costs SET cost = 1.1 WHERE id = 9; -- Wire Binding / Standard Wire binding / A5 / 5/16" was 1.0
UPDATE binding_costs SET cost = 1.85 WHERE id = 13; -- Wire Binding / Standard Wire binding / A5 / 9/16" was 1.9
UPDATE binding_costs SET cost = 5.25 WHERE id = 57; -- Wire Binding / Standard Wire binding / B5 / 1 1/2" was 5.5
UPDATE binding_costs SET cost = 3.0 WHERE id = 54; -- Wire Binding / Standard Wire binding / B5 / 1" was 2.8
UPDATE binding_costs SET cost = 2.5 WHERE id = 52; -- Wire Binding / Standard Wire binding / B5 / 3/4" was 2.4

-- ── 6. BINDING COSTS: 7 missing rows ──────────────────────────────────────────
INSERT INTO binding_costs (category, subtype, leaf_size, wire_size, cost) VALUES ('Case Binding', '-', 'A4', '1 1/2"', 31.95);
INSERT INTO binding_costs (category, subtype, leaf_size, wire_size, cost) VALUES ('Case Binding', '-', 'A5', '1 1/2"', 31.95);
INSERT INTO binding_costs (category, subtype, leaf_size, wire_size, cost) VALUES ('Case Binding', '-', 'A6', '1 1/2"', 31.95);
INSERT INTO binding_costs (category, subtype, leaf_size, wire_size, cost) VALUES ('Case Binding', '-', 'B5', '1 1/2"', 31.95);
INSERT INTO binding_costs (category, subtype, leaf_size, wire_size, cost) VALUES ('Wire Binding', '1/2 Canadian', 'A3', '5/8"', 3.75);
INSERT INTO binding_costs (category, subtype, leaf_size, wire_size, cost) VALUES ('Wire Binding', 'Full Canadian', 'A3', '5/8"', 3.75);
INSERT INTO binding_costs (category, subtype, leaf_size, wire_size, cost) VALUES ('Wire Binding', 'Standard Wire binding', 'A3', '5/8"', 3.5);

-- ── 7. BINDING COSTS: 12 stale rows (sizes we don't price at this bracket) ───
DELETE FROM binding_costs WHERE id = 98; -- Wire Binding / 1/2 Canadian / A6 / 1 1/2"
DELETE FROM binding_costs WHERE id = 97; -- Wire Binding / 1/2 Canadian / A6 / 1 1/4"
DELETE FROM binding_costs WHERE id = 96; -- Wire Binding / 1/2 Canadian / A6 / 1 1/8"
DELETE FROM binding_costs WHERE id = 95; -- Wire Binding / 1/2 Canadian / A6 / 1"
DELETE FROM binding_costs WHERE id = 93; -- Wire Binding / 1/2 Canadian / A6 / 3/4"
DELETE FROM binding_costs WHERE id = 94; -- Wire Binding / 1/2 Canadian / A6 / 7/8"
DELETE FROM binding_costs WHERE id = 161; -- Wire Binding / Full Canadian / A6 / 1 1/2"
DELETE FROM binding_costs WHERE id = 160; -- Wire Binding / Full Canadian / A6 / 1 1/4"
DELETE FROM binding_costs WHERE id = 159; -- Wire Binding / Full Canadian / A6 / 1 1/8"
DELETE FROM binding_costs WHERE id = 158; -- Wire Binding / Full Canadian / A6 / 1"
DELETE FROM binding_costs WHERE id = 156; -- Wire Binding / Full Canadian / A6 / 3/4"
DELETE FROM binding_costs WHERE id = 157; -- Wire Binding / Full Canadian / A6 / 7/8"
