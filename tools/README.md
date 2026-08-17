# Serial-to-HTTP/WebSocket bridge

Use this daemon for a custom NFC reader that exposes a serial or SDK-style text stream instead of HID keyboard output. It expects one UID per line and removes a leading `UID:` or `UID=` label.

Install the root dependencies, then configure the reader and destination:

```powershell
$env:SERIAL_PORT='COM3'
$env:SERIAL_BAUD_RATE='9600'
$env:BRIDGE_TARGET_URL='http://localhost:8080/api/v1/cards'
$env:BRIDGE_TOKEN='your-api-token'
$env:BRIDGE_MODE='http'
npm run bridge
```

Each UID is posted as `{ "uid": "..." }` to `BRIDGE_TARGET_URL` with `Authorization: Bearer <BRIDGE_TOKEN>`. For card registration, use `http://localhost:8080/api/v1/cards` or the deployed equivalent. The endpoint requires an Admin or Event Manager JWT.

Modes:

- `http` (default): POST each UID to the backend.
- `ws`: broadcast only to `ws://127.0.0.1:8765`.
- `both`: POST and broadcast.

Optional settings are `SERIAL_LINE_DELIMITER` (default `\n`), `BRIDGE_WS_PORT` (default `8765`), and `SERIAL_BAUD_RATE` (default `9600`). The bridge is currently for card registration. Check-in uses `POST /api/v1/checkin/nfc` with `{ "nfcUid": "...", "gateId": "..." }` and needs a dedicated adapter or the existing HID/Web NFC check-in flow.
