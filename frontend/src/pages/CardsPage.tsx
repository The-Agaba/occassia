import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { cardsApi, guestsApi } from '../api';
import type { NfcCard, Guest } from '../types';
import EventTabs from '../components/EventTabs';
import scanCardImage from '../assets/scan-card.svg';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export default function CardsPage() {
  const { id } = useParams<{ id: string }>();
  const [cards, setCards] = useState<NfcCard[]>([]);
  const [assignable, setAssignable] = useState<Guest[]>([]);
  const [uid, setUid] = useState('');
  
  const [selectedGuestScanner, setSelectedGuestScanner] = useState('');
  const [scanUid, setScanUid] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [assignMode, setAssignMode] = useState<'manual' | 'scanner'>('manual');
  const [manualAssignments, setManualAssignments] = useState<Record<string, string>>({});
  const [registerMode, setRegisterMode] = useState<'manual' | 'scanner'>('manual');
  const uidInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'EVENT_MANAGER';
  const setLoading = useUiStore((s) => s.setLoading);
  const showToast = useUiStore((s) => s.showToast);
  const confirmAction = useUiStore((s) => s.confirmAction);

  const load = async () => {
    setLoading(true);
    try {
      const cardRes = await cardsApi.list();
      setCards(cardRes.data);
      if (id && canManage) {
        const guestRes = await guestsApi.assignable(id);
        setAssignable(guestRes.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const availableCards = cards.filter((c) => c.status === 'AVAILABLE');

  useEffect(() => {
    load();
  }, [id, canManage]);

  useEffect(() => {
    if (registerMode === 'scanner') {
      uidInputRef.current?.focus();
    }
  }, [registerMode]);

  const registerCard = async () => {
    if (!uid.trim()) return;
    setLoading(true);
    try {
      await cardsApi.register(uid.trim());
      setUid('');
      showToast('Card registered successfully', 'success');
      await load();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to register card', 'error');
    } finally {
      setLoading(false);
    }
  };

  const assignCard = async (guestId?: string, nfcUid?: string) => {
    const targetGuest = guestId || selectedGuestScanner;
    const targetCard = nfcUid || scanUid;
    if (!targetGuest || !targetCard) return;
    setLoading(true);
    try {
      await cardsApi.assign(targetGuest, targetCard);
      setScanUid('');
      setSelectedGuestScanner('');
      setScanError('');
      if (guestId) {
        setManualAssignments((current) => ({ ...current, [guestId]: '' }));
      }
      showToast('Card assigned successfully', 'success');
      await load();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign card', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmScanAssignment = async () => {
    if (!selectedGuestScanner) {
      setScanError('Please select a guest before scanning.');
      return;
    }
    if (!scanUid.trim()) {
      setScanError('Card failed to scan. Please try again.');
      return;
    }

    const guest = assignable.find((g) => g.id === selectedGuestScanner);
    if (!guest) {
      setScanError('Selected guest is not available.');
      return;
    }

    const confirmed = await confirmAction({
      title: `Assign scanned card to ${guest.fullName}?`,
      message: `Card UID: ${scanUid}`,
      description: 'Confirm assignment so this card can be used for guest entrance and future check-ins.',
      confirmLabel: 'Assign card',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      setScanUid('');
      return;
    }

    setScanning(true);
    try {
      await assignCard(selectedGuestScanner, scanUid);
    } finally {
      setScanning(false);
    }
  };

  const waitingForScan = assignMode === 'scanner' && !scanUid && !scanError && !scanning;
  const waitingForRegisterScan = registerMode === 'scanner' && !uid;

  return (
    <div>
      <EventTabs />
      <div className="p-8 grid lg:grid-cols-2 gap-8">
        {canManage ? (
          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Register Card</h3>
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRegisterMode('manual')}
                      className={`flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition ${registerMode === 'manual' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      Manual entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterMode('scanner')}
                      className={`flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition ${registerMode === 'scanner' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      External scanner
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {registerMode === 'scanner'
                      ? 'Focus the field and scan the card with your external scanner; it should type the UID and then press Enter.'
                      : 'Type the card UID directly. External scanners that act like keyboards also work here.'}
                  </p>
                </div>
                {registerMode === 'manual' ? (
                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      <input
                                        ref={uidInputRef}
                                        placeholder="NFC UID (e.g. 04:A3:FF:12:BC)"
                                        value={uid}
                                        onChange={(e) => setUid(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') registerCard();
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg font-mono"
                                      />
                                      <button onClick={registerCard} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                                        Register
                                      </button>
                                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center${waitingForRegisterScan ? ' scan-pulse' : ''}`}>
                      <img src={scanCardImage} alt="Scan card" className="mx-auto h-24 w-24" />
                      <p className="mt-4 text-sm font-semibold text-slate-700">Scan card</p>
                      <p className="mt-2 text-xs text-slate-500">Focus the hidden field and scan the card with your external scanner; the UID should appear automatically.</p>
                    </div>
                    <input
                      ref={uidInputRef}
                      placeholder="NFC UID (e.g. 04:A3:FF:12:BC)"
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') registerCard();
                      }}
                      className="w-full px-3 py-2 border rounded-lg font-mono"
                      style={{ opacity: 0, height: 0, padding: 0, margin: 0, border: 0 }}
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-slate-700">{uid || 'UID will appear here after scan'}</div>
                      <button onClick={registerCard} disabled={!uid} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                        Register
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Assign Card to Guest</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignMode('manual')}
                    className={`flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition ${assignMode === 'manual' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Manual assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode('scanner')}
                    className={`flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition ${assignMode === 'scanner' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Scan card
                  </button>
                </div>

                {assignMode === 'manual' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">Select a paid guest and assign one of the available cards.</p>
                    {assignable.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No eligible guests available for assignment.</div>
                    ) : (
                      <div className="space-y-3">
                        {assignable.map((g) => (
                          <div key={g.id} className="grid gap-3 md:grid-cols-[1fr_auto] items-center rounded-2xl border border-slate-200 p-3">
                            <div>
                              <p className="font-medium text-slate-900">{g.fullName}</p>
                              <p className="text-xs text-slate-500">{g.category.name} • {g.attendanceType}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <select
                                value={manualAssignments[g.id] ?? ''}
                                onChange={(e) => setManualAssignments((current) => ({ ...current, [g.id]: e.target.value }))}
                                className="px-3 py-2 border rounded-lg bg-white"
                              >
                                <option value="">Select available card</option>
                                {availableCards.map((card) => (
                                  <option key={card.uid} value={card.uid}>{card.uid}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => assignCard(g.id, manualAssignments[g.id])}
                                disabled={!manualAssignments[g.id]}
                                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50"
                              >
                                Assign
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center${waitingForScan ? ' scan-pulse' : ''}`}>
                      <img src={scanCardImage} alt="Scan card" className="mx-auto h-24 w-24" />
                      <p className="mt-4 text-sm font-semibold text-slate-700">Scan card</p>
                      <p className="mt-2 text-xs text-slate-500">Hold the NFC card to the scanner. The UID should appear automatically.</p>
                    </div>
                    <label htmlFor="scanner-guest" className="text-xs font-medium text-slate-600">
                      Select guest (confirmed + paid, no card)
                    </label>
                    <select
                      id="scanner-guest"
                      size={4}
                      value={selectedGuestScanner}
                      onChange={(e) => setSelectedGuestScanner(e.target.value)}
                      className="w-full max-h-32 overflow-y-auto px-3 py-2 border rounded-lg bg-white"
                    >
                      {assignable.map((g) => (
                        <option key={g.id} value={g.id}>{g.fullName} - {g.category.name}</option>
                      ))}
                    </select>
                    {!scanUid && !scanError && (
                      <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-500 text-sm">Waiting for card scan...</div>
                    )}
                    {scanError && (
                      <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{scanError}</div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-slate-700">{scanUid || 'UID will appear here after scan'}</div>
                      <button
                        type="button"
                        onClick={confirmScanAssignment}
                        disabled={!scanUid || !selectedGuestScanner || scanning}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                      >
                        {scanning ? 'Assigning…' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-600">
            Super admin has view-only access to card data.
          </div>
        )}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="p-4 border-b font-semibold">Organization Cards ({cards.length})</div>
          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm min-w-[450px]">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left p-3">UID</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Guest</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.uid} className="border-t">
                    <td className="p-3 font-mono text-xs">{c.uid}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                        c.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>{c.status}</span>
                    </td>
                    <td className="p-3 text-slate-600">{c.assignedGuestName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
