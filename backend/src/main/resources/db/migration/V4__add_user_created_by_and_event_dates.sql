-- Add created_by column to users referencing users(id)
ALTER TABLE users ADD COLUMN created_by UUID REFERENCES users(id);

-- Add event date/time range columns to events
ALTER TABLE events ADD COLUMN start_date DATE;
ALTER TABLE events ADD COLUMN end_date DATE;
ALTER TABLE events ADD COLUMN start_time TIME;
ALTER TABLE events ADD COLUMN end_time TIME;

-- Migrate existing event date to start_date and end_date
UPDATE events SET start_date = event_date, end_date = event_date;

-- Make start_date and end_date NOT NULL for future constraints
ALTER TABLE events ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE events ALTER COLUMN end_date SET NOT NULL;
