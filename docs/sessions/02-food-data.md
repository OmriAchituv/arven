# Session 02 — Food data

**Depends on:** 00, 01 · **Delivers:** a database with real Hebrew food in it

## Goal

Seed the grounded layer. **This is the session v2 never finished**, and the reason every number in
v2 was a guess. Its acceptance criteria are row counts, not checkboxes.

## Scope

**In**

- Drizzle schema: `foods`, `portion_units`, `food_sources`
- Import script for **מאגר התזונה הישראלי** from `data.gov.il` (dataset `nutrition-database`):
  - products with nutrients per 100g (`moh_mitzrachim.csv`)
  - measurement-unit tables (`moh_yehidot_mida.csv`, `moh_yehidot_mida_lemitzrachim.csv`)
- Import script for USDA SR Legacy + Foundation as the fallback layer
- Idempotent re-run: importing twice does not duplicate
- Seed runs in CI against the Neon branch, and is documented as a one-command operation

**Out** — search ranking, Open Food Facts, barcode scanning, the UI.

## Acceptance

- [ ] `SELECT count(*) FROM foods WHERE source = 'moh'` returns **> 4,000**
- [ ] `SELECT count(*) FROM foods WHERE source = 'usda'` returns **> 7,000**
- [ ] `SELECT count(*) FROM portion_units` returns **> 1,000**
- [ ] `פיתה` resolves to a real gram weight via a household unit, from the database alone
- [ ] Hebrew names render correctly — no mojibake, no reversed strings, correct encoding
- [ ] Re-running the import leaves counts unchanged
- [ ] A CI check fails if the food tables are empty

## Verification

A `pnpm db:verify` script printing counts per source and three sample Hebrew lookups. Its output
goes in the PR description.

## Notes

- **First real contact with the MoH data.** Encoding, column names and join keys across the four
  tables are unknown until opened. Expect this session to spend real time on data archaeology; that
  is the work, not a detour.
- The MoH data was last updated March 2023. Food composition ages slowly — acceptable.
- The MoH recipes table (`moh_matkonim`) is out of scope. Revisit after Dishes exist.
- USDA Branded Foods is explicitly excluded — multiple GB, doesn't fit the free tier, and Open Food
  Facts covers branded items better for an Israeli user.
- If the licence terms require attribution, add it now rather than later.
