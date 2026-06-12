# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

```
frontend/    Next.js 16 app
backend/     FastAPI app (DynamoDB-backed via app/repos/ + app/dynamo.py)
docs/        PLAN.md — original phased roadmap (Parts 1-9)
             Dynamo.md — DynamoDB migration plan and table designs
             Calendar-Plan.md — Phase-2 roadmap for the interactive calendar feature
             News-Plan.md / News-Plan2.md — Phase-2 roadmap for News & Announcements
             Photo-Gallery.md / Photo-Gallery2.md — Phase-2 roadmap for Photo Gallery
infra/       dynamodb-tables.yaml — CloudFormation for 7 DynamoDB tables
             iam-dynamodb-policy.yaml — IAM policy scoped to the tables
scripts/    start.sh / stop.sh dev orchestration (Mac-only)
```

## Development Commands

Frontend commands (run from `frontend/`):

```bash
npm run dev          # dev server on http://localhost:3000
npm run build        # static export (output in out/)
npm run lint         # ESLint
npm run test         # Vitest unit tests with coverage
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright E2E (auto-starts dev server)
```

To run a single unit test file:
```bash
npx vitest run components/AppShell.test.tsx
```

Backend commands (run from `backend/`):

```bash
.venv/bin/uvicorn app.main:app --reload --port 8000   # dev server
.venv/bin/python -m pytest tests/                      # all tests (uses moto mock)
.venv/bin/python -m pytest tests/test_dynamo_integration.py  # DynamoDB integration tests
.venv/bin/python -m scripts.seed_dynamo                # seed DynamoDB tables (local or remote)
```

## Architecture

The app is a single-page client-rendered Next.js app. `app/page.tsx` renders `<AppShell />`, which owns all state (`activeSection`, `isLoggedIn`) and wires together the three layout regions:

- `TopBanner` — static KoC logo + council address
- `SidebarNav` — nav items from `data/siteData.ts`; highlights active section
- `MainPanel` — switches on `activeSection`; renders HomeCarousel, officers grid, MembersLoginForm, members area, or static content

`data/siteData.ts` is the single source of truth for all content and types (`SectionId`, `NavItem`, `Officer`).

`lib/auth.ts` has demo credentials for the members login (frontend-only fallback; the backend handles real auth via JWT).

The `events` SectionId renders a live interactive `<Calendar />` (no longer a static `sectionContent` blurb); officers see an additional "Calendar Updates" entry inside the members area for Add/Edit/Delete of events. See `docs/Calendar-Plan.md` for the phased rollout.

The `news` SectionId renders a live `<News />` (no longer a static `sectionContent` blurb): a vertical list of clickable announcement boxes that open a detail popup. Officers see an additional "Edit Announcements" entry in the members area for Add/Edit/Delete. Announcements auto-purge from public reads once their `deleteDate` is in the past. See `docs/News-Plan2.md` for the phased rollout.

The `photos` SectionId renders a live `<PhotoGallery />` (no longer a static `sectionContent` blurb): a two-column grid of photo cards sorted oldest-first (newest at the bottom), non-interactive on the public side. Officers see an additional "Edit Photo Gallery" entry in the members area for Add/Edit/Delete. In Phase 2 the form takes a `photoUrl` text field — real drag-and-drop file upload + S3 storage is deferred to a future phase tied to the AWS cutover. See `docs/Photo-Gallery2.md` for the phased rollout.

The `updateOfficers` MemberSubSection renders `<OfficersUpdate />` — visible only to Grand Knight, Deputy Grand Knight, Recorder, and Financial Secretary. It shows the current officer roster with Edit buttons; clicking Edit opens `<OfficerEditModal />` with a searchable member name dropdown and a PNG-only file upload. Changes are persisted via `PUT /officers/{title}` (privileged auth) and reflected on both the public Officers grid and Members-Only Officers view, which both fetch from `GET /officers` (public, no auth). The static `officers[]` array in `siteData.ts` is seed data only. See `docs/Update-Officers2.md` for the full phased plan.

The `memberList` MemberSubSection renders `<MemberList />` — visible to all logged-in members. It includes a search-by-name filter, a scrollable container (max 25 rows visible), and Email/Download buttons for officers. Privileged officers (Grand Knight, Deputy Grand Knight, Recorder, Financial Secretary) additionally see Add/Edit/Delete buttons and can click rows to select them. Add/Edit opens `<MemberFormModal />` with all configurable member fields; Delete opens a `<ConfirmDialog />`. Changes are persisted via `POST /members`, `PUT /members/{id}/full`, and `DELETE /members/{id}` (all privileged auth). The `officer_position` field is not editable via this form. See `docs/Update-Members2.md` for the full phased plan.

See `frontend/CLAUDE.md` for full component contracts, data shapes, and testing details.

## Conventions

- Named exports only; no default exports
- `"use client"` only on components that use hooks
- Tailwind only — no CSS modules, no component libraries
- Color palette (only these hex values): `#BFA149` accent · `#4169E1` blue · `#753991` purple · `#032147` navy · `#888888` gray
- No emojis anywhere
- Keep it simple — never over-engineer, no unnecessary defensive programming

## Backend Architecture

The FastAPI backend (`backend/app/main.py`) serves all API routes. Data is persisted in AWS DynamoDB via a repository pattern:

```
app/main.py          — FastAPI routes, request models, auth helpers
app/dynamo.py        — DynamoDB client helpers (get/put/update/delete/scan/query/batch)
app/repos/           — Entity-specific repository modules (one per table)
  members.py         — Members table (PK: member_number)
  officers.py        — Officers table (PK: title)
  events.py          — Events table (PK: id, GSI: day-index)
  announcements.py   — Announcements table (PK: id)
  photos.py          — Photos table (PK: id)
  prayer_requests.py — Prayer Requests table (PK: id)
  meeting_minutes.py — Meeting Minutes table (PK: id)
app/seed.py          — Constants only (ADMIN_MEMBER_NUMBER, OFFICER_TITLES_ORDERED)
```

Tests use `moto[dynamodb]` to mock DynamoDB in-process (no Docker/Java required). The `conftest.py` fixture creates all 7 tables and seeds them from `docs/schema.json` before each test.

## Environment Variables (Backend)

| Variable | Dev Value | Production Value |
|----------|-----------|------------------|
| `DYNAMO_TABLE_PREFIX` | `koc830-dev-` | `koc830-prod-` |
| `DYNAMO_ENDPOINT_URL` | `http://localhost:8000` (DynamoDB Local) or omit (moto in tests) | omit (uses AWS default) |
| `AWS_REGION` | `us-east-1` | `us-east-1` |
| `JWT_SECRET` | `dev-secret-change-in-production!!` | (real secret) |
| `EMAIL_GATEWAY_URL` | omit (stub logging) | API Gateway URL |

## Future Work

Per `docs/PLAN.md`, remaining items:
- AWS Cognito/Amplify for member authentication (replacing `lib/auth.ts` demo stubs)
- Email via AWS API Gateway → Lambda → SES
- Production hosting: static export on S3 + CloudFront
- DynamoDB tables deployed via `infra/dynamodb-tables.yaml` (CloudFormation)
