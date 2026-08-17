-- Default organization and super admin (password: admin123)
INSERT INTO organizations (id, name, contact_email, contact_phone, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Occassia Platform', 'admin@occassia.com', '+10000000000', 'ACTIVE');

INSERT INTO users (id, organization_id, full_name, email, password_hash, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Super Admin',
    'admin@occassia.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'SUPER_ADMIN',
    TRUE
);

-- Demo wedding company
INSERT INTO organizations (id, name, contact_email, contact_phone, status)
VALUES ('00000000-0000-0000-0000-000000000010', 'Elegant Events Co.', 'contact@elegantevents.com', '+254700000001', 'ACTIVE');

INSERT INTO users (id, organization_id, full_name, email, password_hash, role, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', 'Jane Admin', 'jane@elegantevents.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', TRUE),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', 'Mike Manager', 'mike@elegantevents.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'EVENT_MANAGER', TRUE),
    ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000010', 'Sam Staff', 'sam@elegantevents.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CHECKIN_STAFF', TRUE),
    ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000010', 'Vera Viewer', 'vera@elegantevents.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'VIEWER', TRUE);

INSERT INTO events (id, organization_id, name, type, venue, event_date, status, created_by)
VALUES ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000010', 'Kiprotich Wedding', 'WEDDING', 'Serena Hotel Nairobi', '2026-08-14', 'DRAFT', '00000000-0000-0000-0000-000000000011');

INSERT INTO guest_categories (id, event_id, name, priority_level, color_hex) VALUES
    ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000100', 'VIP', 1, '#FFD700'),
    ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000100', 'Family', 2, '#3B82F6'),
    ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000100', 'Regular', 3, '#6B7280');

INSERT INTO gates (id, event_id, name, location) VALUES
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000100', 'Main Entrance', 'Front lobby'),
    ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000100', 'VIP Gate', 'East wing');
