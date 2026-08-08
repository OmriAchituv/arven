# Session 06 — Add an entry

**Depends on:** 05 · **Delivers:** ARVEN becomes usable

## Goal

Close the loop: search a food, choose a portion, see it on Today. After this session ARVEN can be
used for real, every day. Everything after is refinement.

## Scope

**In**

- Add flow: search → select → portion → logged
- Search results showing tier (★ yours · ● MoH · ● USDA) and per-100g values
- Household units offered before grams, from the MoH tables
- Estimate units available and marked `○`
- Optimistic update — the entry appears immediately
- Time defaults to now, adjustable
- Recently used foods surfaced before any typing

**Out** — editing, deleting, personal foods, Dishes, natural language.

## Acceptance

- [ ] Logging a repeat food takes under ten seconds from opening the app
- [ ] Logging `פיתה` by unit stores real grams and marks it `●`
- [ ] Logging `חופן שקדים` stores a gram estimate and marks it `○`
- [ ] Today's total updates without a full reload
- [ ] Usable one-handed on a phone, in Hebrew
- [ ] Playwright covers the full path and screenshots each step
- [ ] Logging an item at 01:30 lands on the previous day

## Notes

- This is where v2 died. Every tap that isn't search, portion or confirm must justify itself.
- No meal picker. Ever. The PRD models eating occasions out of existence.
- Recent foods before typing is the highest-leverage friction removal available without an LLM —
  most days repeat most foods.
