# ◈ North

An entrepreneurial north star for solo founders: roadmap with stage-gates (**The Horizon**),
a Top-3 daily focus dashboard (**Daily Alignment**), an automated advisory engine
(**The Advisory Matrix**), and a business-asset vault (**Executive Vault**).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · TanStack Query |
| Backend | C# .NET 8 Web API · Clean Architecture (Domain / Application / Infrastructure / Api) |
| Database | SQLite for local dev (zero setup) · PostgreSQL-ready via the `Postgres` connection string |

## Run it

Two terminals:

```powershell
# 1. API — http://localhost:5080 (Swagger at /swagger)
cd north-api
dotnet run --project src/North.Api --launch-profile http

# 2. Web — http://localhost:3000
cd north-web
npm run dev
```

First API run creates `north.db` and seeds a demo venture
(Validate the problem → Ship the MVP → First 10 active users) so the dashboard is never empty.

## How the stage-gate system works

1. Milestones can carry a `gateKey` (e.g. `validation_done`) and a `dependsOnMilestoneId`.
2. A milestone with an unmet prerequisite starts **Locked**.
3. `POST /api/v1/ventures/{id}/milestones/{mid}/complete` runs the cascade inside the
   `Venture` aggregate: validates all micro-tasks are done, achieves the milestone,
   unlocks dependents, and advances the venture stage (`StageOnAchieve`).
4. The whole app reads unlock state from one endpoint: `GET /ventures/{id}/unlocks`.

Domain rule violations come back as `409 { title, detail }` — the UI shows `detail` as-is.

## Tests

```powershell
npm test                       # runs the whole .NET solution's tests
# or directly:
dotnet test north-api/North.sln
```

`north-api/tests/North.Domain.Tests` covers the stage-gate cascade in the
`Venture` aggregate (a milestone is only achievable when its tasks are done;
achieving one unlocks dependents and advances the macro stage).

Next.js anonymous telemetry is disabled for the repo via `north-web/.env`
(`NEXT_TELEMETRY_DISABLED=1`), so `next dev` won't phone home.

## Project layout

```
north-api/
  src/North.Domain          # Entities + invariants (no dependencies)
  src/North.Application     # Services, DTOs, ports (IVentureRepository, ...)
  src/North.Infrastructure  # EF Core, repositories, dev seeder
  src/North.Api             # Controllers, middleware, DI
north-web/
  app/                        # Routes (thin) — /, /horizon
  features/<module>/          # Components + hooks per module
  components/ui/              # shadcn/ui primitives
  lib/                        # api client, DTO types
```

## Action plan (iterative)

- [x] **Iteration 0 — Walking skeleton**: solution structure, Venture/Milestone/MicroTask domain,
      roadmap + stage-gate API, Daily Alignment dashboard, Horizon timeline. *(you are here)*
- [ ] **Iteration 1 — Roadmap editing UI**: create/edit milestones and tasks from the Horizon page
      (the API endpoints already exist); switch `EnsureCreated` to EF Core migrations.
- [ ] **Iteration 2 — Auth**: single-user JWT (ASP.NET Identity or a simple token), `users` table,
      scope ventures by owner.
- [ ] **Iteration 3 — Daily Alignment backend**: persist the daily Top-3 picks (`daily_alignments`,
      `daily_focus_slots`), log focus sessions from the timer, shutdown reflection.
- [ ] **Iteration 4 — Advisory Matrix**: `founder_signals` + rule engine (`advisory_rules` seeded
      from JSON), insight inbox UI gated by `requiredGateKey`.
- [ ] **Iteration 5 — Executive Vault**: versioned JSONB-style assets (Value Prop canvas, personas,
      competitors), metric snapshots + simple charts.
- [ ] **Iteration 6 — Production**: PostgreSQL, deploy (e.g. API on Fly/Azure, web on Vercel),
      backups, error tracking.
