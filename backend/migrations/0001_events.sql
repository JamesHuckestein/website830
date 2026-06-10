-- Calendar events table — production database schema.
--
-- Status: NOT EXECUTED at runtime. The active backend keeps events in an
-- in-memory list (events_store in backend/app/seed.py) seeded from
-- docs/schema.json. This DDL captures the target shape for the eventual
-- RDS migration so the contract is reviewable now.
--
-- Conventions:
--   * UUID primary keys, matching the in-memory store and Pydantic models.
--   * snake_case columns; API responses map to camelCase via
--     _event_to_response() in backend/app/main.py.
--   * Field lengths mirror the Pydantic Field(min_length / max_length)
--     constraints in EventCreate / EventUpdate.
--   * The "max 3 events per day" invariant is enforced in the application
--     layer today (see create_event() / update_event() in backend/app/main.py).
--     When migrating to RDS, keep the check there (recommended) or replace
--     it with a BEFORE INSERT/UPDATE trigger that counts rows for NEW.day.
--   * Assumes a corresponding members table migration exists earlier in
--     the migration order; the FK below references members(member_number).

CREATE TABLE events (
    id            UUID          PRIMARY KEY,
    day           DATE          NOT NULL,
    title         VARCHAR(200)  NOT NULL CHECK (length(title) > 0),
    description   VARCHAR(2000) NOT NULL CHECK (length(description) > 0),
    time_of_day   TIME,
    location      VARCHAR(200),
    created_by    VARCHAR(20)   NOT NULL REFERENCES members(member_number),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_day        ON events(day);
CREATE INDEX idx_events_created_by ON events(created_by);
