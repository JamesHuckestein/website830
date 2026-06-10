# Photo Gallery — Phase-2 Detailed Plan

Expanded plan for the Photo Gallery feature described in `Photo-Gallery.md`, mirroring the structure used in `News-Plan2.md`. This is a planning document only — no code changes until each part is approved.

## Locked Design Decisions

These were settled in conversation with the user before Part 2 begins:

1. **Sidebar nav** — reuse the existing `photos` `SectionId` and the existing "Photo Galleries" nav item. The current static `sectionContent.photos` blurb in `data/siteData.ts` is removed (mirrors how `news` and `events` were handled).
2. **Officer button label** — "Edit Photo Gallery" (singular, matches the plan).
3. **Members sub-section id** — `"editPhotoGallery"` added to the `MemberSubSection` union.
4. **Entity name** — `photo`. Backend store: `photos_store`. Frontend type: `Photo`. List endpoint: `GET /photos`. Lock: `_photos_lock`.
5. **Sort order** — `created_at` ASC (oldest first → newest at the bottom of the two-column grid), with `id` as a deterministic tiebreaker. The Officer view uses the same order so positions match the public view.
6. **Title cap** — `1..200` characters, required, trimmed of surrounding whitespace before validation.
7. **Photo field — dev phase** — In Parts 2–9 the form uses a single required `photoUrl` text input (≤2048 chars). No real file uploads, no multipart endpoints, no S3 in this phase. The Add/Edit form shows the helper text "Supported formats: JPEG, PNG, WebP, GIF" next to the field so the UX matches the eventual file-picker shape. **Real drag-and-drop file upload + S3 storage + 5 MB cap is out of scope for Phase 2** and will be a follow-on phase once AWS infrastructure exists. TIFF is dropped from the supported-formats list.
8. **In-memory store** — Phase 2 backend uses an in-memory `photos_store` deep-copied from `docs/schema.json` on startup, exactly like announcements/events/prayer-requests. Production migration DDL is added at the end (Part 6) but not run.
9. **Modals** — reuse the existing `ConfirmDialog` ("Confirm the delete?", Delete / Cancel) and `SubmitModal` (success / error after a write). New form modal: `PhotoFormModal.tsx`. No photo "detail" modal — the public view is non-interactive per the plan.
10. **Auth** — write endpoints require an officer JWT (`isOfficer === true`). `GET /photos` is public. Officer-only sub-section is gated by `isOfficer && memberSubSection === "editPhotoGallery"` in `MainPanel`, and the "Edit Photo Gallery" entry in `MembersArea` only renders for officers (same pattern as Calendar Updates / Edit Announcements).
11. **Errors** — write endpoints return `{success: boolean, message: string, id?: string}` shape, frontend surfaces backend `detail` verbatim via the existing `apiFetch` extractor, form stays open with values preserved on error (Calendar/Announcements pattern).
12. **No max count** — there is no cap on how many photos can exist in the gallery (unlike events' 3-per-day cap).
13. **No auto-purge** — photos do not have a delete_date. They live until an officer deletes them.

## Data Model

In-memory record shape (matches `docs/schema.json` entry):

```json
{
  "id": "uuid",
  "title": "string, 1..200",
  "photo_url": "string, 1..2048",
  "created_by": "member_number",
  "created_at": "ISO-8601 UTC",
  "updated_at": "ISO-8601 UTC"
}
```

Frontend `Photo` type (camelCase, like `Announcement`):

```ts
type Photo = {
  id: string;
  title: string;
  photoUrl: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
type PhotoWriteBody = { title: string; photoUrl: string };
```

API client functions (in `lib/api.ts`):
- `getPhotos(): Promise<Photo[]>` — public, sorted `created_at` ASC
- `createPhoto(token, body): Promise<{success, message, id}>`
- `updatePhoto(token, id, body): Promise<{success, message}>`
- `deletePhoto(token, id): Promise<{success, message}>`

## Component Shapes

```
PhotoGallery        — public, renders for activeSection === "photos"
                      two-column grid of <PhotoCard /> boxes mirroring the Officers grid
                      fetches via getPhotos(); no click handler, no detail modal
PhotoCard           — presentational: rounded box, centered <img> (object-contain),
                      title strip below. Reused by PhotoGallery and PhotoGalleryUpdate
                      so layout matches.
PhotoGalleryUpdate  — officer-only members sub-section
                      (memberSubSection === "editPhotoGallery")
                      props: { token, onBack }; renders the grid with click-to-select
                      highlight; Add / Edit / Delete buttons + Back to Members Area;
                      uses PhotoFormModal / ConfirmDialog / SubmitModal as needed;
                      mirrors AnnouncementsUpdate including the stale-selection cleanup
                      effect (clear selectedId when row disappears from a refresh).
PhotoFormModal      — officer form: Title (required, ≤200), Photo URL (required, ≤2048),
                      with helper text "Supported formats: JPEG, PNG, WebP, GIF".
                      Save / Cancel; `submitting` prop disables both and shows "Saving...".
```

## Part 2 — Backend Scaffolding

1. **Seed data** in `docs/schema.json`:
   - Add a `"photos"` array with 2 seed entries (UUIDs prefixed `e5f6a7b8-...`), e.g. "Spring Charity Dinner 2026" and "St. Patrick Day Service Project", with `photo_url` pointing to images under `/public/gallery/*.jpg` (added in Part 3).
2. **Seed loader** in `backend/app/seed.py`:
   - Add `photos_store` (list of dicts), extend `reset_to_seed()` to repopulate it on startup.
3. **Pydantic schemas** in `backend/app/main.py`:
   - `class _PhotoBody(BaseModel)` with `title: str` (`min_length=1, max_length=200`) and `photoUrl: str` (`min_length=1, max_length=2048`).
   - `field_validator("title")` strips and re-validates non-empty.
   - `class PhotoCreate(_PhotoBody): pass`, `class PhotoUpdate(_PhotoBody): pass`.
4. **Endpoints** (all with `_photos_lock = threading.Lock()` wrapping mutating read-modify-write):
   - `GET /photos` → public; returns sorted by `(created_at, id)` ASC; uses `_photo_to_response(p)` to convert snake_case → camelCase.
   - `POST /photos` → officer JWT required; generates UUID, sets `created_by` from `sub`, `created_at`/`updated_at` from `_now_iso()`; appends to store; returns `{success: True, message: "Photo added.", id}`.
   - `PUT /photos/{id}` → officer JWT required; updates title/photo_url; preserves `created_by` and `created_at`; bumps `updated_at`; returns `{success: True, message: "Photo updated."}`. 404 if not found.
   - `DELETE /photos/{id}` → officer JWT required; removes by id; returns `{success: True, message: "Photo deleted."}`. 404 if not found.
5. **Tests** in `backend/tests/test_main.py` — target ~22 tests:
   - GET shape + sort order (oldest first)
   - POST happy / 401 missing JWT / 403 non-officer / 422 empty title / 422 oversize title / 422 empty photoUrl / 422 oversize photoUrl
   - PUT happy / 403 / 404 / 422 invalid body
   - DELETE happy / 403 / 404 / 401
   - Full lifecycle (POST → GET → PUT → GET → DELETE → GET)
   - Audit-fields populated (createdBy from JWT, createdAt from `_now_iso` monkeypatch)
   - PUT preserves `createdBy` / `createdAt`
   - Concurrent POST using a `SlowAppendStore` shim — verify all writes succeed and order is preserved (no race-related state loss since there's no max cap).
6. **No frontend changes in this part.**

## Part 3 — General View UI (front end)

1. Add 2 example photos to `frontend/public/gallery/` (placeholder JPGs are fine; they're served as static assets).
2. Create `frontend/components/PhotoCard.tsx` — presentational box mirroring the Officers grid:
   - Rounded outer `border border-[#E7E7E7] bg-white`
   - Centered `<Image>` with `object-contain object-top`, sized like Officers grid (~h-36)
   - Title strip below: `font-semibold text-[#032147]`
3. Create `frontend/components/PhotoGallery.tsx`:
   - `"use client"`; `useEffect` → `getPhotos()`; loading state shows "Loading..."
   - Renders `<h2>Photo Galleries</h2>` + two-column `grid sm:grid-cols-2 gap-3` of `<PhotoCard />`
4. Wire `MainPanel`: `activeSection === "photos"` → `<PhotoGallery />`. Remove `photos` from the `sectionContent` map and the `Exclude<...>` type parameter.
5. Update `lib/api.ts` with `Photo` type + `getPhotos()`.
6. Unit tests `PhotoGallery.test.tsx`:
   - Renders titles from mocked `getPhotos`
   - Shows "Loading..." before fetch resolves
   - Empty list renders an empty grid (no error)
   - Order is preserved as returned (oldest first; the backend sorts)

## Part 4 — Officer View UI (front end)

1. Add `"editPhotoGallery"` to `MemberSubSection` union in `data/siteData.ts`.
2. Extend `MembersArea` officer-only links to include `{ key: "editPhotoGallery", label: "Edit Photo Gallery" }`. Renders only when `isOfficer === true`.
3. Wire `MainPanel`: `memberSubSection === "editPhotoGallery" && isOfficer` → `<PhotoGalleryUpdate token onBack />`.
4. Create `frontend/components/PhotoFormModal.tsx`:
   - Props: `{ mode: "add" | "edit", initialValues?: { title; photoUrl }, submitting: boolean, onSave, onCancel }`
   - Fields: Title (`<input>`, required, maxLength 200), Photo URL (`<input>`, required, maxLength 2048) with helper text "Supported formats: JPEG, PNG, WebP, GIF"
   - Save button disabled when either field is empty or `submitting`; label flips to "Saving..."
   - Cancel button always enabled
5. Create `frontend/components/PhotoGalleryUpdate.tsx`:
   - State: `photos | null`, `refreshKey`, `selectedId`, `feedback`, `formOpen`, `confirmDelete`, `submitting`
   - Fetch via `getPhotos()` on mount and on `refreshKey` bump
   - Stale-selection-cleanup effect (mirror of AnnouncementsUpdate.tsx:49–53)
   - Photos render in the same two-column grid as the public view; each card is a `<button aria-pressed>` with selection highlight (`border-[#753991] bg-[#753991]/10`)
   - Add / Edit / Delete buttons below grid:
     - Add → opens `PhotoFormModal` in `"add"` mode
     - Edit / Delete with no selection → opens `SubmitModal` with "Please select a photo first."
     - Edit → opens `PhotoFormModal` in `"edit"` mode pre-filled with selection
     - Delete → opens `ConfirmDialog` with `title="Confirm the delete?"`, `confirmLabel="Delete"`, `cancelLabel="Cancel"`, `message={\`"${selected.title}"\`}`
   - "Back to Members Area" link
6. **Dummy data only in this part** — the form's `onSave` and the delete handler are wired to local state for now (push/replace/filter the in-memory React state), not the backend. Comments mark the spots that Part 7/8 will replace.
7. Unit tests `PhotoGalleryUpdate.test.tsx` and `PhotoFormModal.test.tsx`:
   - Fetch + render titles
   - Click highlights one row at a time
   - Edit / Delete with no selection shows the pop-up
   - Add form opens with empty fields, validates required, calls `onSave` with body
   - Edit pre-fills, allows changes, calls `onSave` with new body
   - Delete shows ConfirmDialog with "Confirm the delete?"; Cancel does nothing; Delete removes from local state
   - Back to Members Area calls `onBack`

## Part 5 — Demo Login Tests

1. **Unit tests** that prove:
   - Logged-out visitor: `MembersArea` is not rendered (login form is shown instead)
   - Logged-in non-officer member: `MembersArea` does NOT render the "Edit Photo Gallery" link
   - Logged-in officer: `MembersArea` does render "Edit Photo Gallery" and clicking it navigates to `PhotoGalleryUpdate`
2. **Playwright E2E** in `e2e/app.spec.ts`:
   - "Edit Photo Gallery entry is hidden from non-officers" (uses member `8301001` who is Deputy Grand Knight in seed → actually IS officer; use a non-officer seed member or stub `isOfficer = false`)
   - "Officer sees and opens Edit Photo Gallery" (Add/Edit/Delete buttons visible)
   - "Non-officer cannot reach `/photos`-editor by clicking Members" (heading "Edit Photo Gallery" never appears)

## Part 6 — Database Schema

1. Add `backend/migrations/0003_photos.sql`:
   ```sql
   CREATE TABLE photos (
       id UUID PRIMARY KEY,
       title VARCHAR(200) NOT NULL CHECK (length(title) > 0),
       photo_url VARCHAR(2048) NOT NULL CHECK (length(photo_url) > 0),
       created_by VARCHAR(20) NOT NULL REFERENCES members(member_number),
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE INDEX idx_photos_created_at_asc ON photos(created_at ASC);
   ```
2. Update `docs/schema.md` to document the new table.
3. Note in the migration header: "Production stores `photo_url` as an S3 object URL written by the upload pipeline added in a later phase."

## Part 7 — Backend API Routes (no-op if Part 2 already shipped them)

If Parts 2 and 4 were merged together, this is empty. Otherwise:
1. Promote the endpoints from any scaffolding state to fully validated.
2. Confirm OpenAPI docs render correctly (`/docs`).
3. Tighten error responses to match the `{success, message}` contract.

## Part 8 — Frontend + Backend Integration

1. Replace dummy-data calls in `PhotoGalleryUpdate.tsx` with `createPhoto` / `updatePhoto` / `deletePhoto`.
2. Add `createPhoto`, `updatePhoto`, `deletePhoto` to `lib/api.ts`.
3. Add the keep-form-open-on-error pattern (submitting state, error feedback, form values preserved).
4. Add `refreshKey` increment in success paths so the list refetches.
5. Update unit tests to mock `lib/api`; remove the local-state shortcut from Part 4.
6. Playwright E2E:
   - Officer Add → photo appears in public gallery
   - Officer Edit → updated title appears in public gallery
   - Officer Delete → photo removed from public gallery
   - Add form stays open with values preserved on backend error (use Playwright route interception to return 500 + `{detail: "..."}`)
   - Strict-mode collision check: search for "Edit Photo Gallery" exact-match to avoid matching the "Edit Photo Gallery" heading vs the button label.

## Part 9 — Full Form Submission with Response UI

1. Confirm `SubmitModal` is shown after each write (success and error).
2. Confirm modal stacking order: ConfirmDialog renders before `SubmitModal` so the SubmitModal stacks on top after the delete completes.
3. Confirm form resets on successful Add (Edit closes the form on success since values were saved).
4. Update `CLAUDE.md` (root) to add the Photo Gallery to the layout description.
5. Update `frontend/CLAUDE.md`:
   - Component Structure: add `PhotoGallery`, `PhotoGalleryUpdate`, `PhotoCard`, `PhotoFormModal`
   - Data & Auth → `lib/api.ts` → add Photos line
   - `MemberSubSection` note: add `"editPhotoGallery"`
6. Final test run — backend pytest, frontend vitest, Playwright E2E — all green.

## Out of Scope for Phase 2

The following are explicitly deferred to a future phase and will not be implemented in Parts 2–9:

- Real multipart file upload (`multipart/form-data` endpoints)
- Drag-and-drop file drop zone in the form
- Client-side or server-side image validation (MIME sniffing, dimension checks, EXIF stripping)
- 5 MB upload size enforcement
- S3 bucket integration (presigned URLs, object writes/deletes)
- Image resizing / thumbnail generation
- CDN cache invalidation on update/delete

These items go in `docs/PLAN.md` as a "Photo upload pipeline" phase tied to the AWS Cognito/RDS/S3 cutover.

## Open Questions

None — all clarifications resolved in conversation:
- Sidebar: reuse existing `photos` nav item ✓
- Upload mechanics in dev: skip real uploads, `photoUrl` text field only ✓
- File size cap: 5 MB (deferred to upload-pipeline phase) ✓
- Title cap: 200 ✓
- TIFF: dropped; helper text lists JPEG, PNG, WebP, GIF ✓
