CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE org_status AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'CHECKIN_STAFF', 'VIEWER');
CREATE TYPE event_type AS ENUM ('WEDDING', 'CONFERENCE', 'BIRTHDAY', 'OTHER');
CREATE TYPE event_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE attendance_type AS ENUM ('SINGLE', 'DOUBLE');
CREATE TYPE card_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'LOST', 'DAMAGED');
CREATE TYPE checkin_method AS ENUM ('NFC', 'QR', 'MANUAL');

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(200) NOT NULL,
    contact_phone VARCHAR(50),
    status org_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(200) NOT NULL,
    type event_type NOT NULL,
    venue VARCHAR(300),
    event_date DATE NOT NULL,
    status event_status NOT NULL DEFAULT 'DRAFT',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE guest_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    priority_level INT NOT NULL DEFAULT 1,
    color_hex VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    UNIQUE (event_id, name)
);

CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES guest_categories(id),
    full_name VARCHAR(200) NOT NULL,
    attendance_type attendance_type NOT NULL,
    nfc_card_uid VARCHAR(100),
    qr_token VARCHAR(255) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    table_number INT,
    meal_preference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE nfc_cards (
    uid VARCHAR(100) PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    batch_code VARCHAR(100),
    status card_status NOT NULL DEFAULT 'AVAILABLE',
    assigned_guest_id UUID REFERENCES guests(id),
    registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    assigned_at TIMESTAMP
);

CREATE TABLE gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200)
);

CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL UNIQUE REFERENCES guests(id),
    event_id UUID NOT NULL REFERENCES events(id),
    gate_id UUID REFERENCES gates(id),
    checked_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
    method checkin_method NOT NULL,
    ticket_printed BOOLEAN NOT NULL DEFAULT FALSE,
    ticket_printed_at TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    detail JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE token_blocklist (
    jti VARCHAR(100) PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_guests_event ON guests(event_id);
CREATE INDEX idx_guests_qr ON guests(qr_token);
CREATE INDEX idx_cards_org ON nfc_cards(organization_id);
CREATE INDEX idx_checkins_event ON check_ins(event_id);
CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
