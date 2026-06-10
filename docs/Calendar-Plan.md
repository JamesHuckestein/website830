# Phase-2 Adding the Calendar

## Calendar Description
 - This is an interactive calendar view where users see the current month displayed where the days are boxes on the screen.  When an event is scheduled for a particular day a link will be displayed in the box for that day.  When the user clicks on the link a pop-up window will appear on the screen which shows more information about the event.

### General View
 - The user does not login to the members only area of the website.
 - Access via the Calendar button on the left pane of the main window.
 - When a visitor clicks the Calendar button the calendar displays in the main window.
 - The current month is displayed as boxes where Mondays are the column on the left followed by Tuesdays, Wednesdays, Thursdays, Fridays, Saturdays and Sundays being the column on the right.
 - The number of the day of the month is shown in the box at the top left of each individual box.
 - The boxes not used for days of the month do not have a number in the top left of the box.  For example, if the first day of the month is on a Wednesday the Monday and Tuesday boxes to the left of the first day on the same row will not have any numbers in them.
 - The calendar defaults to showing the current month and updates automatically by the current date.
 - At the top of the calendar there is a left arrow button which allows the user to update the display back to the previous month and a right arrow button which allows the user to update the display to the next upcoming month.
 - When an event has been submitted for a particular day on the calendar the title of the event will be shown in the calendar box as a link.
 - When the user clicks on a particular link in on the calendar a pop-up box will appear with the Title of the event at the top and a text field with the details of the event below.  At the bottom of the pop-up window will be a Close button which closes window and returns the main window to the calendar view.


### Members Only View
 - The user must be logged in to the members only area of the website and must be one of the council officers to see this view.
 - When an officer is logged in the landing page contains an additional button called the Calendar Updates button.
 - When the Calendar Updates button is selected the main window shows a view very similar and synchronized with the general calendar view.
 - At the bottom of the calendar there are three buttons Add, Edit and Delete.
 - If no box for a particular day is selected and one of the three buttons at the bottom of the calendar is selected a pop-up window will appear saying "Please select a day first."
 - When the officer selects a day box on the calendar the box will be highlighted.
 - When a day is highlighted on the calendar and the Add button is clicked a pop-up form window will appear where the user can enter text for the Title and the Description.  When the Save button is clicked on this form the entry text will be saved and the title will be displayed on the Members Only View and the General View.
 - When a day is highlighted on the calendar and the Edit button is clicked a pop-up form window will appear with the Title and Description already populated with the previously entered text.  When the Save button is clicked on this form the updated entry text will be saved and the title will be displayed on the Members Only View and the General View.
 - When a day is highlighted on the calendar and the Delete button is clicked a pop-up window will appear with the text "Will you confirm?" and a Yes button and No button.  If the Yes button is selected the Title and Description will be deleted.  The General View and the Members Only View will have the Title deleted from the calendar.  If the No button is selected the pop-up window will close and no further action will be taken.

## Design decisions (locked during Part 1)
 - **Sidebar slot**: The existing `events` SectionId / "Events Calendar" sidebar item is reused; the static `sectionContent.events` blurb is removed.
 - **Events per day**: Maximum of 3. Server enforces with HTTP 409 Conflict on POST when a 4th event is attempted for the same day.
 - **Storage**: In-memory store mirroring prayer requests. Persistence to a production database is deferred to production work (out of scope here).
 - **Event fields**: Title (required, ≤200 chars), Description (required, ≤2000 chars), Time-of-day (optional, `"HH:MM"` 24-hour string, rendered 12-hour am/pm), Location (optional, ≤200 chars).
 - **Date storage**: `day` as `YYYY-MM-DD` (no timezone), matching prayer-requests' use of `date.today()`.
 - **Adjacent-month cells**: blank — no day number, no events.
 - **Edit/Delete with no event on the selected day**: pop-up "No event on this day."
 - **Edit/Delete when a day has multiple events**: small picker modal lists the day's events; officer chooses one.
 - **Add when the day already has 3 events**: backend returns 409; frontend shows error pop-up.

## Part 1: Plan
 - Analyze the frontend and backend code base.
 - Document the proposed changes in CLAUDE.md.
 - Expand the new plan with additional substeps.
 - Clarify any questions and get user approval before making any code changes.

## Part 2: Backend Scaffolding
 - Add an `events` array to `docs/schema.json` with ~3 seed events anchored on the current month.
 - Event record shape: `{id, day (YYYY-MM-DD), title, description, time_of_day?, location?, created_by, created_at, updated_at}`.
 - Add `events_store` to `backend/app/seed.py` (deep-copied from schema like the other stores) and extend `reset_to_seed()`.
 - Add Pydantic models `EventCreate` and `EventUpdate` with `Field(...)` length caps on each text field.
 - Add `_event_to_response(e)` helper returning camelCase keys (mirrors `_prayer_request_to_response`).
 - Add endpoints in `backend/app/main.py`:
   - `GET /events` — public; optional `?month=YYYY-MM` filter.
   - `POST /events` — officer-only; rejects with 409 if the day already holds 3 events.
   - `PUT /events/{id}` — officer-only; 404 if id missing.
   - `DELETE /events/{id}` — officer-only; 404 if id missing.
 - Pytest unit tests:
   - GET shape (camelCase fields; no auth required).
   - POST happy path; POST blocked at max-3-per-day (409); POST blocked for non-officer (403); POST length-cap rejections (422).
   - PUT happy path; PUT 404 for unknown id; PUT non-officer rejected.
   - DELETE happy path; DELETE 404 for unknown id; DELETE non-officer rejected.

## Part 3: General View UI (front end)
 - Add `getEvents(month?)` and the `Event` type to `frontend/lib/api.ts` (no auth header).
 - Add `CalendarGrid` shared component: 7-column Mon→Sun grid; props `{year, month, events, onDayClick?, selectedDay?, renderDay?}`; blank leading/trailing cells outside the visible month; up to 3 event-title links per cell.
 - Add public `Calendar` component: month-state, prev/next arrow buttons, fetches via `getEvents(month)` on mount and on month change; clicking an event title opens `EventDetailModal`.
 - Add `EventDetailModal`: title, description, time (rendered 12-hour am/pm), location, Close button.
 - Wire `MainPanel.tsx` so `activeSection === "events"` renders `<Calendar />`; remove the `events` entry from `sectionContent`.
 - Add ~3 seed events to the current month so the empty view never looks blank.
 - Unit tests: grid shows correct day numbers, leading blanks render with no number, prev/next refetch, event-title click opens the detail modal.

## Part 4: Officer View UI (front end)
 - Add `"calendarUpdates"` to `MemberSubSection` in `data/siteData.ts`.
 - Add an officer-only "Calendar Updates" button in `MembersArea` (use the `isOfficer` prop currently shadowed as `_isOfficer`).
 - Add `CalendarUpdates` component: reuses `CalendarGrid` with `selectedDay` state and a day-click handler; renders Add / Edit / Delete buttons below the grid.
 - Add `EventFormModal`: Title (required), Description (required), Time `<input type="time">` (optional), Location (optional); Save and Cancel buttons.
 - Add `DayEventPicker` modal: appears when Edit or Delete is clicked on a day that holds ≥2 events; lists the events and lets the officer pick one.
 - "Please select a day first." pop-up: rendered via `SubmitModal` (error variant) when Add/Edit/Delete is clicked with no selected day.
 - "No event on this day." pop-up: rendered the same way when Edit/Delete is clicked on a day with zero events.
 - "Max 3 events" pop-up: rendered when Add is clicked on a day that already holds 3 events.
 - Delete confirmation: reuse the existing `ConfirmDialog` with copy "Will you confirm?" and Yes / No buttons (matching the spec verbatim).
 - All Add/Edit/Delete mutations operate on dummy in-memory state in this part — no API calls yet (those land in Part 8).
 - Unit tests: selection highlights the clicked day; no-selection pop-up; no-event-on-day pop-up; max-3 pop-up; form save updates the dummy state; multi-event picker flow; delete confirm Yes/No.

## Part 5: Demo Login
 - Vitest unit: visitor (not logged in) → "Calendar Updates" button not in DOM.
 - Vitest unit: regular non-officer member → "Calendar Updates" button not in DOM.
 - Vitest unit: officer → "Calendar Updates" button visible and navigates to the new view.
 - Pytest backend: explicit tests confirm `POST /events`, `PUT /events/{id}`, `DELETE /events/{id}` reject a non-officer JWT with 403.
 - Playwright E2E: non-officer login (8301004 / hope830) confirms no Calendar Updates entry.

## Part 6: Database Schema
 - Add `backend/migrations/0001_events.sql` capturing the DDL for the eventual production `events` table (id PK, day, title, description, time_of_day, location, created_by FK → members, created_at, updated_at; indexes on `day` and `created_by`).
 - Add a short data-model note to `docs/Calendar-Plan.md` (or a new `docs/data-model.md`) describing the relationship to the in-memory store.
 - No runtime code change in this part — DDL is captured for the future RDS migration only.

## Part 7: Backend API Routes
 - Confirm `created_by`, `created_at`, `updated_at` are populated on POST and that `updated_at` is bumped on PUT.
 - Add a `_today()` helper returning `date.today()` so tests can pin "today" deterministically; route all server-side day comparisons through it.
 - Integration test exercising the full create → list → update → delete lifecycle against the live in-memory store.
 - Document month-filter semantics (`?month=YYYY-MM` returns events whose `day` starts with that string).

## Part 8: Frontend + Backend Integration
 - Add `createEvent`, `updateEvent`, `deleteEvent` to `frontend/lib/api.ts`.
 - Replace the dummy-state mutators in `CalendarUpdates` with these API calls.
 - After every successful Add / Edit / Delete, refetch the visible month so the officer view and the public view stay consistent.
 - Playwright E2E: officer creates an event → public Calendar shows it → officer edits → still in sync in both views → officer deletes → gone from both views.

## Part 9: Full Form Submission with Response UI
 - Reuse the existing `SubmitModal` for success/error feedback after every Add / Edit / Delete.
 - On success: form modal closes, success modal dismisses, refetch fires (re-using the Part 8 refresh).
 - On error: error modal shown; form modal remains open with the user's values preserved so they can correct and retry.
 - Backend write endpoints already return `{success: boolean, message: string}` (Part 2 spec) — the frontend wires that message verbatim into the modal.

## Data Model (Part 6 reference)

Today the calendar's events live in an in-memory Python list (`events_store` in `backend/app/seed.py`), deep-copied from `docs/schema.json` on every backend startup. The `reset_to_seed()` helper restores it between tests. Mutations made via the live API are lost on restart — same pattern as `prayer_requests_store` and `meeting_minutes_store`.

The target production shape is captured in `backend/migrations/0001_events.sql`. It is **not** executed at runtime today; the file exists so the eventual RDS migration has an approved contract to apply.

| Field         | Backend (Python dict)   | API (camelCase)   | SQL (`events` table)           | Notes |
|---------------|-------------------------|-------------------|--------------------------------|-------|
| Id            | `id`                    | `id`              | `id UUID PRIMARY KEY`          | UUID; backend mints with `uuid.uuid4()`. |
| Day           | `day`                   | `day`             | `day DATE NOT NULL`            | `YYYY-MM-DD`; matches `EventCreate.day` regex. |
| Title         | `title`                 | `title`           | `title VARCHAR(200) NOT NULL`  | Required, 1–200 chars. |
| Description   | `description`           | `description`     | `description VARCHAR(2000) NOT NULL` | Required, 1–2000 chars. |
| Time of day   | `time_of_day`           | `timeOfDay`       | `time_of_day TIME`             | Optional; `"HH:MM"` 24-hour string. |
| Location      | `location`              | `location`        | `location VARCHAR(200)`        | Optional, ≤200 chars. |
| Created by    | `created_by`            | `createdBy`       | `created_by VARCHAR(20) NOT NULL REFERENCES members(member_number)` | Officer member number from JWT `sub`. |
| Created at    | `created_at`            | `createdAt`       | `created_at TIMESTAMPTZ NOT NULL` | Set on POST. |
| Updated at    | `updated_at`            | `updatedAt`       | `updated_at TIMESTAMPTZ NOT NULL` | Bumped on every PUT. |

**Invariants enforced today (application layer)**
 - Maximum of 3 events per day. `POST /events` returns HTTP 409 when the day is full; `PUT /events/{id}` returns 409 when the target day is full and the event is being moved into it.
 - Write endpoints require an officer JWT (`_require_officer`). Read endpoint is public.

**Indexes** (for the future SQL table): `idx_events_day` accelerates the `?month=YYYY-MM` filter on `GET /events`; `idx_events_created_by` supports per-officer queries that the audit/admin views may need later.