# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

```
frontend/    Next.js 16 app
backend/     FastAPI app (in-memory stores seeded from docs/schema.json)
docs/        PLAN.md — original phased roadmap (Parts 1-9)
             Calendar-Plan.md — Phase-2 roadmap for the interactive calendar feature
             News-Plan.md / News-Plan2.md — Phase-2 roadmap for News & Announcements
             Photo-Gallery.md / Photo-Gallery2.md — Phase-2 roadmap for Photo Gallery
scripts/    start.sh / stop.sh dev orchestration (Mac-only)
```

## Development Commands

All commands run from `frontend/`:

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

## Architecture

The app is a single-page client-rendered Next.js app. `app/page.tsx` renders `<AppShell />`, which owns all state (`activeSection`, `isLoggedIn`) and wires together the three layout regions:

- `TopBanner` — static KoC logo + council address
- `SidebarNav` — nav items from `data/siteData.ts`; highlights active section
- `MainPanel` — switches on `activeSection`; renders HomeCarousel, officers grid, MembersLoginForm, members area, or static content

`data/siteData.ts` is the single source of truth for all content and types (`SectionId`, `NavItem`, `Officer`).

`lib/auth.ts` has demo credentials for the members login (no backend yet).

The `events` SectionId renders a live interactive `<Calendar />` (no longer a static `sectionContent` blurb); officers see an additional "Calendar Updates" entry inside the members area for Add/Edit/Delete of events. See `docs/Calendar-Plan.md` for the phased rollout.

The `news` SectionId renders a live `<News />` (no longer a static `sectionContent` blurb): a vertical list of clickable announcement boxes that open a detail popup. Officers see an additional "Edit Announcements" entry in the members area for Add/Edit/Delete. Announcements auto-purge from public reads once their `deleteDate` is in the past. See `docs/News-Plan2.md` for the phased rollout.

The `photos` SectionId renders a live `<PhotoGallery />` (no longer a static `sectionContent` blurb): a two-column grid of photo cards sorted oldest-first (newest at the bottom), non-interactive on the public side. Officers see an additional "Edit Photo Gallery" entry in the members area for Add/Edit/Delete. In Phase 2 the form takes a `photoUrl` text field — real drag-and-drop file upload + S3 storage is deferred to a future phase tied to the AWS cutover. See `docs/Photo-Gallery2.md` for the phased rollout.

The `updateOfficers` MemberSubSection renders `<OfficersUpdate />` — visible only to Grand Knight, Deputy Grand Knight, Recorder, and Financial Secretary. It shows the current officer roster with Edit buttons; clicking Edit opens `<OfficerEditModal />` with a searchable member name dropdown and a PNG-only file upload. Changes are persisted via `PUT /officers/{title}` (privileged auth) and reflected on both the public Officers grid and Members-Only Officers view, which both fetch from `GET /officers` (public, no auth). The static `officers[]` array in `siteData.ts` is seed data only. See `docs/Update-Officers2.md` for the full phased plan.

See `frontend/CLAUDE.md` for full component contracts, data shapes, and testing details.

## Conventions

- Named exports only; no default exports
- `"use client"` only on components that use hooks
- Tailwind only — no CSS modules, no component libraries
- Color palette (only these hex values): `#BFA149` accent · `#4169E1` blue · `#753991` purple · `#032147` navy · `#888888` gray
- No emojis anywhere
- Keep it simple — never over-engineer, no unnecessary defensive programming

## Planned Backend (not yet built)

Per `docs/PLAN.md`, the future backend will add:
- AWS Cognito/Amplify for member authentication (replacing `lib/auth.ts` demo stubs)
- FastAPI backend in `backend/` serving member data from AWS RDS
- Email via AWS API Gateway → Lambda → SES
- Production hosting: static export on S3 + CloudFront
