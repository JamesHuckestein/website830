# DynamoDB Migration Plan
## Overview

Replace the in-memory Python stores (`members_store`, `officers_store`, `events_store`, `announcements_store`, `photos_store`, `prayer_requests_store`, `meeting_minutes_store`) with AWS DynamoDB tables. The current data access patterns (CRUD by ID, filtered scans, simple sorts) map well to DynamoDB's key-value model at this scale (~150 members, <100 records per entity).

## Why DynamoDB over RDS

- Serverless: no instance to manage, no idle-cost
- Free tier covers this workload entirely (~25 WCU / 25 RCU)
- Pairs with existing S3 + CloudFront + Lambda architecture
- Simple key-value access patterns; no joins required
- Automatic scaling if membership grows

## Table Designs

### Members Table

| Attribute | Type | Role |
|-----------|------|------|
| member_number | S | Partition Key |
| first_name | S | |
| last_name | S | |
| address_street | S (nullable) | |
| address_city | S (nullable) | |
| address_state | S (nullable) | |
| address_zip | S (nullable) | |
| phone | S (nullable) | |
| birthday | S (nullable) | YYYY-MM-DD |
| email | S | |
| officer_position | S (nullable) | |
| assembly_number | S (nullable) | |
| first_degree_date | S (nullable) | |
| second_degree_date | S (nullable) | |
| third_degree_date | S (nullable) | |
| fourth_degree_date | S (nullable) | |
| passcode | S | |
| is_admin | BOOL | Default: false |

**GSI: officer_position-index**
- Partition Key: `officer_position` (S)
- Purpose: Look up member by officer title (used by email_officer, nominations)

**Access Patterns:**
- Login: GetItem by `member_number`
- List all: Scan (filter out admin)
- By officer position: Query GSI
- Birthdays: Scan + app-side date filtering
- CSV export: Scan (filter out admin)
- Create/Update/Delete: PutItem / UpdateItem / DeleteItem by `member_number`

---

### Officers Table

| Attribute | Type | Role |
|-----------|------|------|
| title | S | Partition Key |
| member_number | S (nullable) | |
| name | S | |
| photo_url | S | |
| photo_data | B (nullable) | Base64 PNG bytes |

**Access Patterns:**
- List all: Scan (14 items, ordered by app-side OFFICER_TITLES_ORDERED)
- Get by title: GetItem
- Update assignment: UpdateItem by `title`
- Photo lookup by slug: Scan with filter (14 items, acceptable)

---

### Events Table

| Attribute | Type | Role |
|-----------|------|------|
| id | S | Partition Key (UUID) |
| day | S | YYYY-MM-DD |
| title | S | |
| description | S | |
| time_of_day | S (nullable) | HH:MM |
| location | S (nullable) | |
| created_by | S | member_number |
| created_at | S | ISO timestamp |
| updated_at | S | ISO timestamp |

**GSI: day-index**
- Partition Key: `day` (S)
- Sort Key: `created_at` (S)
- Purpose: Query events by day (for max-3 enforcement), filter by month prefix

**Access Patterns:**
- List all / by month: Scan with filter on `day` prefix (or Query GSI with begins_with)
- Count by day: Query GSI by `day` partition (for max-3 check)
- Get by ID: GetItem
- Create: PutItem (with ConditionExpression for max-3 using a transaction)
- Update: UpdateItem by `id`
- Delete: DeleteItem by `id`

**Max-3-per-day enforcement:** Use a DynamoDB Transaction or conditional write. Query GSI to count, then conditionally PutItem. Alternatively, use an atomic counter item per day.

---

### Announcements Table

| Attribute | Type | Role |
|-----------|------|------|
| id | S | Partition Key (UUID) |
| title | S | |
| details | S | |
| delete_date | S | YYYY-MM-DD |
| created_by | S | member_number |
| created_at | S | ISO timestamp |
| updated_at | S | ISO timestamp |

**GSI: delete_date-index**
- Partition Key: `delete_date` (S)
- Sort Key: `created_at` (S)
- Purpose: Filter active announcements (delete_date >= today)

**Access Patterns:**
- List active: Scan with FilterExpression `delete_date >= today`, sort by `created_at` DESC app-side
- Get by ID: GetItem
- Create/Update/Delete: PutItem / UpdateItem / DeleteItem by `id`

Note: At low volume (<50 announcements), a Scan with filter is simpler than maintaining a GSI for date-range queries. The GSI is optional and can be added later if volume grows.

---

### Photos Table

| Attribute | Type | Role |
|-----------|------|------|
| id | S | Partition Key (UUID) |
| title | S | |
| photo_url | S | |
| created_by | S | member_number |
| created_at | S | ISO timestamp (second precision) |
| updated_at | S | ISO timestamp (second precision) |

**Access Patterns:**
- List all: Scan, sort by `created_at` ASC app-side (oldest first)
- Get by ID: GetItem
- Create/Update/Delete: PutItem / UpdateItem / DeleteItem by `id`

---

### Prayer Requests Table

| Attribute | Type | Role |
|-----------|------|------|
| id | S | Partition Key (UUID) |
| s3_key | S | |
| text | S | |
| submitted_by | S | member_number |
| submitted_at | S | ISO timestamp |

**Access Patterns:**
- List all (auth): Scan, sort by `submitted_at` DESC app-side
- List public: Scan, return subset of fields (id, text, submitted_at)
- Create: PutItem
- Delete: DeleteItem by `id` (after auth check: owner or officer)

---

### Meeting Minutes Table

| Attribute | Type | Role |
|-----------|------|------|
| id | S | Partition Key (UUID) |
| title | S | |
| meeting_date | S | YYYY-MM-DD |
| s3_key | S | |

**Access Patterns:**
- List all: Scan
- Get by ID: GetItem
- Read-only in current codebase (future: admin upload)

---

## Cross-Table Operations

### Delete Member (cascading officer cleanup)
1. DeleteItem from Members table
2. If member had `officer_position`: UpdateItem on Officers table to clear slot
3. Use DynamoDB TransactWriteItems to make this atomic

### Update Officer Assignment
1. UpdateItem on Officers table (set new member)
2. UpdateItem on Members table: clear old member's officer_position
3. UpdateItem on Members table: set new member's officer_position
4. Use DynamoDB TransactWriteItems for atomicity

---

## Concurrency Handling

The in-memory store uses threading locks. DynamoDB handles concurrency differently:

| Pattern | In-Memory | DynamoDB |
|---------|-----------|----------|
| Max-3 events per day | Lock + count + append | TransactWriteItems with ConditionExpression |
| Prevent duplicate member_number | Lock + scan + append | PutItem with `attribute_not_exists(member_number)` |
| Officer assignment swap | Lock + multi-field update | TransactWriteItems (batch 3 updates) |
| Prayer request delete by owner | Linear scan + index pop | GetItem (check owner) + DeleteItem |

---

## Implementation Steps

### Part 1: Infrastructure Setup

1. **Create DynamoDB tables via IaC (CloudFormation or Terraform)**
   - Define all 7 tables with keys and GSIs as specified above
   - Use on-demand billing mode (pay-per-request) to stay within free tier
   - Set up in us-east-1 (matching existing infrastructure decisions)

2. **Create IAM role/policy for backend**
   - Policy: DynamoDB read/write access scoped to the 7 tables
   - For local development: use AWS credentials profile or localstack

3. **Add boto3 dependency to backend**
   - Add `boto3` to `backend/requirements.txt`
   - Add `DYNAMO_TABLE_PREFIX` env var for table naming (e.g., `koc830-dev-`, `koc830-prod-`)

### Part 2: Data Access Layer

4. **Create `backend/app/dynamo.py` module**
   - DynamoDB client/resource initialization
   - Table name resolution (prefix + entity name)
   - Helper functions for common operations:
     - `get_item(table, key)` 
     - `put_item(table, item)`
     - `update_item(table, key, updates)`
     - `delete_item(table, key)`
     - `scan_table(table, filter_expression=None)`
     - `query_index(table, index_name, key_condition)`
     - `transact_write(operations)`

5. **Create entity-specific repository modules**
   - `backend/app/repos/members.py` — get_by_number, list_all, create, update_contact, update_full, delete, get_birthdays, get_officers_emails
   - `backend/app/repos/officers.py` — list_all, get_by_title, update_assignment, get_photo
   - `backend/app/repos/events.py` — list_all, list_by_month, count_by_day, create, update, delete
   - `backend/app/repos/announcements.py` — list_active, create, update, delete
   - `backend/app/repos/photos.py` — list_all, create, update, delete
   - `backend/app/repos/prayer_requests.py` — list_all, list_public, create, delete
   - `backend/app/repos/meeting_minutes.py` — list_all, get_by_id

### Part 3: Seed Data Migration

6. **Create seed script for DynamoDB**
   - `backend/scripts/seed_dynamo.py`
   - Reads `docs/schema.json` and Admin record
   - BatchWriteItem to populate all tables
   - Idempotent (checks if data exists before seeding)

7. **Update `reset_to_seed()` for test isolation**
   - For tests: use either localstack DynamoDB or a test-prefix set of tables
   - Wipe and re-seed before/after each test (or use table-per-test-run naming)

### Part 4: Route Migration (one entity at a time)

Migrate each store independently. After each, verify tests still pass.

8. **Migrate Members routes**
   - Replace `members_store` list operations with repo calls
   - Replace `_members_lock` usage with DynamoDB conditional writes
   - Update login, GET /members, GET /members/{id}, PUT /members/{id}, POST /members, PUT /members/{id}/full, DELETE /members/{id}, PUT /admin/password
   - Update birthdays, CSV export, email endpoints

9. **Migrate Officers routes**
   - Replace `officers_store` with repo calls
   - Replace `_officers_lock` with TransactWriteItems
   - Update GET /officers, PUT /officers/{title}, GET /officers/photos/{filename}
   - Update cross-table cascading (delete member clears officer slot)

10. **Migrate Events routes**
    - Replace `events_store` with repo calls
    - Replace `_events_lock` max-3 enforcement with conditional transaction
    - Update GET /events, POST /events, PUT /events/{id}, DELETE /events/{id}

11. **Migrate Announcements routes**
    - Replace `announcements_store` with repo calls
    - Replace `_announcements_lock` with DynamoDB atomic operations
    - Update GET /announcements, POST, PUT, DELETE

12. **Migrate Photos routes**
    - Replace `photos_store` with repo calls
    - Replace `_photos_lock` with DynamoDB atomic operations
    - Update GET /photos, POST, PUT, DELETE

13. **Migrate Prayer Requests routes**
    - Replace `prayer_requests_store` with repo calls
    - Update GET /prayer-requests, GET /prayer-requests/public, POST, DELETE

14. **Migrate Meeting Minutes routes**
    - Replace `meeting_minutes_store` with repo calls
    - Update GET /meeting-minutes, GET /meeting-minutes/{id}

### Part 5: Testing

15. **Set up local DynamoDB for development**
    - Option A: AWS DynamoDB Local (Java-based, Docker)
    - Option B: localstack
    - Add to `scripts/start.sh` to launch alongside backend/frontend
    - Add `DYNAMO_ENDPOINT_URL` env var for local override

16. **Update pytest tests**
    - Use local DynamoDB instance or moto (AWS mock library)
    - Maintain `reset_to_seed()` semantics (wipe + re-populate)
    - Verify all 176+ existing tests still pass against DynamoDB backend

17. **Add DynamoDB-specific integration tests**
    - Conditional write conflict handling
    - TransactWriteItems atomicity for officer assignment
    - Max-3-per-day enforcement under concurrency

### Part 6: Cleanup

18. **Remove in-memory stores**
    - Delete `backend/app/seed.py` in-memory store logic (keep `ADMIN_MEMBER_NUMBER`, `_ADMIN_RECORD`, `OFFICER_TITLES_ORDERED` as constants)
    - Remove threading locks from `main.py`
    - Remove `docs/schema.json` dependency from runtime (keep as documentation/seed source)

19. **Update documentation**
    - Update `CLAUDE.md` to reflect DynamoDB backend
    - Update `docs/PLAN.md` Part 6 to reference DynamoDB instead of RDS
    - Document environment variables: `DYNAMO_TABLE_PREFIX`, `DYNAMO_ENDPOINT_URL`, `AWS_REGION`

20. **Production deployment preparation**
    - CloudFormation/Terraform template for table creation
    - CI/CD pipeline step: run seed script on first deploy
    - IAM policy attached to Lambda/ECS task role
    - Monitoring: CloudWatch alarms on throttling, error rates

---

## Environment Variables

| Variable | Dev Value | Production Value |
|----------|-----------|------------------|
| `DYNAMO_TABLE_PREFIX` | `koc830-dev-` | `koc830-prod-` |
| `DYNAMO_ENDPOINT_URL` | `http://localhost:8000` (DynamoDB Local) | (omit — uses AWS default) |
| `AWS_REGION` | `us-east-1` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | local credentials | IAM role (no key needed) |
| `AWS_SECRET_ACCESS_KEY` | local credentials | IAM role (no key needed) |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| DynamoDB Scan cost at scale | Acceptable at <100 records per table; add GSIs if growth warrants |
| Max-3 race condition | TransactWriteItems provides atomicity without app-level locks |
| Local dev complexity | DynamoDB Local via Docker is a single `docker run` command |
| Test isolation | Table prefix per test run, or moto mock library |
| Cold start latency | DynamoDB on-demand has no cold start; boto3 client init is ~100ms |
| Data loss during migration | Seed from schema.json; production data doesn't exist yet |

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Part 1: Infrastructure | 1-2 hours |
| Part 2: Data access layer | 3-4 hours |
| Part 3: Seed migration | 1 hour |
| Part 4: Route migration (7 entities) | 4-6 hours |
| Part 5: Testing | 3-4 hours |
| Part 6: Cleanup + docs | 1-2 hours |
| **Total** | **13-19 hours** |
