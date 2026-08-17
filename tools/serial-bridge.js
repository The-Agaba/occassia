#!/usr/bin/env node

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { WebSocketServer } from 'ws';

const portPath = process.env.SERIAL_PORT;
const baudRate = Number(process.env.SERIAL_BAUD_RATE || 9600);
const mode = process.env.BRIDGE_MODE || 'http';
const targetUrl = process.env.BRIDGE_TARGET_URL;
const token = process.env.BRIDGE_TOKEN;
const websocketPort = Number(process.env.BRIDGE_WS_PORT || 8765);

if (!portPath) {
  console.error('Set SERIAL_PORT to the reader port (for example COM3 or /dev/ttyUSB0).');
  process.exit(1);
}
if (mode !== 'ws' && !targetUrl) {
  console.error('Set BRIDGE_TARGET_URL to the backend endpoint that accepts { "uid": "..." }.');
  process.exit(1);
}

const serial = new SerialPort({ path: portPath, baudRate });
const parser = serial.pipe(new ReadlineParser({ delimiter: process.env.SERIAL_LINE_DELIMITER || '\n' }));
const sockets = new Set();
const websocketServer = new WebSocketServer({ port: websocketPort });

websocketServer.on('connection', (socket) => sockets.add(socket));
websocketServer.on('listening', () => console.log(`Serial bridge websocket listening on ws://127.0.0.1:${websocketPort}`));

function normalizeUid(value) {
  return value.trim().replace(/[\r\n]/g, '').replace(/^UID\s*[:=]\s*/i, '');
}

async function forwardUid(uid) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ uid }),
  });
  if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}`);
}

parser.on('data', async (raw) => {
  const uid = normalizeUid(raw);
  if (!uid) return;

  try {
    if (mode !== 'ws') {
      await forwardUid(uid);
      console.log(`Forwarded UID ${uid}`);
    }
    const message = JSON.stringify({ type: 'uid', uid });
    for (const socket of sockets) {
      if (socket.readyState === 1) socket.send(message);
    }
  } catch (error) {
    console.error(`Failed to forward UID ${uid}: ${error.message}`);
  }
});

serial.on('open', () => console.log(`Serial bridge connected to ${portPath} at ${baudRate} baud`));
serial.on('error', (error) => console.error(`Serial error: ${error.message}`));

function shutdown() {
  websocketServer.close();
  serial.close(() => process.exit(0));
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
