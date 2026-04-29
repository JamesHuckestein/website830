# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

```
frontend/    Next.js 16 app (the only active codebase)
docs/        PLAN.md — phased project roadmap (Parts 1-9)
```

The backend (Parts 2-9 of the plan) does not exist yet. All current work is in `frontend/`.

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
