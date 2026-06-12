"""Constants extracted from the original seed data.

The in-memory stores have been replaced by DynamoDB (via app/repos/*).
Seeding is handled by scripts/seed_dynamo.py.
"""

ADMIN_MEMBER_NUMBER = "830999999"

OFFICER_TITLES_ORDERED = [
    "Grand Knight",
    "Deputy Grand Knight",
    "Chancellor",
    "Advocate",
    "Recorder",
    "Treasurer",
    "Warden",
    "Inside Guard",
    "Outside Guard",
    "Trustee - 1 Year",
    "Trustee - 2 Year",
    "Trustee - 3 Year",
    "Financial Secretary",
    "Lecturer",
]
