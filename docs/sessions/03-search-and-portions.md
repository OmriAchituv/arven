# Session 03 — Search & portions

**Depends on:** 01, 02 · **Delivers:** the resolver every input method will use

## Goal

Turn "what the user meant" into a provenance-tagged Portion of a Food. This is the single pipeline of
PRD §3.4 — manual entry, natural language and voice all arrive here. Build it once, correctly.

## Scope

**In**

- `nutrition/app`: `searchFoods`, `resolvePortion`
- Hebrew search across the three tiers, ranked: personal → MoH → USDA
- Hebrew matching that survives real typing: `קוטג'` / `קוטג׳` / `קוטג` all find the same thing
- Household units per food, from the MoH tables, offered before grams
- Estimate units (`חופן`, `בערך`) resolving to a gram value marked `○`
- tRPC router exposing both, with Zod input validation
- `nutrition/infra` Drizzle repositories behind domain-owned interfaces

**Out** — UI, natural language, barcodes, embeddings or vector search.

## Acceptance

- [ ] `קוטג` returns cottage cheese entries ranked with personal items first
- [ ] Apostrophe variants (`'` vs `׳`) and missing final letters still match
- [ ] `פיתה` offers `יחידה` before grams, and resolves to real grams marked `●`
- [ ] `חופן שקדים` resolves to grams marked `○`
- [ ] Search returns in under 200ms against the seeded database
- [ ] The tRPC procedures are thin: validate, delegate to `nutrition/app`, return

## Verification

Vitest against a seeded test database, plus a Playwright API-level check that the tRPC route
responds. No UI yet.

## Notes

- **No LLM.** Hebrew normalisation is string work: strip geresh variants, normalise finals, fold
  whitespace. Keep it in the domain package where it can be tested directly.
- Postgres trigram indexes are enough at this size. Resist pgvector — v2 built vector search over an
  empty table and shipped it as a completed phase.
- Ranking rule: exact personal match, then personal prefix, then MoH, then USDA. Written down in
  code as a named function, not scattered through a query.
