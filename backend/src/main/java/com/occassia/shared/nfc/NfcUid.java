package com.occassia.shared.nfc;

import com.occassia.shared.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.util.Locale;

/** Converts phone and reader output to the one UID format stored by the API. */
public final class NfcUid {
    private NfcUid() {}

    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) throw invalid();
        String value = raw.trim()
                .replaceFirst("(?i)^uid\\s*[:=]\\s*", "")
                .replaceAll("[\\s:-]", "")
                .toUpperCase(Locale.ROOT);
        if ((value.length() != 8 && value.length() != 10 && value.length() != 14 && value.length() != 20)
                || !value.matches("[0-9A-F]+")) throw invalid();
        StringBuilder canonical = new StringBuilder(value.length() + value.length() / 2 - 1);
        for (int i = 0; i < value.length(); i += 2) {
            if (i > 0) canonical.append(':');
            canonical.append(value, i, i + 2);
        }
        return canonical.toString();
    }

    private static ApiException invalid() {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_NFC_UID",
                "NFC UID must be a 4, 5, 7, or 10-byte hexadecimal card UID");
    }
}
