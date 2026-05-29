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

Calendar         — public, renders for activeSection === "events"
                   month state + prev/next arrows; fetches via getEvents(month);
                   uses CalendarGrid; opens EventDetailModal on event-title click
CalendarUpdates  — officer-only members sub-section (memberSubSection === "calendarUpdates")
                   props: { token, onBack }; reuses CalendarGrid with selectedDay state;
                   renders Add/Edit/Delete buttons; calls createEvent/updateEvent/deleteEvent
                   on the backend; opens EventFormModal / DayEventPicker / ConfirmDialog as needed
CalendarGrid     — shared, presentational: 7-column Mon→Sun grid; props
                   { year, month, events, selectedDay?, onDayClick?, onEventClick? };
                   onDayClick wins if both are supplied (day cell becomes the button and event
                   titles render as text); blank leading/trailing cells outside the visible
                   month; up to 3 event-title links per day cell
EventDetailModal — public read-only popover: title, description, time (12-hour), location, Close
EventFormModal   — officer form: Title (required), Description (required),
                   Time (optional <input type="time">), Location (optional); Save / Cancel
DayEventPicker   — small list modal used when Edit/Delete is invoked on a day with ≥2 events
ConfirmDialog    — reused from prayer-requests work for the "Will you confirm?" delete prompt

News                     — public, renders for activeSection === "news"
                           fetches via getAnnouncements(); renders titles as a vertical list
                           of clickable boxes; opens AnnouncementDetailModal on click;
                           backend filters out rows where delete_date < today
AnnouncementsUpdate      — officer-only members sub-section
                           (memberSubSection === "announcementsUpdate")
                           props: { token, onBack }; renders the same list with click-to-select
                           highlight; Add/Edit/Delete buttons; calls createAnnouncement /
                           updateAnnouncement / deleteAnnouncement on the backend; uses
                           AnnouncementFormModal / ConfirmDialog / SubmitModal as needed
AnnouncementDetailModal  — public read-only popover: title, details (whitespace-pre-line), Close
AnnouncementFormModal    — officer form: Date to Delete (required <input type="date">),
                           Title (required, ≤200), Announcement Details (required, ≤2000);
                           Save / Cancel; `submitting` prop disables both and shows "Saving..."
```

## Data & Auth

`data/siteData.ts` — single source of truth for all content:
- Types: `SectionId` (union), `NavItem`, `Officer`, `MemberSubSection` (includes `"calendarUpdates"` and `"announcementsUpdate"`)
- Exports: `councilInfo`, `aboutCouncilDetails`, `navItems`, `officers[]`, `sectionContent`
- Note: the `events` and `news` SectionIds are no longer in `sectionContent` — they render `<Calendar />` and `<News />` directly from `MainPanel`.

`lib/api.ts` — typed API client:
- Members: `loginMember`, `getMembers`, `getMember`, `updateMember`, `getBirthdays`, `exportMembersCSV`
- Prayer requests: `getPrayerRequests`, `createPrayerRequest`, `deletePrayerRequest`, `getPublicPrayerRequests`
- Meeting minutes: `getMeetingMinutes`, `getMeetingMinutesDetail`
- Events (calendar): `getEvents(month?)`, `createEvent`, `updateEvent`, `deleteEvent` — write methods require an officer JWT; backend enforces the 3-events-per-day cap with HTTP 409 Conflict.
- Announcements (news): `getAnnouncements()`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement` — `getAnnouncements` is public and pre-sorted newest-first; backend filters out rows where `delete_date < today`. Write methods require an officer JWT and reject past `delete_date` values with HTTP 422.

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
