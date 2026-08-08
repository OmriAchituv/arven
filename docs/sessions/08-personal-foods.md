# Session 08 — Personal foods

**Depends on:** 06 · **Delivers:** the tier that makes ARVEN yours

## Goal

Anything you eat that no database knows becomes a Food you own — entered once from the packet, exact
forever, and searched first from then on.

Per brief §41, this is the beginning of the actual moat: longitudinal personal context.

## Scope

**In**

- Create a Food: name, per-100g values, optional household units
- Values entered from a packet are grounded — `●`, source `personal`
- Edit and delete your own Foods
- Personal items rank first in search
- A simple view of your library

**Out** — barcode scanning, photographing labels, sharing.

## Acceptance

- [ ] A Food created by hand is searchable immediately and ranks above MoH and USDA
- [ ] Custom household units work (`גביע` = 250g) and resolve as `●`
- [ ] Editing a Food does not retroactively alter past Entries in a way that surprises
- [ ] Creating a Food from a packet takes under a minute
- [ ] Playwright covers create → search → log

## Notes

- Decide and document what editing a Food does to history. The PRD chose computed-from-components
  for Dishes; be deliberate and consistent here rather than accidental.
- Israeli branded products are the main gap the MoH database leaves. This session closes it by hand
  until barcode scanning arrives.
