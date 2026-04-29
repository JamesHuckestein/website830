<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Codebase Guide

## Stack

Next.js 16.2.3 · React 19 · TypeScript 5 · Tailwind CSS v4
Testing: Vitest 4 (unit) + Playwright 1.59 (E2E, Chrome)

## Deployment

- Local dev: `npm run dev` (port 3000), runs alongside FastAPI backend via scripts/start
- Production: `npm run build` produces a static export served via AWS S3 + CloudFront

## Component Structure

```
AppShell (components/AppShell.tsx)  — only stateful component
  state: activeSection: SectionId, isLoggedIn: boolean
  callbacks passed down: setActiveSection, handleLogin, onLogout

TopBanner      — static header; reads councilInfo from data/siteData.ts
SidebarNav     — receives navItems + activeSection + onSelect; highlights active button
MainPanel      — switches on activeSection; renders one of:
                   HomeCarousel | officers grid | MembersLoginForm | members area | static section
                 "members" shows login form or members content based on isLoggedIn
HomeCarousel   — auto-advances every 5 s; Previous/Next buttons; click navigates to "officers"
MembersLoginForm — controlled form; calls onLogin(membershipNumber, passcode)
```

## Data & Auth

`data/siteData.ts` — single source of truth for all content:
- Types: `SectionId` (union), `NavItem`, `Officer`
- Exports: `councilInfo`, `aboutCouncilDetails`, `navItems`, `officers[]`, `sectionContent`

`lib/auth.ts` — `authenticateMember(membershipNumber, passcode): boolean`
- Demo credentials: `{ "8301001": "faith830", "8301002": "charity830" }`
- Will be replaced by backend API call (AWS Cognito/Amplify) in Part 7

## Conventions

- Named exports only — no default exports
- `"use client"` only on components that use hooks (AppShell, HomeCarousel)
- Tailwind only — no CSS modules, no component libraries
- Inline hex colors from palette only; never arbitrary values outside it
- Color palette: `#BFA149` accent · `#4169E1` blue · `#753991` purple · `#032147` navy · `#888888` gray
- No emojis anywhere
- Keep it simple — never over-engineer, no unnecessary defensive programming

## Testing

```bash
npm run test         # Vitest unit tests + coverage; test files co-located as *.test.tsx
npm run test:e2e     # Playwright E2E (Chrome); tests in e2e/app.spec.ts
                     # Dev server auto-started by playwright.config.ts on port 3000
```
