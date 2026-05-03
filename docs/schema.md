# KoC Council 830 — Database Schema

## Overview

AWS RDS (PostgreSQL) in us-east-1. All dates are ISO 8601 strings. All IDs are UUIDs unless noted.

---

## Table: members

Primary key: `member_number` (string, format: "830XXXX")

| Column | Type | Nullable | Notes |
|---|---|---|---|
| member_number | varchar(10) | NO | PK |
| first_name | varchar(100) | NO | |
| last_name | varchar(100) | NO | |
| address_street | varchar(200) | NO | |
| address_city | varchar(100) | NO | |
| address_state | char(2) | NO | |
| address_zip | varchar(10) | NO | |
| phone | varchar(20) | NO | |
| birthday | date | NO | |
| officer_position | varchar(50) | YES | Must match a title in OFFICER_TITLES if set |
| email | varchar(200) | NO | |
| assembly_number | varchar(20) | YES | Fourth degree assembly |
| first_degree_date | date | YES | |
| second_degree_date | date | YES | |
| third_degree_date | date | YES | |
| fourth_degree_date | date | YES | |
| passcode_hash | varchar(255) | NO | bcrypt hash; demo seeds store plaintext prefix for reference only |
| created_at | timestamptz | NO | default now() |
| updated_at | timestamptz | NO | default now() |

**Officer detection:** a member is treated as an officer if `officer_position` is non-null and matches one of the 14 titles in `OFFICER_TITLES` ("Grand Knight", "Deputy Grand Knight", "Chancellor", "Advocate", "Recorder", "Treasurer", "Warden", "Inside Guard", "Outside Guard", "Trustee - 1 Year", "Trustee - 2 Year", "Trustee - 3 Year", "Financial Secretary", "Lecturer").

---

## Table: prayer_requests

Prayer requests are stored as individual text files in S3. This table holds metadata only.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | NO | PK, default gen_random_uuid() |
| s3_key | varchar(500) | NO | e.g. `prayer-requests/2026/04/pr-uuid.txt` |
| submitted_by | varchar(10) | NO | FK → members.member_number |
| submitted_at | timestamptz | NO | default now() |

---

## Table: meeting_minutes

Meeting minutes are PDF files stored in S3. This table holds metadata only.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | NO | PK, default gen_random_uuid() |
| title | varchar(200) | NO | e.g. "Council Business Meeting - April 2026" |
| meeting_date | date | NO | |
| s3_key | varchar(500) | NO | e.g. `meeting-minutes/2026/04/april-2026.pdf` |
| created_at | timestamptz | NO | default now() |

---

## S3 Bucket Layout

```
koc-830-assets/
  prayer-requests/
    YYYY/
      MM/
        {uuid}.txt          — one file per prayer request
  meeting-minutes/
    YYYY/
      MM/
        {slug}.pdf          — council meeting minutes PDF
```

---

## Notes

- No `officer_emails` table — officer email addresses are stored directly on the `members` row via `email`.
- Authentication in production will use AWS Cognito; `passcode_hash` is the fallback for the demo/dev environment.
- The `members` table `updated_at` column is kept current via a `BEFORE UPDATE` trigger in production.
