import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Mail,
  Download,
  Upload,
  Send,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Smartphone,
  MessageSquare,
  FileSpreadsheet,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import EventTabs from '../components/EventTabs';
import SEO from '../components/SEO';
import Spinner from '../components/Spinner';
import { eventsApi, guestsApi, invitationsApi } from '../api';
import type { Event, InvitationRecord } from '../types';
import { useInvitationStore } from '../store/invitationStore';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import {
  downloadInvitationTemplate,
  parseInvitationExcel,
  exportConfirmedGuestsXlsx,
  exportDeliveryReportsXlsx,
} from '../lib/invitationExcel';
import InvitationWizardModal from '../components/InvitationWizardModal';
import { apiErrorMessage, safeUserMessage } from '../lib/errorMessages';

export default function InvitationsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const canManageInvitations = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAllMode, setViewAllMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRsvp, setFilterRsvp] = useState<string>('ALL');

  // Mini pagination for the 10-guest embedded window
  const [miniPageIndex, setMiniPageIndex] = useState(0);

  // Selection mode for the full view
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const showToast = useUiStore((s) => s.showToast);

  const {
    invitationsByEvent,
    loadInvitations,
    importGuestsToInvitations,
  } = useInvitationStore();

  const currentInvitations: InvitationRecord[] = (id && invitationsByEvent[id]) || [];

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      eventsApi.get(id), 
      guestsApi.list(id),
      invitationsApi.list(id).catch(() => ({ data: [] }))
    ])
      .then(([eventRes, guestRes, invRes]) => {
        setEvent(eventRes.data);
        loadInvitations(id, guestRes.data, eventRes.data, invRes.data || []);
      })
      .catch((err) => {
        showToast(apiErrorMessage(err, 'Failed to load event details'), 'error');
      })
      .finally(() => setLoading(false));
  }, [id, loadInvitations, showToast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !event) return;

    try {
      showToast('Parsing and standardizing Excel guest list...', 'info');
      const parsedRows = await parseInvitationExcel(file);
      if (parsedRows.length === 0) {
        showToast('No valid guest records found in this file.', 'error');
        return;
      }

      // Also submit file to backend batch import endpoint
      try {
        await guestsApi.import(id, file);
      } catch {
        // Continue with local standardization if backend is offline or strict
      }

      importGuestsToInvitations(id, parsedRows, event);
      showToast(`Successfully imported & standardized ${parsedRows.length} guests!`, 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('[Invitations] Import failed', err);
      showToast(`Import failed: ${safeUserMessage(err?.message, 'Please check the spreadsheet columns and try again')}`, 'error');
    }
  };

  const handleCopyLink = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    showToast('Digital invitation link copied to clipboard!', 'success');
  };

  const handleOpenWhatsApp = (guest: InvitationRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = (guest.whatsappNumber || guest.phoneNumber || '').replace(/[^0-9]/g, '');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${origin}/invite/${guest.token}`;
    const text = encodeURIComponent(
      `Habari ${guest.guestName}! You are cordially invited to celebrate ${event?.name || 'our special occasion'}. Please open your personalized digital invitation and RSVP here: ${inviteUrl} ✨`
    );
    const targetUrl = phone ? `https://wa.me/${phone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Stats calculation
  const totalCount = currentInvitations.length;
  const sentCount = currentInvitations.filter((i) => i.deliveryStatus !== 'PENDING').length;
  const attendingCount = currentInvitations.filter((i) => i.rsvpStatus === 'ATTENDING').length;
  const totalAttendingHeadcount = currentInvitations
    .filter((i) => i.rsvpStatus === 'ATTENDING')
    .reduce((acc, curr) => acc + (1 + (curr.rsvpHeadcount || 0)), 0);
  const declinedCount = currentInvitations.filter((i) => i.rsvpStatus === 'DECLINED').length;
  const pendingCount = currentInvitations.filter((i) => i.rsvpStatus === 'PENDING').length;

  // Embedded window: 10 guests per page
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const top10Guests = currentInvitations.slice(
    miniPageIndex * pageSize,
    (miniPageIndex + 1) * pageSize
  );

  // Full view filtering
  const filteredGuests = currentInvitations.filter((i) => {
    const matchName =
      i.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.phoneNumber && i.phoneNumber.includes(searchTerm)) ||
      (i.email && i.email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchName) return false;
    if (filterRsvp === 'ATTENDING') return i.rsvpStatus === 'ATTENDING';
    if (filterRsvp === 'DECLINED') return i.rsvpStatus === 'DECLINED';
    if (filterRsvp === 'PENDING') return i.rsvpStatus === 'PENDING';
    if (filterRsvp === 'SENT') return i.deliveryStatus !== 'PENDING';
    return true;
  });

  const isAllSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((g) => selectedGuestIds.includes(g.id) || selectedGuestIds.includes(g.guestId));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedGuestIds([]);
    } else {
      setSelectedGuestIds(filteredGuests.map((g) => g.id));
    }
  };

  const toggleSelectOne = (idToToggle: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(idToToggle) ? prev.filter((x) => x !== idToToggle) : [...prev, idToToggle]
    );
  };

  if (loading) return <Spinner />;

  if (!canManageInvitations) {
    return (
      <div className="ops-page">
        <SEO
          title={`Invitations - ${event?.name || 'Event'} | Occassia`}
          description="Digital invitation management restricted to event creators."
          noIndex
        />
        <EventTabs />
        <div className="ops-page-inner">
          <div className="ops-panel ops-empty">
            <Mail size={32} />
            <strong>Restricted Access</strong>
            <span>Only event creators and administrators have permission to access digital invitations.</span>
            <Link to={`/events/${id}`} className="ops-button primary">
              Return to Event Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ops-page">
      <SEO
        title={`Invitations - ${event?.name || 'Event'} | Occassia`}
        description="Send luxury animated digital invitations, manage guest lists, and track real-time RSVPs."
      />
      <EventTabs />

      <div className="ops-page-inner">
        {/* VIEW ALL FULL-PAGE SCROLLABLE LIST */}
        {viewAllMode ? (
          <div className="space-y-6 animate-fade-in">
            {/* Back Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-line)] shadow-sm">
              <button
                onClick={() => setViewAllMode(false)}
                className="ops-button secondary flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back to Invitation Overview
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-ink-muted)]">
                  Showing <strong>{filteredGuests.length}</strong> of {totalCount} guests
                </span>
                {selectedGuestIds.length > 0 && (
                  <button
                    onClick={() => setWizardOpen(true)}
                    className="ops-button primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Send size={15} /> Send to Selected ({selectedGuestIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                />
                <input
                  type="text"
                  placeholder="Search guest name, +255 phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ops-input pl-10 h-10 text-xs"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-line)] text-xs overflow-x-auto w-full sm:w-auto">
                {['ALL', 'ATTENDING', 'PENDING', 'DECLINED', 'SENT'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterRsvp(tab)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition capitalize ${
                      filterRsvp === tab
                        ? 'bg-[var(--violet)] text-white'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    {tab.toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Select All Checkbox */}
              <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[var(--color-line)] text-[var(--violet)] focus:ring-[var(--violet)]"
                />
                <span>Select All Filtered</span>
              </label>
            </div>

            {/* Guest Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGuests.map((guest) => {
                const isSelected = selectedGuestIds.includes(guest.id);
                return (
                  <div
                    key={guest.id}
                    onClick={() => toggleSelectOne(guest.id)}
                    className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-500/10 border-[var(--violet)] ring-2 ring-[var(--violet)]/20 shadow-md'
                        : 'bg-[var(--color-surface-elevated)] border-[var(--color-line)] hover:border-[var(--violet)]'
                    }`}
                  >
                    <div>
                      {/* Top Row: Checkbox, Name, Category */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded border-[var(--color-line)] text-[var(--violet)]"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-[var(--color-ink)] leading-tight">
                              {guest.guestName}
                            </h4>
                            <span className="text-[10px] text-[var(--color-ink-muted)]">
                              Plus Ones: <strong>{guest.plusOnes}</strong>
                              {guest.tableNumber ? ` • Table ${guest.tableNumber}` : ''}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-[var(--violet)]">
                          {guest.categoryName || 'General'}
                        </span>
                      </div>

                      {/* Phone & Email Info */}
                      <div className="space-y-1.5 text-xs text-[var(--color-ink-muted)] my-3 pt-2 border-t border-[var(--color-line)]">
                        <div className="flex items-center gap-2">
                          <Smartphone size={13} className="text-blue-500" />
                          <span className="font-mono">{guest.phoneNumber || 'No SMS phone'}</span>
                        </div>
                        {guest.whatsappNumber && (
                          <div className="flex items-center gap-2">
                            <MessageSquare size={13} className="text-emerald-500" />
                            <span className="font-mono">{guest.whatsappNumber}</span>
                          </div>
                        )}
                        {guest.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={13} className="text-purple-500" />
                            <span className="truncate">{guest.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status & Links */}
                    <div className="pt-3 border-t border-[var(--color-line)] flex items-center justify-between text-xs">
                      {/* RSVP Badge */}
                      <div>
                        {guest.rsvpStatus === 'ATTENDING' && (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                            <CheckCircle2 size={12} /> Confirmed ({1 + guest.rsvpHeadcount})
                          </span>
                        )}
                        {guest.rsvpStatus === 'DECLINED' && (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full text-[11px]">
                            <XCircle size={12} /> Declined
                          </span>
                        )}
                        {guest.rsvpStatus === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full text-[11px]">
                            <Clock size={12} /> Pending RSVP
                          </span>
                        )}
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleOpenWhatsApp(guest, e)}
                          title="Share directly via WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button
                          onClick={(e) => handleCopyLink(guest.token, e)}
                          title="Copy Digital Invitation Link"
                          className="p-1.5 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--violet)] hover:bg-[var(--color-surface)] transition"
                        >
                          <Copy size={14} />
                        </button>
                        <Link
                          to={`/invite/${guest.token}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Preview digital invitation"
                          className="p-1.5 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--violet)] hover:bg-[var(--color-surface)] transition"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* MAIN INVITATION DASHBOARD VIEW */
          <div className="space-y-8 animate-fade-in">
            {/* Heading & Primary Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-[var(--color-line)]">
              <div>
                <span className="eyebrow-label">OCCASSIA INVITATION SUITE • VERSION 2.0</span>
                <h2 className="text-3xl font-extrabold text-[var(--color-ink)] tracking-tight mt-1">
                  Digital Invitations & RSVP Tracker
                </h2>
                <p className="text-sm text-[var(--color-ink-muted)] max-w-xl mt-1">
                  Design bespoke 3D animated invitation letters, import Excel guest lists, and
                  broadcast invitations via WhatsApp, SMS, or Email.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <button
                  onClick={() => downloadInvitationTemplate(event?.name)}
                  className="ops-button secondary flex items-center gap-2 text-xs"
                  title="Download clean Excel template formatted for Tanzanian guest lists"
                >
                  <Download size={15} /> Download Excel Template
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="ops-button secondary flex items-center gap-2 text-xs"
                >
                  <Upload size={15} /> Import Guests (XLSX)
                </button>

                <button
                  onClick={() => {
                    if (totalCount === 0) {
                      showToast('No guests found in this event. Please import or add guests first.', 'info');
                      return;
                    }
                    setSelectedGuestIds([]);
                    setWizardOpen(true);
                  }}
                  className="ops-button primary flex items-center gap-2 shadow-lg"
                >
                  <Send size={16} /> Invite All Guests ({totalCount})
                </button>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="ops-stat">
                <span>Total Guest List</span>
                <strong>{totalCount}</strong>
                <small>Imported into event</small>
              </div>

              <div className="ops-stat">
                <span>Invitations Sent</span>
                <strong className="text-blue-500">{sentCount}</strong>
                <small>{totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0}% dispatched</small>
              </div>

              <div className="ops-stat">
                <span>Confirmed (RSVP)</span>
                <strong className="text-emerald-500">{attendingCount}</strong>
                <small>{totalAttendingHeadcount} total attendees</small>
              </div>

              <div className="ops-stat">
                <span>Declined</span>
                <strong className="text-rose-500">{declinedCount}</strong>
                <small>Cannot attend</small>
              </div>

              <div className="ops-stat">
                <span>Pending Responses</span>
                <strong className="text-amber-500">{pendingCount}</strong>
                <small>Awaiting confirmation</small>
              </div>

              <div className="ops-stat">
                <span>Downloads</span>
                <div className="mt-2 flex flex-col gap-1.5">
                  <button
                    onClick={() => exportConfirmedGuestsXlsx(currentInvitations, event?.name || 'Event')}
                    className="text-[11px] font-bold text-[var(--violet)] hover:underline flex items-center gap-1"
                  >
                    <FileSpreadsheet size={12} /> Confirmed (.xlsx)
                  </button>
                  <button
                    onClick={() => exportDeliveryReportsXlsx(currentInvitations, event?.name || 'Event')}
                    className="text-[11px] font-bold text-[var(--violet)] hover:underline flex items-center gap-1"
                  >
                    <Download size={12} /> Delivery Logs (.xlsx)
                  </button>
                </div>
              </div>
            </div>

            {/* EMBEDDED SCROLLABLE WINDOW (Top 10 Guests) */}
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] shadow-sm overflow-hidden">
              {/* Window Header */}
              <div className="flex flex-wrap items-center justify-between p-5 border-b border-[var(--color-line)] bg-[var(--color-surface)]">
                <div>
                  <h3 className="font-bold text-base text-[var(--color-ink)]">
                    Guest Invitation Queue (Top 10 Window)
                  </h3>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Scroll and page through guests inside this window, or click View All for the full
                    gallery.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewAllMode(true)}
                    className="ops-button secondary flex items-center gap-2 text-xs font-bold text-[var(--violet)]"
                  >
                    View All Guests ({totalCount}) <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Scrollable List within this window */}
              <div className="max-h-[460px] overflow-y-auto divide-y divide-[var(--color-line)]">
                {top10Guests.length === 0 ? (
                  <div className="p-12 text-center text-[var(--color-ink-muted)]">
                    <Users size={36} className="mx-auto mb-3 opacity-40 text-[var(--violet)]" />
                    <p className="font-bold text-sm text-[var(--color-ink)]">No guests imported yet</p>
                    <p className="text-xs mt-1">
                      Download our formatted Excel template and import your guest list to start
                      inviting.
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="ops-button secondary mt-4 text-xs"
                    >
                      Import Guests Now
                    </button>
                  </div>
                ) : (
                  top10Guests.map((guest, idx) => (
                    <div
                      key={guest.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[var(--color-surface)] transition text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-mono text-[var(--color-ink-muted)] text-[11px]">
                          {miniPageIndex * pageSize + idx + 1}.
                        </span>
                        <div>
                          <div className="font-bold text-sm text-[var(--color-ink)]">
                            {guest.guestName}
                          </div>
                          <div className="text-[11px] text-[var(--color-ink-muted)] flex items-center gap-2">
                            <span>{guest.categoryName || 'General'}</span>
                            <span>•</span>
                            <span className="font-mono">{guest.phoneNumber || 'No phone'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery and RSVP Badges */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              guest.deliveryStatus === 'DELIVERED'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-500/15 text-gray-500'
                            }`}
                          >
                            {guest.deliveryStatus === 'DELIVERED'
                              ? `Delivered via ${guest.deliveryChannel}`
                              : 'Pending Delivery'}
                          </span>
                        </div>

                        <div className="text-right min-w-[110px]">
                          {guest.rsvpStatus === 'ATTENDING' && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                              <CheckCircle2 size={13} /> Attending ({1 + guest.rsvpHeadcount})
                            </span>
                          )}
                          {guest.rsvpStatus === 'DECLINED' && (
                            <span className="text-xs font-bold text-rose-500 flex items-center justify-end gap-1">
                              <XCircle size={13} /> Declined
                            </span>
                          )}
                          {guest.rsvpStatus === 'PENDING' && (
                            <span className="text-xs font-medium text-amber-500 flex items-center justify-end gap-1">
                              <Clock size={13} /> Waiting RSVP
                            </span>
                          )}
                        </div>

                        {/* Direct link & preview */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleOpenWhatsApp(guest, e)}
                            title="Share on WhatsApp"
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition"
                          >
                            <MessageSquare size={15} />
                          </button>
                          <button
                            onClick={(e) => handleCopyLink(guest.token, e)}
                            title="Copy link"
                            className="p-1.5 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--violet)] transition"
                          >
                            <Copy size={15} />
                          </button>
                          <Link
                            to={`/invite/${guest.token}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Open digital invitation"
                            className="p-1.5 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--violet)] transition"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Window Pagination Footer */}
              <div className="flex items-center justify-between p-4 border-t border-[var(--color-line)] bg-[var(--color-surface)] text-xs">
                <span className="text-[var(--color-ink-muted)]">
                  Page <strong>{miniPageIndex + 1}</strong> of <strong>{totalPages}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={miniPageIndex === 0}
                    onClick={() => setMiniPageIndex((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-elevated)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface)]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={miniPageIndex >= totalPages - 1}
                    onClick={() => setMiniPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                    className="p-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-elevated)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface)]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INVITATION WIZARD MODAL */}
      {event && (
        <InvitationWizardModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          event={event}
          selectedGuestIds={selectedGuestIds}
          totalGuestsCount={totalCount}
          onInvitationsSent={() => {
            setSelectedGuestIds([]);
          }}
        />
      )}
    </div>
  );
}
