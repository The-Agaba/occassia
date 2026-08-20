import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eventsApi, categoriesApi, gatesApi } from '../api';
import type { Event, Category, Gate } from '../types';
import EventTabs from '../components/EventTabs';
import { formatDate, formatTime, statusColors } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { CalendarDays, Clock, MapPin } from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [newCat, setNewCat] = useState({ name: '', priorityLevel: 1, colorHex: '#6B7280' });
  const [newGate, setNewGate] = useState({ name: '', location: '' });
  const user = useAuthStore((s) => s.user);
  const setLoading = useUiStore((s) => s.setLoading);
  const showToast = useUiStore((s) => s.showToast);
  const canChangeStatus = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canManage = user?.role === 'ADMIN' || user?.role === 'EVENT_MANAGER';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([eventsApi.get(id), categoriesApi.list(id), gatesApi.list(id)])
      .then(([eventRes, categoryRes, gateRes]) => {
        setEvent(eventRes.data);
        setCategories(categoryRes.data);
        setGates(gateRes.data);
      })
      .catch((err: any) => showToast(err.response?.data?.message || 'Failed to load event details', 'error'))
      .finally(() => setLoading(false));
  }, [id, setLoading, showToast]);

  const changeStatus = async (status: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await eventsApi.updateStatus(id, status);
      setEvent(res.data);
      showToast(`Event status updated to ${status}`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update event status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    try {
      await categoriesApi.create(id, newCat);
      setNewCat({ name: '', priorityLevel: 1, colorHex: '#6B7280' });
      const response = await categoriesApi.list(id);
      setCategories(response.data);
      showToast('Category added successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    try {
      await gatesApi.create(id, newGate);
      setNewGate({ name: '', location: '' });
      const response = await gatesApi.list(id);
      setGates(response.data);
      showToast('Gate added successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add gate', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return <div className="p-8 text-slate-500">Loading event…</div>;

  const nextStatus =
    event.status === 'DRAFT' ? 'ACTIVE' :
    event.status === 'ACTIVE' ? 'CLOSED' :
    event.status === 'CLOSED' ? 'ARCHIVED' : null;

  // Resolve effective start/end dates (prefer new fields, fall back to legacy eventDate)
  const effectiveStartDate = event.startDate || event.eventDate || null;
  const effectiveEndDate = event.endDate || event.eventDate || null;
  const isSameDay = effectiveStartDate && effectiveEndDate && effectiveStartDate === effectiveEndDate;

  /** Build a human-friendly date range string */
  const renderDateRange = () => {
    if (!effectiveStartDate) return '—';
    if (isSameDay) {
      return formatDate(effectiveStartDate);
    }
    const start = formatDate(effectiveStartDate);
    const end = effectiveEndDate ? formatDate(effectiveEndDate) : null;
    return end ? `${start} - ${end}` : start;
  };

  /** Build a human-friendly time range string */
  const renderTimeRange = () => {
    const st = event.startTime ? formatTime(event.startTime) : null;
    const et = event.endTime ? formatTime(event.endTime) : null;
    if (st && et) return `${st} - ${et}`;
    if (st) return `From ${st}`;
    if (et) return `Until ${et}`;
    return null;
  };

  const timeRange = renderTimeRange();

  return (
    <div>
      <div className="p-4 sm:p-8 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">{event.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusColors[event.status]}`}>
                {event.status}
              </span>
            </div>
            <p className="text-slate-500 mt-1 text-sm">{event.type}</p>
            <p className="text-xs text-slate-400 mt-2">Created by {event.createdByName || 'Unknown'} • {new Date(event.createdAt).toLocaleString()}</p>

            {/* Date range */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={15} className="text-slate-400" />
                {renderDateRange()}
                {!isSameDay && effectiveEndDate && effectiveStartDate !== effectiveEndDate && (
                  <span className="text-slate-400 text-xs ml-1">
                    ({Math.round((new Date(effectiveEndDate).getTime() - new Date(effectiveStartDate!).getTime()) / 86400000) + 1} days)
                  </span>
                )}
              </span>
              {timeRange && (
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-slate-400" />
                  {timeRange}
                </span>
              )}
            </div>

            {event.venue && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                <MapPin size={14} />
                <span className="truncate">{event.venue}</span>
              </p>
            )}
          </div>
          {canChangeStatus && nextStatus && (
            <button
              onClick={() => changeStatus(nextStatus)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 shrink-0 self-start"
            >
              Set {nextStatus}
            </button>
          )}
        </div>
      </div>
      <EventTabs />
      <div className="p-4 sm:p-8 grid lg:grid-cols-2 gap-6 sm:gap-8">
        <div>
          <h3 className="font-semibold mb-3">Guest Categories</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((c) => (
              <span key={c.id} className="px-3 py-1 rounded-full text-white text-sm" style={{ backgroundColor: c.colorHex }}>
                {c.name}
              </span>
            ))}
          </div>
          {canManage && (
            <form onSubmit={addCategory} className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <input placeholder="Name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} className="flex-1 min-w-0 px-3 py-2 border rounded-lg" required />
              <div className="flex gap-2">
                <input type="number" placeholder="Priority" value={newCat.priorityLevel} onChange={(e) => setNewCat({ ...newCat, priorityLevel: +e.target.value })} className="w-24 px-3 py-2 border rounded-lg" />
                <input type="color" value={newCat.colorHex} onChange={(e) => setNewCat({ ...newCat, colorHex: e.target.value })} className="h-10 w-12 border rounded" />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Add</button>
              </div>
            </form>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-3">Gates</h3>
          <ul className="space-y-2 mb-4">
            {gates.map((g) => (
              <li key={g.id} className="text-sm text-slate-600">{g.name}{g.location && ` - ${g.location}`}</li>
            ))}
          </ul>
          {canManage && (
            <form onSubmit={addGate} className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <input placeholder="Gate name" value={newGate.name} onChange={(e) => setNewGate({ ...newGate, name: e.target.value })} className="flex-1 min-w-0 px-3 py-2 border rounded-lg" required />
              <div className="flex gap-2">
                <input placeholder="Location" value={newGate.location} onChange={(e) => setNewGate({ ...newGate, location: e.target.value })} className="flex-1 min-w-0 px-3 py-2 border rounded-lg" />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm shrink-0">Add</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
