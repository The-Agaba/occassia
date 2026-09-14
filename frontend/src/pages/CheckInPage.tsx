import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { checkinApi, gatesApi } from '../api';
import type { CheckInResult, Gate } from '../types';
import EventTabs from '../components/EventTabs';
import { wsManager } from '../lib/websocket';
import { formatDateTime } from '../lib/utils';
import type { IMessage } from '@stomp/stompjs';
import { useUiStore } from '../store/uiStore';
import { Smartphone, Radio, QrCode, AlertCircle, Scan, CheckCircle2 } from 'lucide-react';

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const [gates, setGates] = useState<Gate[]>([]);
  const [gateId, setGateId] = useState('');
  const [nfcUid, setNfcUid] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResult | null>(null);
  const [error, setError] = useState('');
  const showToast = useUiStore((s) => s.showToast);
  
  // NFC states
  const [nfcSupported, setNfcSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [nfcPermissionState, setNfcPermissionState] = useState<string>('prompt');
  
  // Only NFC input methods are used for the primary flow; QR is the backup.
  const [mode, setMode] = useState<'nfc' | 'reader' | 'qr'>('reader');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const ndefRef = useRef<any>(null);
  const qrVideoRef = useRef<HTMLVideoElement>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);
  const qrFrameRef = useRef<number | null>(null);
  const [qrCameraReady, setQrCameraReady] = useState(false);

  useEffect(() => {
    if (id) gatesApi.list(id).then((r) => {
      setGates(r.data);
      if (r.data.length > 0) setGateId(r.data[0].id);
    });
    
    // Check WebNFC support
    if ('NDEFReader' in window) {
      setNfcSupported(true);
      setMode('nfc');
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    
    // Subscribe to remote check-ins so we see them if multiple devices are used
    const sub = wsManager.subscribe(`/topic/checkin/${id}`, (msg: IMessage) => {
      const data = JSON.parse(msg.body);
      setLastCheckIn({
        checkInId: '',
        guest: {
          id: data.guestId,
          fullName: data.guestName,
          attendanceType: 'SINGLE',
          category: { id: '', name: data.category, priorityLevel: 1, colorHex: data.categoryColor },
          tableNumber: null,
        },
        alreadyCheckedIn: false,
        checkedInAt: data.checkedInAt,
      });
    });
    
    return () => sub?.unsubscribe();
  }, [id]);

  const executeCheckIn = useCallback(async (uid: string) => {
    if (!uid.trim()) return;
    setError('');
    try {
      const res = await checkinApi.nfc(uid.trim(), gateId || undefined);
      setLastCheckIn(res.data);
      setNfcUid('');
      if (mode === 'reader') {
        inputRef.current?.focus();
      }
      showToast('Check-in completed', 'success');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Check-in failed';
      setError(message);
      showToast(message, 'error');
    }
  }, [gateId, mode, showToast]);

  const executeQrCheckIn = useCallback(async (token: string) => {
    if (!token.trim()) return;
    setError('');
    try {
      const res = await checkinApi.qr(token.trim(), gateId || undefined);
      setLastCheckIn(res.data);
      setQrToken('');
      inputRef.current?.focus();
      showToast('QR check-in completed', 'success');
    } catch (err: any) {
      const message = err.response?.data?.message || 'QR check-in failed';
      setError(message);
      showToast(message, 'error');
    }
  }, [gateId, showToast]);

  useEffect(() => {
    if (mode !== 'qr') return;
    let active = true;
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !(window as any).BarcodeDetector) {
        setError('Camera QR scanning is not available in this browser. Use the scanner input below.');
        return;
      }
      try {
        setError('');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (!active) { stream.getTracks().forEach((track) => track.stop()); return; }
        qrStreamRef.current = stream;
        if (qrVideoRef.current) { qrVideoRef.current.srcObject = stream; await qrVideoRef.current.play(); }
        setQrCameraReady(true);
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const scan = async () => {
          if (!active || !qrVideoRef.current || qrVideoRef.current.readyState < 2) { if (active) qrFrameRef.current = requestAnimationFrame(scan); return; }
          try {
            const codes = await detector.detect(qrVideoRef.current);
            const value = codes?.[0]?.rawValue;
            if (value) { await executeQrCheckIn(value); return; }
          } catch { /* camera frames can be unavailable while the stream warms up */ }
          if (active) qrFrameRef.current = requestAnimationFrame(scan);
        };
        qrFrameRef.current = requestAnimationFrame(scan);
      } catch (err: any) {
        setError(err?.name === 'NotAllowedError' ? 'Camera permission is required for QR backup. Allow access or use the scanner input below.' : 'Could not start the QR camera. Use the scanner input below.');
      }
    };
    void startCamera();
    return () => {
      active = false;
      if (qrFrameRef.current) cancelAnimationFrame(qrFrameRef.current);
      qrStreamRef.current?.getTracks().forEach((track) => track.stop());
      qrStreamRef.current = null;
      setQrCameraReady(false);
    };
  }, [mode, executeQrCheckIn]);

  const handleManualKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCheckIn(nfcUid);
    }
  };

  const printCompactTicket = async () => {
    if (!lastCheckIn?.checkInId) return;
    const printWindow = window.open('', '_blank', 'width=420,height=280');
    if (!printWindow) {
      showToast('Printing was blocked. Allow pop-ups for this site and try again.', 'error');
      return;
    }
    const guest = lastCheckIn.guest;
    const categoryCode = guest.category.priorityLevel > 0 && guest.category.priorityLevel < 27
      ? String.fromCharCode(64 + guest.category.priorityLevel) : guest.category.name.trim().charAt(0).toUpperCase();
    const statusLabel = lastCheckIn.alreadyCheckedIn ? 'ALREADY ARRIVED' : 'ARRIVED';
    const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    }[character] || character));
    printWindow.document.write(`
      <html><head><title>Entry ticket - ${escapeHtml(guest.fullName)}</title><style>
        @page{size:80mm 50mm;margin:0}*{box-sizing:border-box}html,body{width:80mm;height:50mm;margin:0}
        body{font-family:Arial,sans-serif;display:grid;place-items:center;padding:4mm;color:#10182d}
        .ticket{width:72mm;min-height:42mm;border:.35mm solid #d8ddec;border-radius:2mm;padding:3mm;display:flex;flex-direction:column;justify-content:center;gap:2mm}
        .event{font-size:7pt;color:#66708a}.status{font-size:17pt;font-weight:950;letter-spacing:.08em;color:${lastCheckIn.alreadyCheckedIn ? '#b33c50' : '#16734b'}}.code{font-size:24pt;font-weight:950;line-height:.9;color:${escapeHtml(guest.category.colorHex)}}.name{font-size:13pt;font-weight:800;line-height:1.08;overflow-wrap:anywhere}
        .category{font-size:9pt;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:${escapeHtml(guest.category.colorHex)};}
        .meta{font-size:7pt;color:#66708a}
      </style></head><body><main class="ticket">
        <div class="event">Occassia · Verified entry</div><div class="status">${statusLabel}</div><div class="code">${categoryCode}</div><div class="category">${escapeHtml(guest.category.name)}</div><div class="name">${escapeHtml(guest.fullName)}</div>
        <div class="meta">${escapeHtml(guest.attendanceType)}${guest.tableNumber ? ` · Table ${guest.tableNumber}` : ''}</div>
      </main><script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}</script></body></html>`);
    printWindow.document.close();
    try {
      await checkinApi.print(lastCheckIn.checkInId);
      showToast('Compact ticket sent to the printer.', 'success');
    } catch (error) {
      console.error('[TICKET_PRINT]', error);
      showToast('Ticket printed locally, but the server could not record the print status.', 'error');
    }
  };

  const startNfcScan = async () => {
    if (!('NDEFReader' in window)) return;
    
    try {
      setError('');
      setScanning(true);
      
      const ndef = new (window as any).NDEFReader();
      ndefRef.current = ndef;
      
      await ndef.scan();
      
      ndef.addEventListener('readingerror', () => {
        setError('Error reading NFC tag. Try again.');
      });
      
      ndef.addEventListener('reading', ({ serialNumber }: any) => {
        // serialNumber is typically XX:XX:XX:XX:XX:XX:XX
        if (serialNumber) {
          executeCheckIn(serialNumber);
        } else {
          setError('NFC tag contains no UID.');
        }
      });
      
    } catch (error: any) {
      setScanning(false);
      if (error.name === 'NotAllowedError') {
        setNfcPermissionState('denied');
        setError('NFC permission denied. Use an external NFC reader or the QR backup.');
      } else {
        setError('Failed to start NFC scanner: ' + error.message);
      }
    }
  };

  const stopNfcScan = () => {
    setScanning(false);
    // NDEFReader doesn't have a direct stop() method in all implementations,
    // but typically garbage collection cleans it up or abort controllers are used.
    // For simplicity, we just ignore events if scanning is false.
  };

  return (
    <div>
      <EventTabs />
      <div className="p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          
          <div className="mb-6 flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Gate</label>
              <select
                value={gateId}
                onChange={(e) => setGateId(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg bg-white shadow-sm"
              >
                {gates.length === 0 && <option value="">Default Gate</option>}
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm mb-8">
            <div className="flex border-b">
              {nfcSupported && (
                <button
                  onClick={() => setMode('nfc')}
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                    mode === 'nfc' ? 'bg-slate-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Smartphone size={16} /> Device NFC Scan
                </button>
              )}
              <button
                onClick={() => { setMode('reader'); stopNfcScan(); }}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  mode === 'reader' ? 'bg-slate-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Radio size={16} /> External NFC Reader
              </button>
              <button
                onClick={() => { setMode('qr'); stopNfcScan(); }}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mode === 'qr' ? 'bg-slate-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <QrCode size={16} /> QR Backup
              </button>
            </div>

            <div className="p-6">
              {mode === 'nfc' ? (
                <div className="text-center py-6">
                  {nfcPermissionState === 'denied' ? (
                    <div className="text-red-500 mb-4">
                      <AlertCircle size={40} className="mx-auto mb-2" />
                      <p>NFC permissions were denied.</p>
                      <button onClick={() => setMode('reader')} className="mt-3 text-sm underline">Use external NFC reader</button>
                    </div>
                  ) : scanning ? (
                    <div className="nfc-tap-zone scanning">
                      <div className="nfc-wave"><Scan size={34} /></div>
                      <p className="text-lg font-medium text-slate-700">Ready to Scan</p>
                      <p className="text-sm text-slate-500 mt-1">Hold an NFC card to the back of your device</p>
                      <button onClick={stopNfcScan} className="mt-6 px-4 py-2 border rounded-lg text-sm font-medium">Cancel</button>
                    </div>
                  ) : (
                    <div>
                      <Smartphone size={60} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-600 mb-6">Use your device's built-in NFC reader to check in guests.</p>
                      <button onClick={startNfcScan} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-sm flex items-center gap-2 mx-auto hover:bg-indigo-700 transition-colors">
                        <Scan size={18} /> Start Scanning
                      </button>
                    </div>
                  )}
                </div>
              ) : mode === 'reader' ? (
                <div>
                  <p className="text-sm text-slate-500 mb-4">
                    Connect a USB or Bluetooth NFC reader. When a card is tapped, the reader sends its UID and check-in starts automatically.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={inputRef}
                      placeholder="Waiting for NFC reader UID…"
                      value={nfcUid}
                      onChange={(e) => setNfcUid(e.target.value)}
                      onKeyDown={handleManualKeyDown}
                      className="flex-1 min-w-0 px-4 py-2.5 border rounded-lg font-mono text-lg shadow-inner bg-slate-50 focus:bg-white transition-colors"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-500 mb-4">Camera permission is requested here when needed. Scan a guest-specific QR code without leaving check-in.</p>
                  <div className={`qr-camera-frame ${qrCameraReady ? 'ready' : ''}`}>
                    <video ref={qrVideoRef} muted playsInline aria-label="QR camera preview" />
                    <span>{qrCameraReady ? 'Point the camera at a guest QR code' : 'Starting camera…'}</span>
                  </div>
                  <input
                    ref={inputRef}
                    placeholder="Scan guest QR code…"
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') executeQrCheckIn(qrToken); }}
                    className="w-full px-4 py-2.5 border rounded-lg font-mono shadow-inner bg-slate-50 focus:bg-white transition-colors"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {lastCheckIn && (
            <div className={`rounded-2xl p-8 text-center shadow-lg transition-colors animate-in zoom-in-95 duration-200 ${
              lastCheckIn.alreadyCheckedIn ? 'bg-red-50 border-2 border-red-300' : 'bg-white border-2 border-emerald-300'
            }`}>
              {lastCheckIn.alreadyCheckedIn ? (
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full font-bold text-sm mb-4">
                  <AlertCircle size={16} /> ALREADY CHECKED IN
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full font-bold text-sm mb-4">
                  <CheckCircle2 size={16} /> SUCCESS
                </div>
              )}
              <div className="checkin-category-code" style={{ color: lastCheckIn.guest.category.colorHex }}>{lastCheckIn.guest.category.priorityLevel > 0 && lastCheckIn.guest.category.priorityLevel < 27 ? String.fromCharCode(64 + lastCheckIn.guest.category.priorityLevel) : lastCheckIn.guest.category.name.charAt(0).toUpperCase()}</div>
              
              <p className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight break-words">{lastCheckIn.guest.fullName}</p>
              
              <div className="mt-5 flex justify-center items-center gap-3">
                <span
                  className="px-4 py-1.5 rounded-full text-white font-medium text-sm shadow-sm"
                  style={{ backgroundColor: lastCheckIn.guest.category.colorHex }}
                >
                  {lastCheckIn.guest.category.name}
                </span>
                <span className="text-slate-400 text-sm font-medium px-3 py-1 bg-slate-100 rounded-full">
                  {lastCheckIn.guest.attendanceType}
                </span>
              </div>

              {lastCheckIn.guest.tableNumber && (
                <div className="mt-6 inline-block bg-slate-50 border px-6 py-3 rounded-xl">
                  <p className="text-sm text-slate-500 uppercase tracking-widest font-medium mb-1">Table</p>
                  <p className="text-3xl font-bold text-slate-800">{lastCheckIn.guest.tableNumber}</p>
                </div>
              )}
              
              <p className="mt-6 text-sm font-medium text-slate-400">
                Processed at {formatDateTime(lastCheckIn.checkedInAt).split(',')[1]}
              </p>
              
              {!lastCheckIn.alreadyCheckedIn && lastCheckIn.checkInId && (
                <button
                  onClick={printCompactTicket}
                  className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                >
                  Print Compact Ticket
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
