-- Drop obsolete batch_code column from nfc_cards
ALTER TABLE nfc_cards DROP COLUMN IF EXISTS batch_code;
