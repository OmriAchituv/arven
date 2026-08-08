# ARVEN

A personal health hub. Tell it what you ate, how you slept, what you did — it keeps the record straight.

**Now:** manual calorie + macro logging on the web.
**Next:** natural-language logging ("two eggs and a slice of rye") resolved to accurate grams and macros.
**Later:** Apple Health sync for burn, sleep and workouts, so intake and expenditure sit side by side.

Status: pre-alpha. The plan is written; implementation starts at session 00.

## Repo layout

| Path | What's in it |
|---|---|
| `docs/PRD.md` | The product requirement doc — the source of truth for scope |
| `docs/sessions/` | PRD sliced into individually shippable work sessions |
| `CLAUDE.md` | Conventions and context for Claude Code |

## Constraints that shape every decision

- **Zero fixed cost.** Free tiers only. LLM tokens are the one accepted variable cost, kept minimal.
- **Phone-first development.** Work continues from a phone via Claude remote; CI/CD must carry changes to production without a laptop.
- **Ship small.** Calorie intake logging works end-to-end before anything else is started.

## Running it

```bash
pnpm install
cp .env.example .env.local   # then fill in the three values
pnpm dev                     # http://localhost:3000

pnpm typecheck               # packages + web
pnpm test                    # unit, no browser, no database
pnpm e2e                     # Playwright, mobile Safari viewport
pnpm build                   # production build
```

`pnpm --filter @arven/db generate` writes a migration from the schema;
`pnpm --filter @arven/db migrate` applies it.
