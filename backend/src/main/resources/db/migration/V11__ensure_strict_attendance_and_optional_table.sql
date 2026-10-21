-- Migration V11: Ensure strict attendance types (SINGLE, PLUS_ONE) and optional table numbers
-- 1. Ensure table_number column allows NULL (optional for weddings & open seating)
ALTER TABLE guests ALTER COLUMN table_number DROP NOT NULL;

-- 2. Add validation constraint that table_number, if provided, must be positive or zero
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_guests_table_number_positive'
    ) THEN
        ALTER TABLE guests ADD CONSTRAINT chk_guests_table_number_positive 
        CHECK (table_number IS NULL OR table_number >= 0);
    END IF;
END $$;

-- 3. Confirm all existing guests have either SINGLE or PLUS_ONE
UPDATE guests 
SET attendance_type = 'SINGLE' 
WHERE attendance_type IS NULL;
