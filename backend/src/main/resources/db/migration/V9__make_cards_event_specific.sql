ALTER TYPE card_status ADD VALUE IF NOT EXISTS 'CHECKED_IN';
ALTER TABLE nfc_cards ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);
UPDATE nfc_cards c SET event_id = g.event_id FROM guests g WHERE c.assigned_guest_id = g.id AND c.event_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_cards_event ON nfc_cards(event_id);
