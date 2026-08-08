# Session 09 — Dishes

**Depends on:** 08 · **Delivers:** repetition without repetition

## Goal

A **מנה** is a saved composition — *"שייק אחרי אימון"*, *"הסלט שלי"* — logged in one tap, scalable,
and still made of grounded components.

This replaces meal categories entirely. It is how ARVEN handles the fact that most days repeat.

## Scope

**In**

- Compose a Dish from Foods with portions
- Save it with a name
- Log a Dish as one Entry; components and provenance preserved
- Scale on logging (`×½`, `×2`, arbitrary)
- Edit a Dish's components
- Create a Dish from a day's existing entries — "save this as a מנה"

**Out** — sharing, importing the MoH recipes table, photos, nested Dishes.

## Acceptance

- [ ] A saved Dish logs in one tap and lands on Today with correct totals
- [ ] `×½` yields exactly half of every component, provenance intact
- [ ] Editing a component recomputes future logs; past behaviour is documented and deliberate
- [ ] A Dish made only of `●` components is itself `●`; one `○` component makes the total `○`
- [ ] Turning yesterday's entries into a Dish takes under thirty seconds
- [ ] Playwright covers compose → save → log → scale

## Notes

- Components, never frozen totals — PRD §4. This is what keeps history inspectable in six months.
- No nested Dishes in v1. It's a tempting generalisation with real complexity and no demonstrated
  need; add it when a real case appears.
- The MoH recipes table may seed common Israeli dishes later. Out of scope until this model has
  been lived with.
