import { useEffect, useRef, useState } from 'react';
import { Keyboard, Radio, Smartphone, StopCircle } from 'lucide-react';

type Props = { onUid: (uid: string) => void; disabled?: boolean; label?: string };

export default function NfcCapture({ onUid, disabled = false, label = 'Read NFC card' }: Props) {
  const [mode, setMode] = useState<'device' | 'reader'>('device');
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [readerValue, setReaderValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<any>(null);

  useEffect(() => { setSupported('NDEFReader' in window); }, []);

  const startDeviceScan = async () => {
    if (!supported) { setMode('reader'); setError('Device NFC is not available in this browser. Use an external reader instead.'); return; }
    try {
      setError(''); setScanning(true);
      const reader = new (window as any).NDEFReader(); readerRef.current = reader;
      await reader.scan();
      reader.addEventListener('reading', ({ serialNumber }: { serialNumber?: string }) => {
        if (!readerRef.current) return;
        if (!serialNumber) { const message = 'The NFC card did not provide a UID. Try another card.'; setError(message); console.error('[NFC] Missing serial number'); return; }
        // Keep the reader active so registration can collect a batch without
        // requiring the operator to restart scanning after every tap.
        onUid(serialNumber);
      });
      reader.addEventListener('readingerror', () => { const message = 'The phone could not read that card. Hold it still against the back of the phone and try again.'; setError(message); console.error('[NFC] Reading error'); });
    } catch (err: any) {
      setScanning(false);
      const message = err?.name === 'NotAllowedError' ? 'NFC permission was denied. Allow NFC access in the browser or use an external reader.' : 'The phone NFC scanner could not start. Check device support and try again.';
      setError(message); console.error('[NFC] Failed to start device scan', err);
    }
  };

  const stopDeviceScan = () => { readerRef.current = null; setScanning(false); setError(''); };

  const captureReader = () => {
    const value = readerValue.trim();
    if (!value) { setError('No reader UID received yet. Tap a card on the connected reader.'); return; }
    setError(''); setReaderValue(''); onUid(value); inputRef.current?.focus();
  };

  return <section className="nfc-capture">
    <div className="nfc-capture-heading"><div><span className="eyebrow-label">CARD INPUT</span><h3>{label}</h3></div><span className={`nfc-status ${scanning ? 'active' : ''}`}><i />{scanning ? 'Listening' : 'Ready'}</span></div>
    <div className="nfc-mode-switch"><button type="button" className={mode === 'device' ? 'selected' : ''} onClick={() => { setMode('device'); setError(''); }}><Smartphone size={16} /> Phone NFC {supported ? '' : '(unavailable)'}</button><button type="button" className={mode === 'reader' ? 'selected' : ''} onClick={() => { setMode('reader'); setScanning(false); setError(''); }}><Keyboard size={16} /> External reader</button></div>
    {mode === 'device' ? <div className={`nfc-tap-zone ${scanning ? 'scanning' : ''}`}><div className="nfc-wave"><Radio size={34} /></div><strong>{scanning ? 'Hold card near the back of the phone' : 'Tap a card to capture its UID'}</strong><span>Only the card UID is read; no personal data is stored on the chip.</span><button type="button" className="ops-button primary" disabled={disabled} onClick={scanning ? stopDeviceScan : startDeviceScan}>{scanning ? <><StopCircle size={16} /> Stop listening</> : <><Radio size={16} /> Start phone NFC</>}</button></div> : <div className="reader-zone"><p>Connect a USB or Bluetooth reader in keyboard mode, then tap the card. The UID is captured automatically when the reader sends Enter.</p><input ref={inputRef} value={readerValue} disabled={disabled} autoFocus onChange={(e) => setReaderValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') captureReader(); }} placeholder="Waiting for external reader UID…" className="ops-input mono" /></div>}
    {error && <p className="inline-error" role="alert">{error}</p>}
  </section>;
}
