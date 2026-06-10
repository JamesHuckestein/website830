# Phase-2 Update Members — Detailed Plan

## Summary

Extend the existing Member List view with a search/filter input, 25-row scrollable container, and Add/Edit/Delete buttons for privileged officers (Grand Knight, Deputy Grand Knight, Recorder, Financial Secretary). All members see the same view via the existing "Member List" button in the Members Area; privileged officers see additional buttons at the bottom.

---

## Clarifications (from Part 1 planning)

- **Single view**: No new MemberSubSection. The existing `memberList` sub-section gains the search box, scroll cap, and (for privileged officers) Add/Edit/Delete buttons.
- **Scrollbar**: Standard browser scrollbar (right side), not custom left-side.
- **Password**: Plain text passcode storage, matching the existing demo login system. No hashing — deferred to AWS Cognito migration.
- **officer_position field**: Not editable via this form. Defaults to `null` on Add; unchanged on Edit.

---

## Part 2: Backend Scaffolding

### New Request Models

```python
class CreateMemberRequest(BaseModel):
    memberNumber: str = Field(pattern=r"^830\d{4}$")
    passcode: str = Field(min_length=1)
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)
    addressStreet: str = Field(min_length=1)
    addressCity: str = Field(min_length=1)
    addressState: str = Field(min_length=1, max_length=2)
    addressZip: str = Field(min_length=5, max_length=10)
    phone: str = ""
    birthday: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    email: str = ""
    assemblyNumber: str | None = None
    firstDegreeDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    secondDegreeDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    thirdDegreeDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    fourthDegreeDate: str | None = None

class UpdateMemberFullRequest(BaseModel):
    memberNumber: str = Field(pattern=r"^830\d{4}$")
    passcode: str | None = None  # blank = no change
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)
    addressStreet: str = Field(min_length=1)
    addressCity: str = Field(min_length=1)
    addressState: str = Field(min_length=1, max_length=2)
    addressZip: str = Field(min_length=5, max_length=10)
    phone: str = ""
    birthday: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    email: str = ""
    assemblyNumber: str | None = None
    firstDegreeDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    secondDegreeDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    thirdDegreeDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    fourthDegreeDate: str | None = None
```

### New Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/members` | `_require_privileged_officer` | Add new member |
| PUT | `/members/{member_id}/full` | `_require_privileged_officer` | Edit all fields for a member |
| DELETE | `/members/{member_id}` | `_require_privileged_officer` | Remove a member |

All three return `{ success: boolean, message: string }`.

The existing `PUT /members/{member_id}` (contact-only self-update) remains unchanged.

### Route Logic

- **POST /members**: Validate `memberNumber` not already in use (409 Conflict if duplicate). Store passcode as-is. Set `officer_position` to `null`. Append to `members_store`.
- **PUT /members/{member_id}/full**: Find member by `member_id` path param. Update all fields from body. If `passcode` is null/empty, leave existing passcode unchanged. Do not modify `officer_position`.
- **DELETE /members/{member_id}**: Remove from `members_store`. If the member held an officer position, clear that slot in `officers_store` (set member fields to null). Return 404 if not found.

### Thread Safety

Add `_members_lock = threading.Lock()` to guard POST, PUT/full, and DELETE against concurrent mutation (same pattern as `_events_lock`).

### Pytest Unit Tests

- Test POST with valid data returns 201 and member appears in GET /members
- Test POST with duplicate memberNumber returns 409
- Test POST missing required fields returns 422
- Test PUT /members/{id}/full updates all fields
- Test PUT /members/{id}/full with blank passcode leaves passcode unchanged
- Test PUT /members/{id}/full with new passcode updates the stored passcode
- Test DELETE removes member from store
- Test DELETE of non-existent member returns 404
- Test all three routes return 403 for non-privileged officers
- Test all three routes return 403 for regular members
- Test all three routes return 401 for unauthenticated requests

---

## Part 3: General View UI (Frontend)

### Changes to MemberList.tsx

The existing `MemberList` component gains:

1. **New props**: Add `officerPosition: string | null` prop (passed from AppShell) to determine if user is privileged.

2. **Search input** (top of component, above the table):
   - Text input with placeholder "Search by name..."
   - Filters the member list client-side by matching typed text against `firstName + " " + lastName` (case-insensitive substring match)
   - Visible to all logged-in members

3. **Scrollable container** (wrapping the table body):
   - CSS: `max-h-[calc(25*2.5rem)]` with `overflow-y-auto` on the table container
   - Standard right-side scrollbar
   - Shows max ~25 rows visible at once; user scrolls to see more

4. **Row selection** (privileged officers only):
   - Clicking a row highlights it (gold border or background, like PhotoGalleryUpdate)
   - `selectedMember` state tracks which member is currently selected

5. **Add / Edit / Delete buttons** (bottom, below Email/Download, privileged officers only):
   - Visibility: only when `officerPosition` is in `PRIVILEGED_OFFICER_TITLES`
   - Add button: opens MemberFormModal with blank fields
   - Edit button: disabled until a member is selected; opens MemberFormModal pre-filled with selected member data
   - Delete button: disabled until a member is selected; opens ConfirmDialog

6. **Stale selection cleanup**: If the members list re-fetches and the selected member no longer exists, clear selection (same pattern as PhotoGalleryUpdate).

### New Component: MemberFormModal

Props:
```typescript
type MemberFormModalProps = {
  mode: "add" | "edit";
  member: MemberResponse | null;  // null for add, populated for edit
  submitting: boolean;
  onSave: (data: MemberFormData) => void;
  onCancel: () => void;
};
```

Fields rendered (matching the spec table):
| Field | Label | Type | Required | Notes |
|-------|-------|------|----------|-------|
| memberNumber | Member Number | text, pattern 830XXXX | Yes | Disabled on Edit |
| passcode | Password | text | Add: Yes, Edit: No | Blank on Edit = no change |
| firstName | First Name | text | Yes | |
| lastName | Last Name | text | Yes | |
| addressStreet | Street Address | text | Yes | |
| addressCity | City | text | Yes | |
| addressState | State | text, 2 chars | Yes | |
| addressZip | Zip Code | text | Yes | |
| phone | Phone | text | No | |
| birthday | Birthday | date | Yes | |
| email | Email | text | No | |
| assemblyNumber | Assembly Number | text | No | |
| firstDegreeDate | 1st Degree Date | date | Yes | |
| secondDegreeDate | 2nd Degree Date | date | Yes | |
| thirdDegreeDate | 3rd Degree Date | date | Yes | |
| fourthDegreeDate | 4th Degree Date | date | No | |

Behavior:
- Save button disabled until all required fields are filled
- Save and Cancel buttons at bottom
- `submitting` prop disables both buttons and shows "Saving..." (same pattern as other modals)
- Pop-up modal overlay (same styling as OfficerEditModal, AnnouncementFormModal)

### New Component: ConfirmDialog (reuse existing)

The existing `ConfirmDialog` component is reused for delete confirmation with message like "Are you sure you want to delete [First Last] from the member list?"

### API Client Additions (lib/api.ts)

```typescript
export type MemberFormData = {
  memberNumber: string;
  passcode: string;
  firstName: string;
  lastName: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  phone: string;
  birthday: string;
  email: string;
  assemblyNumber: string | null;
  firstDegreeDate: string;
  secondDegreeDate: string;
  thirdDegreeDate: string;
  fourthDegreeDate: string | null;
};

export function createMember(token: string, data: MemberFormData): Promise<{success: boolean; message: string}>
export function updateMemberFull(token: string, memberId: string, data: MemberFormData): Promise<{success: boolean; message: string}>
export function deleteMember(token: string, memberId: string): Promise<{success: boolean; message: string}>
```

---

## Part 4: Demo Login Authorization Tests

### Unit Tests (Vitest)

- Verify that `MemberList` renders Add/Edit/Delete buttons when `officerPosition` is "Grand Knight"
- Verify that `MemberList` renders Add/Edit/Delete buttons when `officerPosition` is "Deputy Grand Knight"
- Verify that `MemberList` renders Add/Edit/Delete buttons when `officerPosition` is "Recorder"
- Verify that `MemberList` renders Add/Edit/Delete buttons when `officerPosition` is "Financial Secretary"
- Verify that `MemberList` does NOT render Add/Edit/Delete buttons when `officerPosition` is "Chancellor" (non-privileged officer)
- Verify that `MemberList` does NOT render Add/Edit/Delete buttons when `officerPosition` is null (regular member)
- Verify that `MemberList` does NOT render Add/Edit/Delete buttons when `isOfficer` is false

### E2E Tests (Playwright)

- Login as privileged officer, navigate to Member List, verify Add/Edit/Delete visible
- Login as non-privileged officer, navigate to Member List, verify Add/Edit/Delete absent
- Login as regular member, navigate to Member List, verify Add/Edit/Delete absent

---

## Part 5: Database Schema

### Passcode Handling

- The `passcode` field remains plain text in the in-memory store (matching current demo system).
- `GET /members` and `GET /members/{id}` responses already exclude `passcode` via `_member_to_response` — no change needed.
- `PUT /members/{id}/full`: if `passcode` is null or empty string, the existing value is preserved. If non-empty, the new value replaces the old one directly.
- The login route (`POST /auth/login`) continues comparing raw strings.
- Real hashing (bcrypt) is deferred to the AWS Cognito/Amplify migration.

### No Schema Changes Required

The existing member record structure in `docs/schema.json` already contains all fields referenced in the configurable fields table. No new fields are needed.

---

## Part 6: Backend API Routes (Full Implementation)

Builds on Part 2 scaffolding by adding:
- Date validation on `birthday`, `firstDegreeDate`, `secondDegreeDate`, `thirdDegreeDate`, `fourthDegreeDate` (reject invalid calendar dates like 2026-02-30)
- `memberNumber` uniqueness check on POST (409 if exists) and on PUT if the number is being changed
- Thread-safe mutations under `_members_lock`

---

## Part 7: Frontend + Backend Integration

- Replace any dummy/mock behavior with real API calls via `createMember`, `updateMemberFull`, `deleteMember`
- After successful Add/Edit/Delete, re-fetch member list to reflect changes
- Unit tests mock the API responses
- E2E tests hit the running backend (same pattern as calendar/announcements/photos E2E tests)

---

## Part 8: Full Form Submission with Response UI

- All three write endpoints return `{ success: boolean, message: string }`
- Frontend shows `SubmitModal` after each submission (success or error)
- Modal has dismiss button; form closes and list refreshes on success
- On error, modal shows the error message; form remains open for retry

---

## Files to Create or Modify

| File | Action | Description |
|------|--------|-------------|
| `backend/app/main.py` | Modify | Add CreateMemberRequest, UpdateMemberFullRequest models; POST/PUT/DELETE routes |
| `backend/tests/test_members_update.py` | Create | Pytest tests for new routes |
| `frontend/components/MemberList.tsx` | Modify | Add search, scroll, selection, Add/Edit/Delete buttons |
| `frontend/components/MemberFormModal.tsx` | Create | Add/Edit pop-up form modal |
| `frontend/lib/api.ts` | Modify | Add MemberFormData type, createMember, updateMemberFull, deleteMember functions |
| `frontend/data/siteData.ts` | No change | No new MemberSubSection needed |
| `frontend/components/MembersArea.tsx` | No change | No new navigation link needed |
| `frontend/components/AppShell.tsx` | Modify | Pass `officerPosition` prop down to MemberList |
| `frontend/components/MemberList.test.tsx` | Create | Vitest tests for privilege gating and search |
| `frontend/e2e/members-update.spec.ts` | Create | Playwright E2E tests |
