-- Fix seed passwords to match documented demo password: admin123
UPDATE users
SET password_hash = '$2a$10$ROMhuyuST.GFk3PTAASrNe2fs79w8lzvHCx8LF8KDUUBh8PdfaWhm'
WHERE email IN (
    'admin@occassia.com',
    'jane@elegantevents.com',
    'mike@elegantevents.com',
    'sam@elegantevents.com',
    'vera@elegantevents.com'
);
