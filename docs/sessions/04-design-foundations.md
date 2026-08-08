# Session 04 — Design foundations

**Depends on:** 00 · **Delivers:** the visual language, before any screen uses it

## Goal

Establish how ARVEN looks and feels, once, so screens are assembled from a system rather than
improvised. Per the brief: premium through restraint.

**Read [`../brand-brief.md`](../brand-brief.md) in full before starting.** §17, §26–31, §37.

## Scope

**In** — `packages/ui`

- Colour tokens from brief §28: Warm Off-White `#F6F4F1`, Mineral Beige `#DCD5C8`,
  Charcoal `#1C1E1D`, Graphite `#4A4D4F`, Mineral Green `#2F4A43`
- Dark mode per §29 — very dark warm charcoal, never pure black; softly illuminated, not glowing
- Hebrew typography: an editorial serif and a precise sans, self-hosted, subset
- Full RTL: layout, numerals, mixed Hebrew-Latin strings, iconography direction
- Numeric presentation — the large-figure treatment the brief keeps returning to
- The provenance marks `●` and `○` as first-class visual primitives
- Motion primitives per §37: settle, transition, fade. No celebration.
- Applied to the login page and app shell so the system is proven in use

**Out** — every product screen.

## Acceptance

- [ ] Light and dark both render correctly; dark uses warm charcoal, not `#000`
- [ ] A Hebrew sentence containing Latin text and numerals renders in correct order
- [ ] Fonts are self-hosted and subset; no layout shift on load
- [ ] `●` and `○` are legible at a glance, distinguishable without colour alone
- [ ] Playwright screenshots of the shell in both themes are attached to the PR
- [ ] Nothing in the system contradicts §24 or §37 — no confetti, no gamification, no sparkles

## Notes

- The brief's typefaces (§30 — Canela, Tiempos, Instrument Serif) **have no Hebrew glyphs**. The
  Hebrew pairing holding the same tension is **Frank Ruhl Libre** with **Assistant** or **Heebo**,
  all free on Google Fonts. Confirm the pairing visually in this session; the brand direction is
  unchanged, only the font names are.
- Apply the brand test to every choice: would this feel natural at a world-class longevity retreat,
  *and* inside a world-class technology product?
- Restraint is the brief's definition of luxury. When uncertain, remove.
