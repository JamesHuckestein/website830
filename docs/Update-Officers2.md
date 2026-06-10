# Phase-2 Update Officers — Detailed Implementation Plan

## Summary of Decisions

- **Auth**: Extend JWT to include `officerPosition`; backend enforces that only Grand Knight, Deputy Grand Knight, Recorder, and Financial Secretary can call write endpoints.
- **Photo format**: PNG only for officer photos (per original spec).
- **Data source**: Officers are served from the backend API. The static `officers[]` array in `siteData.ts` becomes seed data only; the public Officers grid and Members-Only Officers view both fetch from a new `GET /officers` endpoint.

---

## Architecture Overview

### Privileged Roles (constant)

```
PRIVILEGED_OFFICER_TITLES = {"Grand Knight", "Deputy Grand Knight", "Recorder", "Financial Secretary"}
```

Only members whose `officer_position` matches one of these four titles may access the Update Officers view and call the officer-update write endpoints.

### New Backend Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/officers` | Public | Returns the current officer roster (name, title, photoUrl) for the public grid |
| PUT | `/officers/{title}` | Privileged officer | Update the member assigned to a position and/or their photo |

### JWT Changes

The `/auth/login` response token payload changes from:
```json
{ "sub": "8301001", "isOfficer": true }
```
to:
```json
{ "sub": "8301001", "isOfficer": true, "officerPosition": "Deputy Grand Knight" }
```

`officerPosition` is `null` for non-officers. The frontend uses this to decide whether to show the "Update Officers" button. The backend uses it to enforce privileged access on write routes.

### New Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `OfficersUpdate` | `components/OfficersUpdate.tsx` | Officer-only members sub-section; shows officer cards with Edit buttons |
| `OfficerEditModal` | `components/OfficerEditModal.tsx` | Popup form: member name selector + PNG file upload; Save / Cancel |

### Data Flow

```
Public visitor clicks "Officers" in sidebar
  -> MainPanel fetches GET /officers (public, no auth)
  -> Renders officer cards (same grid layout as today)

Privileged officer clicks "Update Officers" in Members Area
  -> OfficersUpdate fetches GET /officers (with token, to get current state)
  -> Renders same officer cards with an "Edit" button at the bottom of each
  -> Officer clicks Edit on a card
  -> OfficerEditModal opens
     -> Fetches GET /members (with token) to populate the name selector
     -> Officer selects a name from the searchable dropdown
     -> Officer uploads a PNG file from their device
     -> Officer clicks Save
        -> Frontend validates: name selected + valid PNG file
        -> Calls PUT /officers/{title} with { memberNumber, photoFile (base64 or multipart) }
        -> Backend updates the member_number associated with that officer_position
        -> Backend stores the uploaded photo (in-memory dev; S3 in production)
        -> Returns { success, message }
        -> SubmitModal shows success/error
        -> On success, OfficersUpdate re-fetches to show updated cards
```

---

## Part 2: Backend Scaffolding

### 2.1 Extend JWT Payload

In `backend/app/main.py`, modify the `/auth/login` route to include `officerPosition` in the JWT:

```python
token = jwt.encode(
    {
        "sub": member["member_number"],
        "isOfficer": _is_officer(member.get("officer_position")),
        "officerPosition": member.get("officer_position"),
    },
    _JWT_SECRET,
    algorithm=_JWT_ALGORITHM,
)
```

### 2.2 New Auth Helper: `_require_privileged_officer`

```python
PRIVILEGED_OFFICER_TITLES = {"Grand Knight", "Deputy Grand Knight", "Recorder", "Financial Secretary"}

def _require_privileged_officer(payload: dict = Depends(_require_auth)) -> dict:
    if payload.get("officerPosition") not in PRIVILEGED_OFFICER_TITLES:
        raise HTTPException(status_code=403, detail="Only Grand Knight, Deputy Grand Knight, Recorder, or Financial Secretary may update officers.")
    return payload
```

### 2.3 In-Memory Officers Store

Add `officers_store` to `seed.py`. Seed it from `members_store` at startup — build one entry per `OFFICER_TITLES` position by scanning members for matching `officer_position`. Each entry:

```python
{
    "title": "Grand Knight",
    "member_number": "8301002",
    "name": "John Akers",
    "photo_url": "/officers/john-h-akers.png"
}
```

For positions not filled by any member in the seed data, store a placeholder entry with `member_number: null`.

### 2.4 GET /officers (Public)

Returns the full officer roster sorted by `OFFICER_TITLES` order:

```json
[
  { "title": "Grand Knight", "name": "SK John H Akers", "photoUrl": "/officers/john-h-akers.png" },
  ...
]
```

No auth required. This replaces the static `officers[]` array on the frontend.

### 2.5 PUT /officers/{title} (Privileged)

Request body:
```json
{
  "memberNumber": "8301004",
  "photoData": "<base64-encoded PNG>",
  "photoFilename": "new-officer.png"
}
```

Behavior:
1. Validate `title` is in `OFFICER_TITLES` (404 if not).
2. Validate `memberNumber` exists in `members_store` (404 if not).
3. Validate `photoData` is a valid PNG (check magic bytes `\x89PNG`); reject with 422 if not.
4. Remove the old `officer_position` from the previous holder (set to `null`).
5. Set `officer_position = title` on the new member.
6. Store the photo (in-memory dev: save base64 to the officers_store entry as `photo_url` or a generated path; production: upload to S3 `officer-photos/{title-slug}.png`).
7. Update `officers_store` entry for that title.
8. Return `{ "success": true, "message": "Officer updated." }`.

### 2.6 Pytest Unit Tests

- `test_get_officers_public` — no auth needed, returns 14 entries.
- `test_put_officer_privileged_success` — Grand Knight can update a position.
- `test_put_officer_non_privileged_rejected` — Chancellor (officer but not privileged) gets 403.
- `test_put_officer_non_officer_rejected` — Regular member gets 403.
- `test_put_officer_invalid_title` — Unknown title returns 404.
- `test_put_officer_invalid_member` — Non-existent member_number returns 404.
- `test_put_officer_invalid_png` — Non-PNG data returns 422.
- `test_jwt_includes_officer_position` — Login response token includes `officerPosition`.

---

## Part 3: Frontend — Update Officers View

### 3.1 Add `MemberSubSection` Value

Add `"updateOfficers"` to the `MemberSubSection` type in `data/siteData.ts`.

### 3.2 Add "Update Officers" Button to MembersArea

In `MembersArea.tsx`, add a new link category for privileged officers only. The component will need to receive `officerPosition` (or a boolean `isPrivilegedOfficer`) as a prop to conditionally show this button.

New prop approach: pass `officerPosition: string | null` down from AppShell. MembersArea shows the "Update Officers" button only when `officerPosition` is in the privileged set.

### 3.3 New API Functions in `lib/api.ts`

```typescript
export type OfficerResponse = {
  title: string;
  name: string;
  photoUrl: string;
};

export async function getOfficers(): Promise<OfficerResponse[]> {
  const res = await fetch(`${API_BASE}/officers`);
  if (!res.ok) throw new Error(`API ${res.status}: /officers`);
  return res.json() as Promise<OfficerResponse[]>;
}

export async function updateOfficer(
  token: string,
  title: string,
  body: { memberNumber: string; photoData: string; photoFilename: string },
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/officers/${encodeURIComponent(title)}`, token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
```

### 3.4 Replace Static Officers Grid

In `MainPanel.tsx`, the `activeSection === "officers"` branch currently renders from the static `officers` array. Change it to render a new `<OfficersGrid />` component (or inline) that calls `getOfficers()` on mount and displays the same card layout.

### 3.5 `OfficersUpdate` Component

Props: `{ token: string; onBack: () => void }`

Behavior:
- Fetches `getOfficers()` on mount to display current roster.
- Renders the same 2-column card grid as the public view, but each card has an "Edit" button at the bottom.
- Clicking "Edit" opens `OfficerEditModal` for that position's title.
- After a successful save, re-fetches the roster.
- Has a "Back" button that calls `onBack`.

### 3.6 `OfficerEditModal` Component

Props: `{ title: string; token: string; onClose: () => void; onSaved: () => void }`

Form fields:
1. **Member Name** — A searchable `<select>` / combobox populated by `getMembers(token)`. Lists all members as `"LastName, FirstName"`. Officer can type to filter. Required.
2. **Upload Photo** — An `<input type="file" accept=".png,image/png">`. Required. Displays the selected filename after choosing. Validates the file is PNG (by extension and MIME type check on the client side).

Helper text on the form: "Please select a Member from the list and a valid photo to upload. Only PNG formatted photos are allowed."

Buttons:
- **Save** — Disabled until both fields are filled. On click: reads the file as base64, calls `updateOfficer(token, title, { memberNumber, photoData, photoFilename })`. Shows "Saving..." state. On success, calls `onSaved()` and closes. On error, shows error in a SubmitModal.
- **Cancel** — Calls `onClose()` without changes.

---

## Part 4: Demo Login / Access Control Tests

### 4.1 Frontend Unit Tests

- Verify "Update Officers" button is visible when `officerPosition` is "Grand Knight".
- Verify "Update Officers" button is visible when `officerPosition` is "Deputy Grand Knight".
- Verify "Update Officers" button is visible when `officerPosition` is "Recorder".
- Verify "Update Officers" button is visible when `officerPosition` is "Financial Secretary".
- Verify "Update Officers" button is NOT visible when `officerPosition` is "Chancellor" (officer but not privileged).
- Verify "Update Officers" button is NOT visible when `officerPosition` is `null` (regular member).
- Verify "Update Officers" button is NOT visible when user is not logged in.

### 4.2 Backend Unit Tests (from Part 2)

Already covered in 2.6 — non-privileged officers and regular members are rejected with 403.

---

## Part 5: Database Schema

### 5.1 Officers Table (schema.md addition)

No new table needed. Officers are identified by the `officer_position` column on the `members` table. When a position is reassigned:
- The old holder's `officer_position` is set to `null`.
- The new holder's `officer_position` is set to the title.

### 5.2 Officer Photo Storage

Officer photos are stored in S3 under:
```
koc-830-assets/
  officer-photos/
    {title-slug}.png    (e.g. grand-knight.png, financial-secretary.png)
```

The `photo_url` returned by `GET /officers` will be:
- Dev (in-memory): a path like `/officers/{slug}.png` (or a base64 data URL while no real file storage exists).
- Production: a full CloudFront URL pointing to the S3 object.

For the in-memory dev backend, uploaded photos will be stored as base64 strings in the officers_store and served back as data URLs (or the frontend can render them directly).

---

## Part 6: Backend API Routes

Covered in Part 2 above. No additional routes beyond `GET /officers` and `PUT /officers/{title}`.

---

## Part 7: Frontend + Backend Integration

### 7.1 Wire Up Real API Calls

- `OfficersUpdate` calls `getOfficers()` (real backend, not dummy data).
- `OfficerEditModal` calls `getMembers(token)` for the name list and `updateOfficer()` on save.
- Public Officers grid calls `getOfficers()` instead of using the static array.
- Members-Only Officers view (`OfficerContacts`) also calls `getOfficers()` to stay in sync.

### 7.2 Unit Tests

- Mock API calls in `OfficersUpdate.test.tsx` and `OfficerEditModal.test.tsx`.
- Verify loading states, error states, and successful update flow.

### 7.3 E2E Tests

- Log in as privileged officer (8301001 / faith830 — Deputy Grand Knight).
- Navigate to Update Officers.
- Click Edit on a position.
- Select a member, upload a PNG.
- Save and verify the roster updates.
- Log in as non-privileged officer or regular member and verify the button is hidden.

---

## Part 8: Full Form Submission with Response UI

- `PUT /officers/{title}` returns `{ success: boolean, message: string }`.
- Frontend shows a `SubmitModal` after each save: success message or error message.
- Modal has a dismiss button.
- Form resets on success (modal closes, OfficersUpdate refreshes).

---

## Files to Create / Modify

### New Files
- `frontend/components/OfficersUpdate.tsx`
- `frontend/components/OfficerEditModal.tsx`
- `frontend/components/OfficersUpdate.test.tsx`
- `frontend/components/OfficerEditModal.test.tsx`
- `backend/tests/test_officers.py`

### Modified Files
- `backend/app/main.py` — new routes, new auth helper, JWT extension
- `backend/app/seed.py` — add `officers_store`
- `docs/schema.json` — add officer photos seed data (if needed)
- `frontend/data/siteData.ts` — add `"updateOfficers"` to `MemberSubSection`
- `frontend/lib/api.ts` — add `getOfficers()`, `updateOfficer()`
- `frontend/components/AppShell.tsx` — decode `officerPosition` from JWT, pass down
- `frontend/components/MainPanel.tsx` — add `OfficersUpdate` routing, replace static officers grid with API call
- `frontend/components/MembersArea.tsx` — add "Update Officers" button for privileged officers
- `frontend/CLAUDE.md` — document new components
- `docs/schema.md` — document officer photo S3 path
- `CLAUDE.md` — add Update Officers section to architecture notes

---

## Implementation Order

1. Part 2 — Backend scaffolding (JWT, store, routes, tests)
2. Part 3 — Frontend UI (components, wiring)
3. Part 4 — Access control tests
4. Part 5 — Schema docs update
5. Part 6 — (covered in Part 2)
6. Part 7 — Integration (replace dummy data, E2E tests)
7. Part 8 — SubmitModal response UI
