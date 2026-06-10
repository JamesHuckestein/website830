-- Announcements (news) table — production database schema.
--
-- Status: NOT EXECUTED at runtime. The active backend keeps announcements in
-- an in-memory list (announcements_store in backend/app/seed.py) seeded from
-- docs/schema.json. This DDL captures the target shape for the eventual RDS
-- migration so the contract is reviewable now.
--
-- Conventions:
--   * UUID primary keys, matching the in-memory store and Pydantic models.
--   * snake_case columns; API responses map to camelCase via
--     _announcement_to_response() in backend/app/main.py.
--   * Field lengths mirror the Pydantic Field(min_length / max_length)
--     constraints in AnnouncementCreate / AnnouncementUpdate.
--   * The "delete_date >= today" auto-purge is enforced as a server-side
--     filter on GET (see get_announcements() in backend/app/main.py). The
--     idx_announcements_delete_date index accelerates that filter at scale.
--     A scheduled hard-delete job is intentionally out of scope; records
--     stay in storage until an officer DELETEs them.
--   * The past-delete-date validator on POST/PUT is application-layer; this
--     DDL does not enforce it (a CHECK constraint cannot reference NOW()).
--   * Assumes a corresponding members table migration exists earlier in
--     the migration order; the FK below references members(member_number).

CREATE TABLE announcements (
    id            UUID          PRIMARY KEY,
    title         VARCHAR(200)  NOT NULL CHECK (length(title) > 0),
    details       VARCHAR(2000) NOT NULL CHECK (length(details) > 0),
    delete_date   DATE          NOT NULL,
    created_by    VARCHAR(20)   NOT NULL REFERENCES members(member_number),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_delete_date     ON announcements(delete_date);
CREATE INDEX idx_announcements_created_at_desc ON announcements(created_at DESC);
