package com.occassia.shared.nfc;

import com.occassia.shared.exception.ApiException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NfcUidTest {
    @Test
    void normalizesPhoneAndReaderFormatsToOneUid() {
        assertEquals("04:A3:FF:12:BC", NfcUid.normalize("UID=04-a3-ff-12-bc\r\n"));
        assertEquals("04:A3:FF:12:BC", NfcUid.normalize("04a3ff12bc"));
    }

    @Test
    void rejectsNonNfcInput() {
        assertThrows(ApiException.class, () -> NfcUid.normalize("manual guest id"));
    }
}
