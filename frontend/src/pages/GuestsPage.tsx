import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { guestsApi, eventsApi, categoriesApi } from '../api';
import type { Guest, Event, Category } from '../types';
import EventTabs from '../components/EventTabs';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { Upload, Check, DollarSign, QrCode, X, Download, Printer, Info } from 'lucide-react';

export default function GuestsPage() {
  const { id } = useParams<{ id: string }>();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newGuest, setNewGuest] = useState({ fullName: '', phoneNumber: '', attendanceType: 'SINGLE', categoryId: '' });

  // QR Modal State
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [qrModalGuest, setQrModalGuest] = useState<Guest | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const user = useAuthStore((s) => s.user);
  const showToast = useUiStore((s) => s.showToast);
  const canManage = user?.role === 'ADMIN' || user?.role === 'EVENT_MANAGER';

  const load = () => {
    if (!id) return;
    guestsApi.list(id).then((r) => setGuests(r.data));
    eventsApi.get(id).then((r) => setEvent(r.data));
    categoriesApi.list(id).then((r) => setCategories(r.data));
  };

  useEffect(load, [id]);

  const filtered = guests.filter((g) => {
    const matchSearch = g.fullName.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || g.category.id === filterCategory;
    return matchSearch && matchCat;
  });

  const handleConfirm = async (guestId: string) => {
    await guestsApi.confirm(guestId);
    load();
  };

  const handlePaid = async (guestId: string) => {
    await guestsApi.paid(guestId);
    load();
  };

  const openGuestQr = async (guest: Guest) => {
    setLoadingQr(true);
    setQrModalGuest(guest);
    try {
      const response = await guestsApi.qrBlob(guest.id);
      const url = window.URL.createObjectURL(response.data);
      setQrModalUrl(url);
    } catch (error) {
      console.error('Failed to load guest QR', error);
      showToast('Unable to load QR code. Please try again.', 'error');
      closeQrModal();
    } finally {
      setLoadingQr(false);
    }
  };

  const closeQrModal = () => {
    if (qrModalUrl) {
      window.URL.revokeObjectURL(qrModalUrl);
    }
    setQrModalUrl(null);
    setQrModalGuest(null);
  };

  const handlePrintQr = () => {
    if (!qrModalUrl || !qrModalGuest) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to print.', 'error');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Guest QR - ${qrModalGuest.fullName}</title>
          <style>
            @page { size: 80mm 50mm; margin: 0; }
            * { box-sizing: border-box; }
            html, body { width: 80mm; height: 50mm; margin: 0; }
            body { font-family: Arial, sans-serif; display: grid; place-items: center; padding: 4mm; color: #10182d; }
            .ticket { width: 72mm; min-height: 42mm; display: grid; grid-template-columns: 1fr 25mm; gap: 3mm; align-items: center; border: .35mm solid #d8ddec; border-radius: 2mm; padding: 3mm; }
            .details { min-width: 0; text-align: left; }
            .event { color: #66708a; font-size: 7pt; margin-bottom: 2mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            h2 { font-size: 13pt; line-height: 1.08; margin: 0 0 2mm; overflow-wrap: anywhere; }
            .category { display: inline-block; color: #fff; background: ${qrModalGuest.category.colorHex}; border-radius: 999px; padding: 1.2mm 2mm; font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
            .type { color: #66708a; font-size: 7pt; margin-top: 2mm; }
            .plus-one { color: #10182d; font-size: 28pt; line-height: .85; font-weight: 950; letter-spacing: -.08em; margin: 1mm 0 2mm; }
            img { width: 23mm; height: 23mm; display: block; }
          </style>
        </head>
        <body>
          <main class="ticket">
            <section class="details">
              <div class="event">${event?.name || 'Event'}</div>
              <h2>${qrModalGuest.fullName}</h2>
              ${qrModalGuest.attendanceType === 'PLUS_ONE' ? '<div class="plus-one">+O</div>' : ''}
              <div class="category">${qrModalGuest.category.name}</div>
              <div class="type">${qrModalGuest.attendanceType === 'PLUS_ONE' ? 'Plus one' : 'Single'}</div>
            </section>
            <img src="${qrModalUrl}" alt="Guest QR code" onload="window.print();window.close()" />
          </main>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newGuest.categoryId) return;
    try {
      await guestsApi.create(id, newGuest);
      setShowAdd(false);
      setNewGuest({ fullName: '', phoneNumber: '', attendanceType: 'SINGLE', categoryId: '' });
      showToast('Guest added successfully', 'success');
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Guest could not be added. Please try again.', 'error');
    }
  };

  return (
    <div>
      <EventTabs />
      {event && (
        <div className="p-4 sm:p-8 pb-2">
          <h2 className="text-lg font-semibold text-slate-700">{event.name}</h2>
        </div>
      )}
      <div className="p-4 sm:p-8">
        
        {/* QR Modal */}
        {qrModalGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="font-bold text-slate-900 truncate pr-4">{qrModalGuest.fullName}</h3>
                <button onClick={closeQrModal} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 flex flex-col items-center">
                {loadingQr ? (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-xl mb-4 border border-slate-100">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : qrModalUrl ? (
                  <img src={qrModalUrl} alt="QR Code" className="w-48 h-48 mb-4 border border-slate-200 rounded-xl p-2 bg-white shadow-sm" />
                ) : null}
                
                <span className="px-3 py-1 text-xs font-medium rounded-full text-white mb-2" style={{ backgroundColor: qrModalGuest.category.colorHex }}>
                  {qrModalGuest.category.name}
                </span>
                <p className="text-slate-500 text-sm">Scan to Check-In</p>
              </div>
              
              <div className="flex border-t bg-slate-50">
                <button 
                  onClick={handlePrintQr}
                  disabled={loadingQr || !qrModalUrl}
                  className="flex-1 p-3 flex justify-center items-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors disabled:opacity-50"
                >
                  <Printer size={16} /> Print
                </button>
                <div className="w-px bg-slate-200" />
                <a 
                  href={qrModalUrl || '#'}
                  download={`QR_${qrModalGuest.fullName.replace(/\s+/g, '_')}.png`}
                  className={`flex-1 p-3 flex justify-center items-center gap-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors ${loadingQr || !qrModalUrl ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Download size={16} /> Download
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
          <input
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg flex-1 min-w-0"
          />
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterCategory}
              onChange={(e) => { const categoryId = e.target.value; setFilterCategory(categoryId); if (showAdd) setNewGuest((current) => ({ ...current, categoryId })); }}
              className="flex-1 sm:flex-none px-3 py-2 border rounded-lg"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {canManage && (
              <button
                onClick={() => {
                  if (!showAdd && !filterCategory) { showToast('Select a category before adding a guest.', 'error'); return; }
                  setNewGuest((current) => ({ ...current, categoryId: filterCategory }));
                  setShowAdd(!showAdd);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Guest
              </button>
            )}
            {canManage && (
              <Link
                to={`/events/${id}/guests/import`}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                <Upload size={16} /> Import Excel
              </Link>
            )}
          </div>
        </div>

        {showAdd && canManage && (
          <form onSubmit={handleAddGuest} className="bg-white border rounded-xl p-4 mb-4 flex flex-col gap-3">
            <input placeholder="Full name" value={newGuest.fullName} onChange={(e) => setNewGuest({ ...newGuest, fullName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            <input placeholder="Phone number (optional)" type="tel" value={newGuest.phoneNumber} onChange={(e) => setNewGuest({ ...newGuest, phoneNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={newGuest.attendanceType} onChange={(e) => setNewGuest({ ...newGuest, attendanceType: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg">
                <option value="SINGLE">Single</option>
                <option value="PLUS_ONE">Plus one</option>
              </select>
              <div className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 text-slate-600" aria-label="Selected guest category">
                {categories.find((category) => category.id === newGuest.categoryId)?.name || 'Select a category above'}
              </div>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg shrink-0">Save</button>
            </div>
          </form>
        )}

        <div className="mb-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-white p-2 text-indigo-600 shadow-sm"><Info size={16} /></div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Guest list key</p>
              <p className="mt-1 text-xs leading-5 text-slate-600"><span className="inline-flex items-center gap-1 font-semibold text-blue-700"><Check size={13} /> Tick</span> means confirmed. <span className="ml-2 inline-flex items-center gap-1 font-semibold text-emerald-700"><DollarSign size={13} /> Dollar sign</span> means paid.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Phone</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Card</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-3 font-medium">{g.fullName}</td>
                  <td className="p-3 text-slate-600">{g.phoneNumber || '—'}</td>
                  <td className="p-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: g.category.colorHex }}
                    >
                      {g.category.name}
                    </span>
                  </td>
                  <td className="p-3">{g.attendanceType === 'PLUS_ONE' ? 'Plus one' : 'Single'}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {g.confirmed && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Confirmed</span>}
                      {g.paid && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Paid</span>}
                      {g.checkedIn && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Checked in</span>}
                    </div>
                  </td>
                  <td className="p-3 text-slate-500 font-mono text-xs">{g.nfcCardUid || '—'}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {canManage && !g.confirmed && (
                        <button onClick={() => handleConfirm(g.id)} title="Confirm" className="p-1 hover:bg-slate-100 rounded">
                          <Check size={16} className="text-blue-600" />
                        </button>
                      )}
                      {canManage && !g.paid && (
                        <button onClick={() => handlePaid(g.id)} title="Mark paid" className="p-1 hover:bg-slate-100 rounded">
                          <DollarSign size={16} className="text-green-600" />
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => openGuestQr(g)} title="QR Code" className="p-1 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded transition-colors">
                          <QrCode size={16} />
                        </button>
                      )}
                      {!canManage && <span className="text-xs text-slate-400">Read-only</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-400">No guests found</div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">{filtered.length} of {guests.length} guests</p>
      </div>
    </div>
  );
}
