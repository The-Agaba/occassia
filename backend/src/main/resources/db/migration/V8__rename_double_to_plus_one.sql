-- Preserve existing records while using the clearer Plus one name.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'attendance_type'::regtype AND enumlabel = 'DOUBLE')
       AND NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'attendance_type'::regtype AND enumlabel = 'PLUS_ONE') THEN
        ALTER TYPE attendance_type RENAME VALUE 'DOUBLE' TO 'PLUS_ONE';
    END IF;
END $$;
