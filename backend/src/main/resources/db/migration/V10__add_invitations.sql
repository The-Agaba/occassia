CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL UNIQUE,
    guest_name VARCHAR(200) NOT NULL,
    phone_number VARCHAR(50),
    whatsapp_number VARCHAR(50),
    email VARCHAR(200),
    delivery_channel VARCHAR(30),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    rsvp_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    rsvp_headcount INT NOT NULL DEFAULT 0,
    rsvp_dietary VARCHAR(255),
    rsvp_message TEXT,
    rsvp_confirmed_at TIMESTAMP,
    template_id VARCHAR(100) NOT NULL DEFAULT 'royal-botanical-gold',
    image_url TEXT,
    letter_details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_event ON invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_guest ON invitations(guest_id);
