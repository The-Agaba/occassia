# NFC Scanner and Card Configuration

## In-app operator experience

The deployed frontend starts at the public Occassia landing page. Operators select **Sign in** to enter the protected workspace. The application is a Progressive Web App: serve it over HTTPS, open it in a supported browser, and use the browser's install command when available. The service worker caches the application shell only; API data remains network-backed so event state is not silently stale.

The app supports three intentional entry paths:

1. Device Web NFC: tap the card against the back of the phone while the browser's NFC scan is active.
2. External NFC reader: use a USB or Bluetooth reader in keyboard/HID mode, or the documented serial bridge.
3. QR backup: scan the guest's unique QR token when NFC is unavailable.

There is no manual/type-in gate check-in workflow. The external-reader field exists to receive a reader's UID, not to replace the card or QR control.

About and terms content is editable in `frontend/src/content/about.md` and `frontend/src/content/terms.md`; rebuild and redeploy the frontend after changing those files.

This guide explains how to connect custom NFC readers and NFC cards to Occassia. Occassia identifies a card by its NFC UID. The system does not use batch codes or other card metadata.

## How the integration works

There are three supported reader paths:

1. **HID/keyboard reader** - the reader types the UID into the focused Occassia field. This is the simplest option.
2. **Browser Web NFC** - supported browsers read the tag directly from the browser when the device and browser support Web NFC.
3. **Serial/SDK reader** - `tools/serial-bridge.js` reads newline-terminated UID values from a serial reader and forwards them to the backend over HTTP. It can also broadcast the UID over a local WebSocket.

All paths must produce the same logical value: one card UID per scan.

## Card and reader requirements

Before connecting hardware, confirm the following with the reader manufacturer:

- The reader can read the card technology you use, such as ISO/IEC 14443A, MIFARE, NTAG, or another supported NFC technology.
- The reader exposes the card's hardware UID, not a block of card memory, NDEF text, card number, or a vendor-specific alias.
- The reader can return the UID as text in a stable format.
- The reader does not rewrite, randomize, or rotate the UID. Some phones and secure cards may use privacy/randomized identifiers and are not suitable for permanent card registration.
- Each physical card has a unique UID. A card is registered for one event at a time; it can move to another event only when the event windows do not overlap. Overlapping reuse returns a specific conflict.
- The reader's communication settings are known: USB mode, serial port name, baud rate, data bits, parity, stop bits, and line terminator.

Recommended UID output is uppercase hexadecimal with optional colon separators, for example:

```text
04:A3:FF:12:BC
```

The UID must be no longer than 100 characters. Do not include timestamps, reader names, card type labels, spaces at the beginning or end, or multiple UIDs in one line.

## Choose and configure the reader mode

### HID/keyboard mode

Use this mode when the reader behaves like a USB or Bluetooth keyboard.

1. Configure the reader to output the UID only.
2. Configure a suffix of `Enter` if the reader supports it.
3. Disable prefixes, timestamps, prompts, and vendor text.
4. Configure the character set as plain ASCII/UTF-8 hexadecimal text.
5. Open Occassia and sign in as an Admin or Event Manager.
6. Navigate to the event's **Cards** page and choose **External scanner** under **Register Card**.
7. Click or switch to the scanner field, present a card, and verify that the UID appears.
8. Press Enter or click **Register**.

For card assignment, choose **Scan card**, select the eligible guest, scan the registered card, and confirm the assignment.

### Browser Web NFC

Use this only on a browser and device that support Web NFC.

1. Serve the application over HTTPS in production. Web NFC is generally restricted to secure contexts.
2. Grant NFC permission when the browser asks.
3. Open the Occassia check-in or card-scanning screen.
4. Start the NFC scanner and hold the card near the device's NFC antenna.
5. Confirm that the displayed UID matches the physical card label or the reader's diagnostic output.

If Web NFC is unavailable, use a HID reader or the serial bridge instead.

## UID format and normalization

Keep one canonical representation for the same card. Occassia stores and compares the UID as a string, so these may be treated as different values if a reader changes formatting:

```text
04:A3:FF:12:BC
04A3FF12BC
```

Configure every reader to use one format. Prefer uppercase hexadecimal with colon separators. Do not remove separators in one workflow while keeping them in another.

If a reader adds a label such as `UID:`, configure the reader to remove it. The serial bridge removes a leading `UID:` or `UID=` label, but it does not safely infer arbitrary vendor formats.

## Register a card in Occassia

Card registration is single-UID only and event-specific:

1. Sign in with an Admin or Event Manager account.
2. Open the event and select **Cards**.
3. Choose **Manual entry** to type one UID, or **External scanner** for a HID reader.
4. Enter or scan one UID.
5. Select **Register**.
6. Confirm that the card appears with status `AVAILABLE` in that event's inventory.

There is no batch-code field. Card batch import remains available to administrators at `POST /api/v1/cards/batch?eventId=<event-uuid>`; the first column must be `uid`, and other columns are ignored.

Example CSV:

```csv
uid
04:A3:FF:12:BC
04:B4:11:22:33
```

## Serial/SDK reader bridge

Use the bridge when the reader cannot operate as a keyboard. The bridge expects one UID per line and sends each UID as an HTTP JSON request:

```json
{ "uid": "04:A3:FF:12:BC" }
```

The current HTTP target is the card-registration endpoint, so the bridge is intended for registering cards:

```text
POST /api/v1/cards
```

The endpoint requires an authenticated Admin or Event Manager JWT.

### Install

From the project root:

```powershell
npm install
```

### Start on Windows

Replace `COM3`, the URL, and the token with your values:

```powershell
$env:SERIAL_PORT='COM3'
$env:SERIAL_BAUD_RATE='9600'
$env:BRIDGE_TARGET_URL='https://your-host/api/v1/cards'
$env:BRIDGE_TOKEN='your-jwt-token'
$env:BRIDGE_MODE='http'
npm run bridge
```

### Start on Linux/macOS

```bash
export SERIAL_PORT=/dev/ttyUSB0
export SERIAL_BAUD_RATE=9600
export BRIDGE_TARGET_URL=https://your-host/api/v1/cards
export BRIDGE_TOKEN=your-jwt-token
export BRIDGE_MODE=http
npm run bridge
```

The bridge also supports:

- `BRIDGE_MODE=http` - POST each UID to the backend. This is the default.
- `BRIDGE_MODE=ws` - do not POST; broadcast each UID to local WebSocket clients.
- `BRIDGE_MODE=both` - POST and broadcast each UID.
- `BRIDGE_WS_PORT` - WebSocket port, default `8765`.
- `SERIAL_LINE_DELIMITER` - line delimiter, default newline (`\n`). Use this when the reader emits a different terminator.

The WebSocket address is local to the machine running the bridge:

```text
ws://127.0.0.1:8765
```

The WebSocket message is:

```json
{ "type": "uid", "uid": "04:A3:FF:12:BC" }
```

The current Occassia frontend uses HID/Web NFC directly. A WebSocket consumer must be connected to the frontend workflow before WebSocket-only mode can drive a screen automatically. For immediate integration with the current system, use `BRIDGE_MODE=http` for registration or use HID mode for browser-based scanning.

### Serial reader setup checklist

1. Install the manufacturer's USB/serial driver if required.
2. Identify the port (`COM3`, `/dev/ttyUSB0`, or `/dev/ttyACM0`).
3. Set the bridge baud rate and serial framing to match the reader.
4. Configure the reader to emit one UID followed by the configured line terminator.
5. Start the bridge and confirm the `Serial bridge connected` message.
6. Scan an unregistered card and confirm the bridge logs `Forwarded UID`.
7. Confirm the card appears in Occassia as `AVAILABLE`.
8. Stop and restart the bridge, then scan again to verify that the reader reconnects consistently.

## API examples

### Register one card

```bash
curl -X POST https://your-host/api/v1/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uid":"04:A3:FF:12:BC"}'
```

### Check in using a registered card

Registration and check-in are separate operations. A card must first be registered and assigned to a confirmed, paid guest. Check-in uses:

```bash
curl -X POST https://your-host/api/v1/checkin/nfc \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nfcUid":"04:A3:FF:12:BC","gateId":"OPTIONAL-GATE-UUID"}'
```

The current serial bridge posts `{ "uid": ... }` to card registration. It does not call the check-in endpoint, because check-in also needs the `nfcUid` field and, optionally, a gate ID. Use the existing HID/Web NFC check-in flow, or add a dedicated authenticated adapter for serial check-in that sends the check-in payload.

## Security and operations

- Use HTTPS for the backend in production.
- Treat `BRIDGE_TOKEN` as a secret. Do not commit it, put it in source control, or print it in logs.
- Use a dedicated account/token with only the permissions required by the bridge.
- Keep the bridge on the same trusted machine or network as the reader. Use the documented `127.0.0.1` WebSocket address for local consumers and do not expose the bridge port through a public firewall.
- Do not expose the serial bridge or backend registration endpoint to the public internet without authentication and network controls.
- Run one bridge process per serial port. Two processes cannot reliably share the same reader.
- Avoid repeatedly scanning the same card during registration; the backend correctly returns a conflict for an existing UID.
- For unattended use, run `npm run bridge` under an approved service manager and configure automatic restart after failure.

## Verification checklist

### Reader output

- [ ] The reader sees the intended card technology.
- [ ] The reader returns the hardware UID.
- [ ] One scan produces exactly one UID.
- [ ] The UID contains no unwanted prefix, suffix, or line noise.
- [ ] The line terminator is configured correctly.
- [ ] The same card produces the same UID every time.

### Occassia registration

- [ ] The user has Admin or Event Manager permissions.
- [ ] A HID scan enters one UID into the **External scanner** field.
- [ ] Manual registration accepts one UID only.
- [ ] The card is visible with status `AVAILABLE` after registration.
- [ ] Re-registering the same UID for the same event returns a duplicate-card error.
- [ ] Registering the UID for an overlapping event returns `CARD_EVENT_OVERLAP`.

### Assignment and check-in

- [ ] The guest is confirmed and paid.
- [ ] The card is assigned to that guest.
- [ ] The card status changes to `ASSIGNED`.
- [ ] A check-in scan uses the exact stored UID.
- [ ] A successful NFC check-in changes the card status to `CHECKED_IN`.
- [ ] A repeat NFC scan returns `CARD_ALREADY_CHECKED_IN`.
- [ ] The check-in result and event statistics update correctly.

### Lost, deleted, and auto-printed cards

Admins can mark a card **Lost** from the event card inventory. This detaches it from the guest and deactivates it; the gate returns `CARD_LOST`. Admins can also permanently delete the card record. Deletion is irreversible.

On the gate check-in screen, enable **Auto-print ticket** after configuring the connected printer/browser. Successful check-ins then open the compact ticket print workflow automatically. For unattended printing, use a managed browser or kiosk print policy that suppresses the system print dialog.

## Troubleshooting

**The UID does not appear in the browser**

Confirm that the reader is in HID mode, the Occassia scanner field is focused, the browser window is active, and the reader sends text rather than a proprietary SDK packet.

**The serial bridge cannot open the port**

Check the port name, close the manufacturer's diagnostic software, install the driver, and verify that no other process is using the port. On Linux, check device permissions and membership in the appropriate serial-device group.

**The bridge connects but no UID is forwarded**

Check the baud rate, parity, data bits, stop bits, and line delimiter. Use the manufacturer's terminal tool to confirm that a scan ends with the delimiter configured in `SERIAL_LINE_DELIMITER`.

**The backend returns HTTP 401 or 403**

Generate a valid JWT for an Admin or Event Manager, set `BRIDGE_TOKEN` without the word `Bearer`, and verify that the token has not expired.

**The backend returns HTTP 409**

That UID is already registered. Confirm that the reader is not emitting a fixed test UID for every card and check for inconsistent UID formatting.

**A card registers but cannot be assigned**

Confirm that the card belongs to the current organization, is `AVAILABLE`, and that the guest is confirmed and paid and does not already have another card.

**Check-in says the card is not found**

Compare the exact UID returned during check-in with the UID stored in Occassia. A separator or case change can produce a different string. Configure all readers to emit one canonical format.

## Database note

Migration `V5__drop_batch_code.sql` removes the obsolete `batch_code` column from existing installations. A fresh installation should use the current migration set.
