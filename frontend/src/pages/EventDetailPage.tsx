import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventsApi, categoriesApi, gatesApi } from '../api';
import type { Event, Category, Gate } from '../types';
import EventTabs from '../components/EventTabs';
import { formatDate, formatTime } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Sparkles, 
  Plus, 
  UsersRound, 
  DoorOpen, 
  DoorClosed, 
  Mail, 
  Activity, 
  Tag, 
  Loader2, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import Spinner from '../components/Spinner';
import SEO from '../components/SEO';
import './EventDetailPage.css';

const PRESET_COLORS = [
  { name: 'Royal Gold', hex: '#EAB308' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Sapphire', hex: '#3B82F6' },
  { name: 'Amethyst', hex: '#8B5CF6' },
  { name: 'Rose Quartz', hex: '#F43F5E' },
  { name: 'Charcoal', hex: '#64748B' },
];

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [newCat, setNewCat] = useState({ name: '', priorityLevel: 1, colorHex: '#EAB308' });
  const [newGate, setNewGate] = useState({ name: '', location: '' });
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [isSubmittingGate, setIsSubmittingGate] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const user = useAuthStore((s) => s.user);
  const showToast = useUiStore((s) => s.showToast);
  const canChangeStatus = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canManage = user?.role === 'ADMIN' || user?.role === 'EVENT_MANAGER';

  useEffect(() => {
    if (!id) return;
    Promise.all([eventsApi.get(id), categoriesApi.list(id), gatesApi.list(id)])
      .then(([eventRes, categoryRes, gateRes]) => {
        setEvent(eventRes.data);
        setCategories(categoryRes.data || []);
        setGates(gateRes.data || []);
      })
      .catch((err: any) => showToast(err.response?.data?.message || 'Failed to load event details', 'error'));
  }, [id, showToast]);

  const changeStatus = async (status: string) => {
    if (!id) return;
    setIsUpdatingStatus(true);
    try {
      const res = await eventsApi.updateStatus(id, status);
      setEvent(res.data);
      showToast(`Event status successfully updated to ${status}`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update event status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newCat.name.trim()) return;
    setIsSubmittingCat(true);
    try {
      await categoriesApi.create(id, newCat);
      setNewCat({ name: '', priorityLevel: 1, colorHex: PRESET_COLORS[0].hex });
      const response = await categoriesApi.list(id);
      setCategories(response.data || []);
      showToast('Guest category created successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add guest category', 'error');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const addGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newGate.name.trim()) return;
    setIsSubmittingGate(true);
    try {
      await gatesApi.create(id, newGate);
      setNewGate({ name: '', location: '' });
      const response = await gatesApi.list(id);
      setGates(response.data || []);
      showToast('Check-in gate added successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add gate', 'error');
    } finally {
      setIsSubmittingGate(false);
    }
  };

  if (!event) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner text="Loading event workspace…" useLogo={true} size="lg" />
      </div>
    );
  }

  const nextStatus =
    event.status === 'DRAFT' ? 'ACTIVE' :
    event.status === 'ACTIVE' ? 'CLOSED' :
    event.status === 'CLOSED' ? 'ARCHIVED' : null;

  // Resolve start/end dates
  const effectiveStartDate = event.startDate || event.eventDate || null;
  const effectiveEndDate = event.endDate || event.eventDate || null;
  const isSameDay = effectiveStartDate && effectiveEndDate && effectiveStartDate === effectiveEndDate;

  const renderDateRange = () => {
    if (!effectiveStartDate) return 'Date to be announced';
    if (isSameDay) return formatDate(effectiveStartDate);
    const start = formatDate(effectiveStartDate);
    const end = effectiveEndDate ? formatDate(effectiveEndDate) : null;
    return end ? `${start} – ${end}` : start;
  };

  const renderTimeRange = () => {
    const st = event.startTime ? formatTime(event.startTime) : null;
    const et = event.endTime ? formatTime(event.endTime) : null;
    if (st && et) return `${st} – ${et}`;
    if (st) return `From ${st}`;
    if (et) return `Until ${et}`;
    return null;
  };

  const timeRange = renderTimeRange();
  const statusLower = (event.status || 'draft').toLowerCase();

  return (
    <>
      <SEO 
        title={`${event.name} - Occassia Operations`}
        description={`Manage ${event.name} details, guest categories, gates, and operational readiness.`}
      />

      <EventTabs />

      <div className="edp-container">
        
        {/* HERO CARD */}
        <section className="edp-hero-card">
          <div className="edp-hero-top">
            <div className="min-w-0">
              <div className="edp-badge-cluster">
                <span className="edp-pill-type">
                  <Sparkles size={12} /> {event.type || 'EVENT'}
                </span>
                
                <span className={`edp-pill-status ${statusLower}`}>
                  {event.status === 'ACTIVE' && <span className="edp-pulse-dot" />}
                  {event.status}
                </span>
              </div>

              <h1 className="edp-event-title">{event.name}</h1>

              <div className="edp-meta-chips">
                <span className="edp-meta-item">
                  <CalendarDays size={16} />
                  <span>{renderDateRange()}</span>
                  {!isSameDay && effectiveEndDate && effectiveStartDate !== effectiveEndDate && (
                    <span className="text-xs opacity-75">
                      ({Math.round((new Date(effectiveEndDate).getTime() - new Date(effectiveStartDate!).getTime()) / 86400000) + 1} days)
                    </span>
                  )}
                </span>

                {timeRange && (
                  <span className="edp-meta-item">
                    <Clock size={16} />
                    <span>{timeRange}</span>
                  </span>
                )}

                {event.venue && (
                  <span className="edp-meta-item">
                    <MapPin size={16} />
                    <span>{event.venue}</span>
                  </span>
                )}
              </div>

              <p className="edp-creator-line">
                Created by <strong>{event.createdByName || 'Administrator'}</strong>
                {event.createdAt && ` • ${new Date(event.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>

            {canChangeStatus && nextStatus && (
              <button
                onClick={() => changeStatus(nextStatus)}
                disabled={isUpdatingStatus}
                className="edp-status-action-btn"
                title={`Advance lifecycle status to ${nextStatus}`}
              >
                {isUpdatingStatus ? (
                  <><Loader2 size={16} className="animate-spin" /> Updating…</>
                ) : (
                  <><CheckCircle2 size={16} /> Set {nextStatus}</>
                )}
              </button>
            )}
          </div>
        </section>

        {/* WORKSPACE SHORTCUTS */}
        <div className="edp-shortcuts-bar">
          <Link to={`/events/${id}/guests`} className="edp-shortcut-chip">
            <div className="edp-shortcut-icon">
              <UsersRound size={18} />
            </div>
            <div className="edp-shortcut-text">
              <strong>Guest List</strong>
              <span>Manage attendees & tables</span>
            </div>
            <ArrowRight size={14} className="ml-auto opacity-50" />
          </Link>

          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <Link to={`/events/${id}/invitations`} className="edp-shortcut-chip">
              <div className="edp-shortcut-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
                <Mail size={18} />
              </div>
              <div className="edp-shortcut-text">
                <strong>Digital Invitations</strong>
                <span>RSVP, Bahasha & delivery</span>
              </div>
              <ArrowRight size={14} className="ml-auto opacity-50" />
            </Link>
          )}

          <Link to={`/events/${id}/checkin`} className="edp-shortcut-chip">
            <div className="edp-shortcut-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DoorOpen size={18} />
            </div>
            <div className="edp-shortcut-text">
              <strong>Gate Check-In</strong>
              <span>NFC tap & QR verification</span>
            </div>
            <ArrowRight size={14} className="ml-auto opacity-50" />
          </Link>

          <Link to={`/events/${id}/dashboard`} className="edp-shortcut-chip">
            <div className="edp-shortcut-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Activity size={18} />
            </div>
            <div className="edp-shortcut-text">
              <strong>Live Analytics</strong>
              <span>Real-time arrivals counter</span>
            </div>
            <ArrowRight size={14} className="ml-auto opacity-50" />
          </Link>
        </div>

        {/* 2-COLUMN CONFIGURATION GRID */}
        <div className="edp-grid-two-column">
          
          {/* GUEST CATEGORIES SECTION */}
          <section className="edp-section-card">
            <div className="edp-section-header">
              <div className="edp-section-title-wrap">
                <div className="edp-section-icon-box">
                  <UsersRound size={18} />
                </div>
                <div>
                  <h3 className="edp-section-title">Guest Categories</h3>
                  <p className="edp-section-subtitle">Tiers, seating tags & badge colors</p>
                </div>
              </div>
              <span className="edp-count-pill">{categories.length} configured</span>
            </div>

            {/* Existing Categories Badges */}
            {categories.length === 0 ? (
              <div className="edp-empty-notice">
                No guest categories configured yet. Add your first tier below (e.g. VIP, Family, Regular).
              </div>
            ) : (
              <div className="edp-categories-list">
                {categories.map((c) => (
                  <span
                    key={c.id}
                    className="edp-category-pill"
                    style={{ backgroundColor: c.colorHex || '#6366f1' }}
                  >
                    <span>{c.name}</span>
                    <span className="edp-category-priority-tag">P{c.priorityLevel || 1}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Add Category Form */}
            {canManage && (
              <form onSubmit={addCategory} className="edp-form-box">
                <h4 className="edp-form-title">Add New Category</h4>
                
                <div className="edp-input-row">
                  <div className="edp-input-group" style={{ flex: '2 1 180px' }}>
                    <Tag size={15} className="edp-input-icon" />
                    <input
                      placeholder="Category name (e.g. VIP, Family, Groom's Friends)"
                      value={newCat.name}
                      onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                      className="edp-text-input"
                      required
                    />
                  </div>

                  <div className="edp-input-group" style={{ flex: '1 1 110px' }}>
                    <select
                      value={newCat.priorityLevel}
                      onChange={(e) => setNewCat({ ...newCat, priorityLevel: Number(e.target.value) })}
                      className="edp-select-input w-full"
                      title="Priority Level"
                    >
                      <option value={1}>P1 (High / VIP)</option>
                      <option value={2}>P2 (Standard)</option>
                      <option value={3}>P3 (General)</option>
                      <option value={4}>P4 (Staff / Vendor)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="edp-color-picker-wrap">
                    <span className="text-xs font-semibold text-slate-400 mr-1">Color:</span>
                    <div className="edp-color-presets">
                      {PRESET_COLORS.map((p) => (
                        <button
                          key={p.hex}
                          type="button"
                          onClick={() => setNewCat({ ...newCat, colorHex: p.hex })}
                          className={`edp-color-swatch-btn ${newCat.colorHex.toUpperCase() === p.hex.toUpperCase() ? 'selected' : ''}`}
                          style={{ backgroundColor: p.hex }}
                          title={p.name}
                          aria-label={p.name}
                        />
                      ))}
                    </div>

                    <div className="edp-custom-color-btn" style={{ backgroundColor: newCat.colorHex }} title="Custom color picker">
                      <input
                        type="color"
                        value={newCat.colorHex}
                        onChange={(e) => setNewCat({ ...newCat, colorHex: e.target.value })}
                        aria-label="Choose custom category color"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingCat || !newCat.name.trim()}
                    className="edp-submit-btn"
                  >
                    {isSubmittingCat ? (
                      <><Loader2 size={15} className="animate-spin" /> Adding…</>
                    ) : (
                      <><Plus size={16} /> Add Category</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* ACCESS GATES SECTION */}
          <section className="edp-section-card">
            <div className="edp-section-header">
              <div className="edp-section-title-wrap">
                <div className="edp-section-icon-box" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#10b981' }}>
                  <DoorOpen size={18} />
                </div>
                <div>
                  <h3 className="edp-section-title">Access Gates</h3>
                  <p className="edp-section-subtitle">Entry checkpoints & physical scanners</p>
                </div>
              </div>
              <span className="edp-count-pill">{gates.length} active</span>
            </div>

            {/* Existing Gates List */}
            {gates.length === 0 ? (
              <div className="edp-empty-notice">
                No gates configured yet. Add checkpoints (e.g. Main Entrance, VIP Gate) so staff can check in guests.
              </div>
            ) : (
              <div className="edp-gates-list">
                {gates.map((g) => (
                  <div key={g.id} className="edp-gate-card">
                    <div className="edp-gate-info">
                      <div className="edp-gate-icon-mini">
                        <DoorOpen size={15} />
                      </div>
                      <div className="edp-gate-names">
                        <h4 className="edp-gate-title">{g.name}</h4>
                        {g.location && (
                          <p className="edp-gate-loc">
                            <MapPin size={11} /> {g.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Gate Form */}
            {canManage && (
              <form onSubmit={addGate} className="edp-form-box">
                <h4 className="edp-form-title">Add Check-In Gate</h4>

                <div className="edp-input-row">
                  <div className="edp-input-group">
                    <DoorClosed size={15} className="edp-input-icon" />
                    <input
                      placeholder="Gate name (e.g. Main Gate, VIP West)"
                      value={newGate.name}
                      onChange={(e) => setNewGate({ ...newGate, name: e.target.value })}
                      className="edp-text-input"
                      required
                    />
                  </div>

                  <div className="edp-input-group">
                    <MapPin size={15} className="edp-input-icon" />
                    <input
                      placeholder="Location / Area (e.g. Front lobby, East wing)"
                      value={newGate.location}
                      onChange={(e) => setNewGate({ ...newGate, location: e.target.value })}
                      className="edp-text-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingGate || !newGate.name.trim()}
                    className="edp-submit-btn"
                  >
                    {isSubmittingGate ? (
                      <><Loader2 size={15} className="animate-spin" /> Adding…</>
                    ) : (
                      <><Plus size={16} /> Add Gate</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>

        </div>

      </div>
    </>
  );
}
