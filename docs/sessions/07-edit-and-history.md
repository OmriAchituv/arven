# Session 07 — Edit & history

**Depends on:** 06 · **Delivers:** a log you can trust because you can fix it

## Goal

A record you can't correct is a record you stop believing. Editing is part of the trust promise, not
housekeeping.

## Scope

**In**

- Edit an Entry's portion, food, or time
- Delete an Entry
- Upgrade an estimate: tap `○`, enter the weight, it becomes `●`
- Navigate to previous days
- Undo for a destructive action

**Out** — bulk operations, a calendar picker, exporting.

## Acceptance

- [ ] Changing a portion recomputes the day total immediately
- [ ] Weighing an estimated item flips it to `●` and narrows the day's band
- [ ] Deleting is undoable within the session
- [ ] Previous days are reachable and read correctly, including across the 04:00 boundary
- [ ] Playwright covers edit, delete, undo, and the estimate upgrade
- [ ] No confirmation dialogs where undo would serve better

## Notes

- The `○` → `●` upgrade is the mechanism that makes provenance a living feature rather than a label.
  It should feel like an invitation, never a reproach — brief §21, honesty is always rewarded.
- Day navigation stays minimal: previous and next. A calendar can wait for trends.
