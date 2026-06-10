# Phase-2 Adding the News and Announcements (Expanded Plan)

This file expands `docs/News-Plan.md` with substeps for each part and records the
design decisions reached in Part 1. The original spec text is retained verbatim
there; this document is the implementation roadmap.

## Design decisions (locked during Part 1)

1. **Sidebar slot** — The existing `news` SectionId / "News & Announcements" sidebar item is reused; the static `sectionContent.news` blurb is removed (same pattern as the Calendar feature replaced `sectionContent.events`).
2. **Officer button label** — "Edit Announcements" (rather than the spec's "Edit Events & Announcements") to avoid overlap with the existing "Calendar Updates" button. The form label inside the popup becomes "Announcement Details".
3. **Expiration semantics** — An announcement is visible through (and including) its delete date. Backend GET filter: include rows where `delete_date >= _today()`. Gone the day after.
4. **Sort order** — Newest first (`created_at desc`) for both the public list and the officer view. Backend returns pre-sorted; frontend renders in order received.
5. **Field caps** — Title 200 chars, Details 2000 chars (mirroring the events entity).
6. **Storage** — New in-memory `announcements_store` mirroring `events_store` / `prayer_requests_store`. The production database table goes into a new `backend/migrations/0002_announcements.sql` for the future RDS migration (no runtime use).
7. **Entity / route name** — `announcement` (singular) as the entity, `/announcements` as the REST root.
8. **Past delete_date** — Both POST and PUT reject `delete_date < _today()` with HTTP 422. Officers should use Delete to remove an announcement immediately rather than back-dating it.
9. **Auto-purge** — Implemented as a server-side filter on GET (records remain in storage but aren't returned). No background cleanup job for the in-memory stub. The future SQL migration captures DDL but keeps the same filter-on-read semantics; a scheduled hard-delete job is out of scope.
10. **Officer view click model** — Clicking a row in the officer view *selects* that row (highlighted), the same selection model used by `CalendarUpdates`. The detail popup (used in the public view) does **not** open in the officer view; Edit pre-fills the form with the selected row's values.
11. **Concurrency** — Reuse the lock pattern from events (a new `_announcements_lock = threading.Lock()`) to protect read-modify-write sequences in the in-memory stub.

## Part 1: Plan
 - Analyze the frontend and backend code base.
 - Document the proposed changes in CLAUDE.md.
 - Expand the new plan with additional substeps.
 - Clarify any questions and get user approval before making any code changes.

## Part 2: Backend Scaffolding
 - Add an `announcements` array to `docs/schema.json` with 2–3 seed records anchored on the current month (one expiring soon, one expiring later).
 - Record shape: `{id, title, details, delete_date (YYYY-MM-DD), created_by, created_at, updated_at}`.
 - Add `announcements_store` to `backend/app/seed.py` (deep-copied like the other stores) and extend `reset_to_seed()`.
 - Add `_announcement_to_response(a)` helper returning camelCase keys (`id, title, details, deleteDate, createdBy, createdAt, updatedAt`).
 - Add Pydantic models behind a shared base class (same approach used for `_EventBody`):
   - `_AnnouncementBody` with `delete_date` regex + `date.fromisoformat` `field_validator`; Title 200 / Details 2000 length caps.
   - Custom validator that rejects `delete_date < _today()` with the message `"delete_date cannot be in the past"`.
   - `AnnouncementCreate` and `AnnouncementUpdate` subclass `_AnnouncementBody`.
 - Add `_announcements_lock = threading.Lock()` next to `_events_lock`.
 - Add endpoints:
   - `GET /announcements` — public; filters out rows where `delete_date < _today()`; sorted by `created_at desc`.
   - `POST /announcements` — officer-only.
   - `PUT /announcements/{id}` — officer-only; 404 if missing.
   - `DELETE /announcements/{id}` — officer-only; 404 if missing.
 - Pytest tests:
   - GET shape + camelCase fields + auto-filter of expired rows (seed one expired entry, confirm it doesn't appear) + sort order (newest first).
   - POST happy + 403 non-officer + 401 no-auth + length-cap 422 + invalid date 422 + past-date 422.
   - PUT happy + 404 + 403 + length-cap + invalid date + past-date.
   - DELETE happy + 404 + 403 + 401.
   - Concurrent POST regression test mirroring the events lock test (slow-append shim + threadpool); guards the lock pattern even though there's no count-cap to enforce — the lock still prevents double-add races and stale-id deletes.

## Part 3: General View UI (front end)
 - Add `getAnnouncements()` and the `Announcement` type to `frontend/lib/api.ts` (no auth required, returns server-sorted list).
 - Add public `News` component:
   - Fetches on mount via `getAnnouncements()`.
   - Renders the title of each announcement as a clickable box stacked vertically (one per row, matching the spec's "boxes down the screen" language).
   - Clicking a box opens `AnnouncementDetailModal` with title + details + a back/close button.
   - "Loading..." placeholder until the first fetch resolves.
 - Add `AnnouncementDetailModal` — read-only popover (Title heading, Details body, Close button). Mirrors `EventDetailModal` styling.
 - Wire `MainPanel.tsx` so `activeSection === "news"` renders `<News />`; remove the `news` entry from `sectionContent` (and add it to the type-exclusion in the same edit, same approach used for `events`).
 - Unit tests:
   - Renders all seed titles as clickable boxes.
   - Clicking a box opens the detail modal with the right title + details.
   - Close button dismisses the modal.

## Part 4: Officer View UI (front end)
 - Add `"announcementsUpdate"` to `MemberSubSection` in `data/siteData.ts`.
 - Add an officer-only **"Edit Announcements"** entry in `MembersArea` (conditional on `isOfficer`, same pattern as "Calendar Updates").
 - Add `AnnouncementsUpdate` component:
   - Props: `{ token, onBack }`.
   - Fetches via `getAnnouncements()` on mount and after every successful mutation (via the `refreshKey` pattern).
   - Renders the same vertical list of title-boxes; click a box → `selectedId` state (highlighted).
   - Bottom row of buttons: Add / Edit / Delete.
   - Validation pop-ups via `SubmitModal` (error variant):
     - Edit/Delete clicked with no selection → "Please select an announcement first."
   - Add button always available; doesn't need selection.
 - Add `AnnouncementFormModal` (Add and Edit modes):
   - Fields: Title (required, ≤200), Announcement Details (required, ≤2000), Date to Delete (required, `<input type="date">`).
   - Save and Cancel buttons; Save disabled until Title + Details + Date to Delete are all set (frontend mirrors backend invariants).
   - Accepts a `submitting` prop and disables Save / shows "Saving..." while in-flight (same Part-9 pattern as events).
 - Reuse the existing `ConfirmDialog` for delete confirmation with the spec's copy: title "Confirm the delete?", buttons Cancel / Delete.
 - All Add / Edit / Delete mutations operate on dummy in-memory state in this part — no API calls yet (those land in Part 8). Save closes the modal; selection clears on Delete; success/error feedback shown via the existing `SubmitModal`.
 - Unit tests:
   - Selection highlights the clicked row; only one row highlighted at a time.
   - No-selection pop-up on Edit / Delete.
   - Add form opens empty; saving updates dummy state.
   - Edit form opens pre-filled with the selected row.
   - Delete confirm: Delete removes from dummy state; Cancel does not.

## Part 5: Demo Login
 - Vitest unit (AppShell): visitor → no "Edit Announcements" button visible.
 - Vitest unit (AppShell): non-officer login → no "Edit Announcements" button.
 - Vitest unit (AppShell): officer login → button visible and navigates to the new view.
 - Pytest backend: explicit no-auth (401/403) and non-officer (403) tests on POST / PUT / DELETE `/announcements`. (Most of these will already exist from Part 2; this part confirms parity.)
 - Playwright E2E: non-officer (8301004 / hope830) login confirms no Edit Announcements entry; officer (8301002 / charity830) sees and opens it.

## Part 6: Database Schema
 - Add `backend/migrations/0002_announcements.sql` capturing the DDL for the future production `announcements` table:
   - `id UUID PRIMARY KEY`
   - `title VARCHAR(200) NOT NULL CHECK (length(title) > 0)`
   - `details VARCHAR(2000) NOT NULL CHECK (length(details) > 0)`
   - `delete_date DATE NOT NULL`
   - `created_by VARCHAR(20) NOT NULL REFERENCES members(member_number)`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - Index: `idx_announcements_delete_date ON announcements(delete_date)` to accelerate the auto-purge filter.
   - Index: `idx_announcements_created_at_desc ON announcements(created_at DESC)` for the public sort order.
 - Append a "Data Model" section to `News-Plan2.md` (this file) with the field-mapping table (Python ↔ API ↔ SQL), once Part 6 is delivered.
 - No runtime code change — DDL only.

## Part 7: Backend API Routes
 - Confirm `created_by`, `created_at`, `updated_at` populated on POST and `updated_at` bumped on PUT (routed through the existing `_now_iso()` / `_today()` helpers so tests can pin timestamps deterministically).
 - Confirm the `GET /announcements` filter calls `_today()` (patchable for tests).
 - Integration test (pytest): full create → list (verify present, sorted, not yet expired) → update → list → delete → list against the live in-memory store.
 - Pin invariants test: PUT does not change `created_by` or `created_at` (mirrors the events test).

## Part 8: Frontend + Backend Integration
 - Add `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement` to `frontend/lib/api.ts` (officer-token via the existing `apiFetch` helper; benefits from the Part 9 backend-detail surfacing automatically).
 - Replace the dummy-state mutators in `AnnouncementsUpdate` with these API calls. Success → close form, show `SubmitModal` with the backend's `message`, bump `refreshKey`. Failure → keep form open with values preserved and show the backend `detail` message verbatim (same Part-9 pattern from `CalendarUpdates`).
 - Playwright E2E: officer logs in → Edit Announcements → Add an announcement → confirms it appears in the public News view → returns and edits → reconfirms in News → returns and deletes → confirms gone from both views.
 - Additional E2E: officer creates an announcement with `delete_date = today`, confirms it's still visible in the public list (validates the "visible through delete date" decision end-to-end).

## Part 9: Full Form Submission with Response UI
 - Reuse `SubmitModal` for success / error feedback on every Add / Edit / Delete.
 - On success: form modal closes, success modal dismisses, refetch fires (same wiring as Part 8 events).
 - On error: form remains open with user values preserved; error modal shows backend detail verbatim (via the existing `apiFetch` detail extraction). Mirrors the events Part-9 behavior exactly.
 - Delete error path: matches events — error modal shown, user re-initiates from the list. (Documented gap; cheap to refine later.)

## What I would touch (preview, no edits yet)
**Backend**
 - `docs/schema.json` — add `announcements` array with seed rows.
 - `backend/app/seed.py` — `announcements_store` + `reset_to_seed()`.
 - `backend/app/main.py` — `_announcements_lock`, `_announcement_to_response`, `_AnnouncementBody` + subclasses, four endpoints.
 - `backend/tests/test_main.py` — full coverage as itemised above.
 - `backend/migrations/0002_announcements.sql` — DDL (Part 6).

**Frontend**
 - `frontend/lib/api.ts` — `Announcement` type, `getAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`.
 - `frontend/lib/date.ts` — no change (reuse `formatDay`).
 - `frontend/data/siteData.ts` — drop `news` from `sectionContent`; add `"announcementsUpdate"` to `MemberSubSection`.
 - `frontend/components/News.tsx` (new) + test.
 - `frontend/components/AnnouncementDetailModal.tsx` (new) + test.
 - `frontend/components/AnnouncementsUpdate.tsx` (new) + test.
 - `frontend/components/AnnouncementFormModal.tsx` (new) + test.
 - `frontend/components/MembersArea.tsx` — conditional officer entry "Edit Announcements".
 - `frontend/components/visibility specs for the new entry.
 - `frontend/components/MainPanel.tsx` — route `news` → `<News />` and `announcementsUpdate` (officer-gated) → `<AnnouncementsUpdate />`.
 - `frontend/components/AppShell.test.tsx` — officer-vs-non-officer entry visibility.
 - `frontend/e2e/app.spec.ts` — sync test (Part 8) + non-officer visibility test (Part 5) + delete-date-today edge case (Part 8).

**Docs**
 - `CLAUDE.md` (root) — one-line architecture note about the `news` SectionId now rendering `<News />`.
 - `frontend/CLAUDE.md` — Component Structure entries for `News`, `AnnouncementDetailModal`, `AnnouncementsUpdate`, `AnnouncementFormModal`; API client additions in Data & Auth.

## Open items (flagged for veto before Part 2 starts)
 - **Past delete_date on PUT**: I'm rejecting it with 422 (decision 8). If you'd rather PUT *allow* back-dating (so an officer can effectively "schedule expiration" by setting delete_date = yesterday), say so and I'll relax only the PUT validator.
 - **Officer sees expired entries**: With decision 3 (option 1), even officers don't see expired rows. If you want officers to see and republish them, that's a small backend flag (`?inclu
 - **Sort tiebreaker**: With many same-second `created_at` values (only realistic from a bulk import), I'll tiebreak by `id` for determinism. Trivial detail, mentioning for completeness.

## Data Model (Part 6 reference)

Today the announcements live in an in-memory Python list (`announcements_store` in `backend/app/seed.py`), deep-copied from `docs/schema.json` on every backend startup. The `reset_to_seed()` helper restores it between tests. Mutations made via the live API are lost on restart — same pattern as `events_store` and `prayer_requests_store`.

The target production shape is captured in `backend/migrations/0002_announcements.sql`. It is **not** executed at runtime today; the file exists so the eventual RDS migration has an approved contract to apply.

| Field           | Backend (Python dict) | API (camelCase) | SQL (`announcements` table)              | Notes |
|-----------------|-----------------------|-----------------|------------------------------------------|-------|
| Id              | `id`                  | `id`            | `id UUID PRIMARY KEY`                    | UUID; backend mints with `uuid.uuid4()`. |
| Title           | `title`               | `title`         | `title VARCHAR(200) NOT NULL`            | Required, 1–200 chars. |
| Details         | `details`             | `details`       | `details VARCHAR(2000) NOT NULL`         | Required, 1–2000 chars. |
| Delete date     | `delete_date`         | `deleteDate`    | `delete_date DATE NOT NULL`              | `YYYY-MM-DD`; must be ≥ today on POST/PUT. |
| Created by      | `created_by`          | `createdBy`     | `created_by VARCHAR(20) NOT NULL REFERENCES members(member_number)` | Officer member number from JWT `sub`. |
| Created at      | `created_at`          | `createdAt`     | `created_at TIMESTAMPTZ NOT NULL`        | Set on POST via `_now_iso()`. |
| Updated at      | `updated_at`          | `updatedAt`     | `updated_at TIMESTAMPTZ NOT NULL`        | Bumped on every PUT via `_now_iso()`. |

**Invariants enforced today (application layer)**
 - **Officer-only writes**: `POST`, `PUT`, and `DELETE /announcements` all sit behind `_require_officer`. Public read (`GET /announcements`) is unauthenticated.
 - **Past `delete_date` rejected**: `_AnnouncementBody._validate_delete_date` raises 422 if `delete_date < _today()`. Officers should use `DELETE` to remove an announcement immediately rather than back-dating it.
 - **Auto-purge via GET filter**: `get_announcements()` returns only rows where `delete_date >= _today()`. Records stay in storage; visibility is server-derived. A scheduled hard-delete job is out of scope for now.
 - **Concurrency**: `_announcements_lock` (a `threading.Lock`) serializes the read-modify-write sequences in POST / PUT / DELETE handlers. The production SQL version should rely on transactions instead.

**Indexes** (for the future SQL table):
 - `idx_announcements_delete_date` — accelerates the `delete_date >= today` filter on every public read.
 - `idx_announcements_created_at_desc` — supports the newest-first sort order used by the public list and the officer view.
