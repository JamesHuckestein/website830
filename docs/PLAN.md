# KoC Council 830 Website — Project Plan

## Infrastructure Decisions
- **AWS Region:** us-east-1
- **Hosting:** S3 static site + CloudFront CDN
- **Domain:** koc830.org (+ www.koc830.org), ACM cert + CloudFront aliases + Route 53 alias records
- **Auth:** AWS Cognito + Amplify (Parts 7+); demo stubs until then
- **Database:** AWS RDS (Parts 6+); seed JSON until then
- **Email:** AWS API Gateway → Lambda → SES (Part 8)
- **Meeting minutes format:** PDF files stored in S3
- **Prayer requests:** individual text files stored in an S3 folder

## Officer Detection
A logged-in member is treated as an officer if their `officerPosition` field is non-null **and** matches one of the 14 titles in `officerTitles` in `data/siteData.ts` ("Grand Knight", "Deputy Grand Knight", "Chancellor", "Advocate", "Recorder", "Treasurer", "Warden", "Inside Guard", "Outside Guard", "Trustee - 1 Year", "Trustee - 2 Year", "Trustee - 3 Year", "Financial Secretary", "Lecturer"). Officer-only UI elements are shown/hidden based on this check.

---

## Current State (as of plan approval)

Parts complete:
- Frontend: all 13 nav sections render, officers carousel and grid, static export configured
- Demo login: `lib/auth.ts` with credentials `8301001`/`faith830` and `8301002`/`charity830`
- Members area: login form, post-login placeholder, logout button
- Tests: Vitest unit tests and Playwright E2E in place

Not yet built:
- Members area sub-features (7 links — see Part 3)
- Backend (`backend/` does not exist)
- `scripts/` start/stop scripts

---

## Part 1: Plan — Complete

- [x] Analyze frontend codebase
- [x] Document in `frontend/CLAUDE.md` and root `CLAUDE.md`
- [x] Expand plan with detailed substeps
- [x] Clarify open questions (AWS region, officer detection, link labels, file formats)
- [x] User approval received

---

## Part 2: Backend Scaffolding

**Stack:** Python 3.12 · FastAPI · Uvicorn

### Steps
1. Create `backend/app/main.py` with:
   - `GET /health` → `{"status": "ok"}`
   - `POST /auth/login` → accepts `{membershipNumber, passcode}`, returns `{token}` for demo creds
   - `GET /members` → returns seeded dummy list (stub JWT auth check)
2. Create `backend/requirements.txt` (fastapi, uvicorn, pytest, httpx)
3. Create `scripts/start.sh` — launches `npm run dev` (frontend) and uvicorn (backend) concurrently
4. Create `scripts/stop.sh` — kills both processes
5. Write pytest unit tests in `backend/tests/` for all three endpoints

### Success Criteria
- [ ] `scripts/start.sh` launches both servers without error
- [ ] `GET /health` returns 200 `{"status": "ok"}`
- [ ] `POST /auth/login` with demo credentials returns mock token
- [ ] `POST /auth/login` with bad credentials returns 401
- [ ] All pytest tests pass

---

## Part 3: Members Area UI (frontend, dummy data)

Replace the current members area placeholder with 7 sub-features using dummy data only (no backend calls yet).

### Members Area Landing Page
Renders after login. Shows 7 navigation links. Each sub-feature renders in the main panel with a "Back to Members Area" link (except Meeting Minutes which has two back buttons — see below).

### Sub-features

| # | Link Label | Component | Notes |
|---|---|---|---|
| 1 | Contact Information | `ContactInfoForm` | Form pre-filled from dummy member profile |
| 2 | Birthdays | `BirthdayList` | Dummy member list filtered to birthdays in next 30 days |
| 3 | Prayer Requests | `PrayerRequests` | Submit form + list of dummy requests |
| 4 | Member List | `MemberList` | Table: name, email, birthday, phone; officer-only buttons at bottom |
| 5 | Officers | `OfficerContacts` | Officer grid with name + photo; click opens compose form (stub send) |
| 6 | Knight and Family of the Month | `NominationForm` | Knight field + Family field + Send button (stub) |
| 7 | Meeting Minutes | `MeetingMinutes` | List of dummy entries; click renders PDF inline |

### Member List — Officer-Only Buttons
When the logged-in member is an officer (officerPosition matches a title in `officerTitles`), two additional buttons appear at the bottom of the Member List:
- **Email Members** — opens an inline compose form with a message field and Send button (stub in Part 3; wired to backend in Part 8)
- **Download Members** — triggers a CSV download of all member data to the user's downloads folder

### Meeting Minutes — Navigation
The Meeting Minutes sub-feature has two levels:
1. **List view** — shows all entries; click a file to enter detail view
2. **Detail view** — renders the PDF inline via `<iframe>`; two buttons at bottom:
   - "Back to Meeting Minutes" — returns to list view
   - "Back to Members Area" — returns to the members area landing page

### State Changes to `AppShell`
- Add `memberSubSection: MemberSubSection | null` — which of the 7 sub-features is active
- Add `meetingMinutesDetail: string | null` — which minutes file is open (for the two-level nav)
- Add `isOfficer: boolean` — derived from the logged-in member's `officerPosition` at login time

### New Data (`data/siteData.ts`)
- `MemberProfile` type: firstName, lastName, address, phone, birthday, officerPosition (string | null), email, memberNumber, assemblyNumber (string | null), firstDegreeDate, secondDegreeDate, thirdDegreeDate, fourthDegreeDate
- `MemberSubSection` union type: `"contactInfo" | "birthdays" | "prayerRequests" | "memberList" | "officers" | "nomination" | "meetingMinutes"`
- Dummy member list (~12 records, 2 of which have officerPosition set to titles from `officerTitles`)
- Dummy prayer requests (~5 records)
- Dummy meeting minutes entries (~4 records with placeholder PDF paths)

### New Components
`MembersArea`, `ContactInfoForm`, `BirthdayList`, `PrayerRequests`, `MemberList`, `OfficerContacts`, `NominationForm`, `MeetingMinutes`

### Success Criteria
- [ ] All 7 sub-sections render with dummy data
- [ ] Back-to-members-area navigation works from each sub-section
- [ ] Meeting Minutes detail view has both back buttons functioning correctly
- [ ] "Email Members" and "Download Members" buttons visible only when officer is logged in
- [ ] CSV download produces a valid file with all member fields
- [ ] Vitest tests for each new component
- [ ] Playwright E2E: login → members area → each sub-section → back
- [ ] Playwright E2E: officer login shows extra buttons; non-officer login does not
- [ ] `npm run build` succeeds

---

## Part 4: Demo Login — Already Complete

Verification only:
- [ ] `npm run test` passes
- [ ] `npm run test:e2e` passes
- [ ] `npm run build` produces static export without error

---

## Part 5: Database Schema

**Deliverables:** `docs/schema.md` (human-readable) + `docs/schema.json` (seed data)

### Entities

**members**
- memberNumber (PK, string)
- firstName, lastName
- address (street, city, state, zip)
- phone
- birthday (ISO date string)
- officerPosition (string | null — must match a title in `officerTitles` if set)
- email
- assemblyNumber (string | null)
- firstDegreeDate, secondDegreeDate, thirdDegreeDate, fourthDegreeDate (ISO date | null)
- passcode (string — hashed in production)

**prayer_requests** (S3 text files; metadata tracked separately)
- id (UUID)
- s3Key (path to text file in S3)
- submittedByMemberNumber (FK → members)
- submittedAt (ISO datetime)

**meeting_minutes** (PDF files in S3)
- id (UUID)
- title
- meetingDate (ISO date)
- s3Key (path to PDF in S3)

### Success Criteria
- [ ] Schema document written to `docs/schema.md`
- [ ] Seed JSON written to `docs/schema.json`
- [ ] User approves schema before Part 6 begins

---

## Part 6: Backend API Routes

Replace stubs with endpoints backed by seed data from `docs/schema.json`.

| Method | Path | Auth | Officer only | Purpose |
|---|---|---|---|---|
| `POST` | `/auth/login` | none | no | Validate credentials, return JWT containing memberNumber + isOfficer |
| `GET` | `/members` | required | no | Full member list |
| `GET` | `/members/{id}` | required | no | Single member |
| `PUT` | `/members/{id}` | required | no | Update contact info |
| `GET` | `/members/birthdays` | required | no | Members with birthday in next 30 days |
| `GET` | `/prayer-requests` | required | no | List all (metadata only) |
| `POST` | `/prayer-requests` | required | no | Create new (write text file to S3 stub) |
| `GET` | `/meeting-minutes` | required | no | List all |
| `GET` | `/meeting-minutes/{id}` | required | no | Return S3 pre-signed URL (stub returns local path) |
| `POST` | `/emails/officer` | required | no | Send email to one officer (stub logs to console) |
| `POST` | `/nominations` | required | no | Send nomination email to all officers (stub) |
| `POST` | `/emails/all-members` | required | yes | Send email to all members (stub logs to console) |
| `GET` | `/members/export-csv` | required | yes | Return CSV of all members |

### Success Criteria
- [ ] All endpoints return correct data from seed
- [ ] JWT middleware rejects requests without valid token
- [ ] Officer-only endpoints return 403 for non-officer tokens
- [ ] All pytest tests pass

---

## Part 7: Frontend + Backend Integration

- Replace `lib/auth.ts` demo stub with `POST /auth/login` API call; store JWT in memory (not localStorage)
- JWT payload carries `memberNumber` and `isOfficer`; frontend derives officer status from token
- Replace all dummy data in members area components with API calls
- Add `NEXT_PUBLIC_API_URL` env var (`.env.local` for dev, injected at CloudFront deploy for prod)
- Unit tests mock the API (`vi.mock`); E2E tests hit the real running backend
- Configure CORS in FastAPI to allow the frontend origin

### Success Criteria
- [ ] Login calls backend; logout clears token
- [ ] All 7 members sub-features load real data from API
- [ ] Officer-only buttons appear/disappear correctly based on JWT
- [ ] `npm run test` passes (mocked API)
- [ ] `npm run test:e2e` passes (real backend running)
- [ ] `npm run build` succeeds

---

## Part 8: Email Connectivity

**Prerequisites:** Domain confirmed, SES sender address verified, officer email addresses collected.

### Steps
1. Verify sender address in SES (us-east-1)
2. Create Lambda function (`email-handler`) receiving `{to, subject, body}` and calling SES `SendEmail`
3. Create API Gateway endpoint `POST /send-email` → Lambda
4. Wire backend `/emails/officer`, `/nominations`, `/emails/all-members` to call API Gateway
5. Add real officer email addresses to seed data / `officer_emails`
6. Document setup in `docs/aws-email-setup.md`
7. Test: send a real email to a test address via the UI

### Success Criteria
- [ ] Officer email form delivers a real email
- [ ] Nomination form sends email to all officers
- [ ] Email Members form (officer-only) sends email to all members
- [ ] `docs/aws-email-setup.md` documents the full setup

---

## Part 9: Full Form Submission with Response UI

- All form submissions include full JSON payload in request body
- Backend returns `{success: boolean, message: string}` on all write endpoints
- Frontend shows a modal after each submission: success or error message
- Modal has a dismiss button; forms reset on success

### Success Criteria
- [ ] Contact info update shows success/error modal
- [ ] Prayer request submission shows success/error modal
- [ ] Officer email form shows success/error modal
- [ ] Nomination form shows success/error modal
- [ ] Email Members form shows success/error modal
- [ ] All Vitest and Playwright tests updated and passing
