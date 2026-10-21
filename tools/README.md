# Serial bridge

Install the root dependencies, then configure the reader and destination:

```powershell
$env:SERIAL_PORT='COM3'
$env:SERIAL_BAUD_RATE='9600'
$env:BRIDGE_TARGET_URL='http://localhost:8080/api/v1/cards'
$env:BRIDGE_TOKEN='your-api-token'
npm run bridge
```

Each newline-terminated UID is posted as `{ "uid": "..." }`. Set `BRIDGE_MODE=ws` to broadcast scans only to `ws://127.0.0.1:8765`, or `BRIDGE_MODE=both` to use both destinations. `BRIDGE_TARGET_URL` is required for the default HTTP mode. 
