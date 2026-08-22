import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { checkinApi, gatesApi } from '../api';
import type { CheckInResult, Gate } from '../types';
import EventTabs from '../components/EventTabs';
import { wsManager } from '../lib/websocket';
import { formatDateTime } from '../lib/utils';
import type { IMessage } from '@stomp/stompjs';
import { useUiStore } from '../store/uiStore';
import { Smartphone, Keyboard, AlertCircle, Scan, CheckCircle2 } from 'lucide-react';

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const [gates, setGates] = useState<Gate[]>([]);
  const [gateId, setGateId] = useState('');
  const [nfcUid, setNfcUid] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResult | null>(null);
  const [error, setError] = useState('');
  const showToast = useUiStore((s) => s.showToast);
  
  // NFC states
  const [nfcSupported, setNfcSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [nfcPermissionState, setNfcPermissionState] = useState<string>('prompt');
  
  // Mode: 'nfc' | 'manual'
  const [mode, setMode] = useState<'nfc' | 'manual'>('manual');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const ndefRef = useRef<any>(null);

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
      if (mode === 'manual') {
        inputRef.current?.focus();
      }
      showToast('Check-in completed', 'success');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Check-in failed';
      setError(message);
      showToast(message, 'error');
    }
  }, [gateId, mode, showToast]);

  const handleManualKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCheckIn(nfcUid);
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
        setError('NFC permission denied. Please allow NFC access or use manual entry.');
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
      <div className="p-4 sm:p-8 pb-2">
        {/* Consistent header area for positioning */}
      </div>
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
                onClick={() => { setMode('manual'); stopNfcScan(); }}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  mode === 'manual' ? 'bg-slate-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Keyboard size={16} /> Manual / External Scanner
              </button>
            </div>

            <div className="p-6">
              {mode === 'nfc' ? (
                <div className="text-center py-6">
                  {nfcPermissionState === 'denied' ? (
                    <div className="text-red-500 mb-4">
                      <AlertCircle size={40} className="mx-auto mb-2" />
                      <p>NFC permissions were denied.</p>
                      <button onClick={() => setMode('manual')} className="mt-3 text-sm underline">Switch to Manual Mode</button>
                    </div>
                  ) : scanning ? (
                    <div className="animate-pulse">
                      <Scan size={60} className="mx-auto text-indigo-500 mb-4" />
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
              ) : (
                <div>
                  <p className="text-sm text-slate-500 mb-4">
                    Use this mode if you are using an external USB/Bluetooth scanner that acts as a keyboard, or if you need to manually type a UID.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={inputRef}
                      placeholder="Scan or type UID..."
                      value={nfcUid}
                      onChange={(e) => setNfcUid(e.target.value)}
                      onKeyDown={handleManualKeyDown}
                      className="flex-1 min-w-0 px-4 py-2.5 border rounded-lg font-mono text-lg shadow-inner bg-slate-50 focus:bg-white transition-colors"
                      autoFocus
                    />
                    <button onClick={() => executeCheckIn(nfcUid)} className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors">
                      Check In
                    </button>
                  </div>
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
                  onClick={() => checkinApi.print(lastCheckIn.checkInId)}
                  className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                >
                  Mark Ticket Printed
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
