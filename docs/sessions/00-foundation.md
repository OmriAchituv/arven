# Session 00 — Foundation & delivery

**Depends on:** nothing · **Delivers:** a deployed empty app and the loop that keeps it that way

## Goal

Build the pipeline before building the product. By the end of this session, a change made from a
phone reaches production, and a broken change cannot.

Nothing about nutrition exists yet. That is deliberate — the delivery loop is what makes every later
session reviewable from a phone, so it comes first.

## Scope

**In**

- pnpm workspace: `apps/web`, `packages/db`, `packages/ui`, empty context packages
- Next.js App Router, TypeScript strict, Tailwind
- Neon project + Drizzle configured, one throwaway migration proving the connection
- tRPC wired end to end with a single `health.ping` procedure
- `app/api/ingest/health` REST stub returning 501 — reserves the boundary decided in the PRD
- Passphrase middleware: one env var, long-lived cookie, `/login` page
- PWA manifest, icons, standalone display
- GitHub Actions: typecheck, `vitest`, `playwright`
- Playwright smoke test: app loads, passphrase gate works
- PR comment posts the Vercel preview URL and Playwright screenshots
- `main` auto-deploys production

**Out** — every product concept. No Food, no Entry, no schema beyond the throwaway migration.

## Acceptance

- [ ] A PR opened from a phone shows a preview URL and at least one screenshot in its comments
- [ ] CI fails when a type error is pushed (prove it: push one, watch it fail, remove it)
- [ ] Merging to `main` puts the change on the production URL without a laptop
- [ ] The production URL is installable to the iOS home screen and opens without browser chrome
- [ ] Visiting production without the cookie shows `/login`; the passphrase lets you through
- [ ] `pnpm test` runs domain tests with no browser and no database

## Verification

Playwright: load `/`, expect redirect to `/login`, enter passphrase, expect the app shell.
Screenshot both states.

## Notes

- Free tiers only — Neon, Vercel, Actions. Nothing here should require a card.
- Empty context packages now, with real `package.json` edges, so imports across contexts are a
  visible decision later rather than an accident. v2's coupling started as convenience imports.
- The passphrase gate is temporary and gets deleted in iteration 4. Keep it in one file so removing
  it is a deletion, not a refactor.
- Confirm whether Vercel's Hobby plan protects production deployments; if it does, the passphrase
  may be unnecessary. Unverified at time of writing.
