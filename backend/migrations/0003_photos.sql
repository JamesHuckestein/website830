-- Photos (gallery) table — production database schema.
--
-- Status: NOT EXECUTED at runtime. The active backend keeps photos in an
-- in-memory list (photos_store in backend/app/seed.py) seeded from
-- docs/schema.json. This DDL captures the target shape for the eventual RDS
-- migration so the contract is reviewable now.
--
-- Conventions:
--   * UUID primary keys, matching the in-memory store and Pydantic models.
--   * snake_case columns; API responses map to camelCase via
--     _photo_to_response() in backend/app/main.py.
--   * Field lengths mirror the Pydantic Field(min_length / max_length)
--     constraints in PhotoCreate / PhotoUpdate. The 2048-char photo_url cap
--     gives plenty of headroom for fully-qualified S3 / CloudFront URLs.
--   * Production stores `photo_url` as the S3 (or CloudFront) URL written by
--     the upload pipeline added in a later phase. The Phase-2 dev frontend
--     accepts any non-empty string (path or URL) so the form can be exercised
--     without S3 infrastructure.
--   * Sort order is `created_at ASC, id ASC` (oldest first → newest at the
--     bottom of the two-column public grid). The
--     idx_photos_created_at_asc index accelerates that ordering at scale.
--   * Assumes a corresponding members table migration exists earlier in
--     the migration order; the FK below references members(member_number).

CREATE TABLE photos (
    id          UUID           PRIMARY KEY,
    title       VARCHAR(200)   NOT NULL CHECK (length(title) > 0),
    photo_url   VARCHAR(2048)  NOT NULL CHECK (length(photo_url) > 0),
    created_by  VARCHAR(20)    NOT NULL REFERENCES members(member_number),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_created_at_asc ON photos(created_at ASC);
