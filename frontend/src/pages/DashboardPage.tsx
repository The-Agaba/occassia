import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import type { Event } from '../types';
import { formatDate, statusColors } from '../lib/utils';
import { Plus } from 'lucide-react';
import Spinner from '../components/Spinner';
import SEO from '../components/SEO';

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoadingState] = useState(true);
  const user = useAuthStore((s) => s.user);
  const showToast = useUiStore((s) => s.showToast);
  const canCreateEvent = user?.role === 'ADMIN';

  useEffect(() => {
    eventsApi.list()
      .then((r) => setEvents(r.data))
      .catch((err: any) => showToast(err.response?.data?.message || 'Failed to load events', 'error'))
      .finally(() => {
        setLoadingState(false);
      });
  }, [showToast]);

  return (
    <>
      <SEO 
        title="Events Dashboard - Occassia"
        description="View and manage all your wedding and events in one place. Track event status, guest lists, and operational details."
        keywords="events dashboard, event management, wedding events overview, event tracking"
      />
      <div className="p-4 sm:p-8 lg:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#0c0f14]">Events</h1>
          <p className="text-[#6b7280] mt-1 text-sm">
            {user?.role === 'SUPER_ADMIN'
              ? 'View and manage events across the entire Occassia platform.'
              : 'Manage your organization\'s events.'}
          </p>
        </div>
        {canCreateEvent && (
          <Link
            to="/events/new"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0c0f14] text-white text-sm font-medium hover:bg-[#161b24] transition-colors self-start sm:self-auto"
          >
            <Plus size={17} /> New Event
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-12"><Spinner text="Loading events…" useLogo={true} size="lg" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-[#6b7280]">No events yet. Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block card p-6 hover:shadow-lg hover:border-[#d4b896]/40 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-lg text-[#0c0f14] group-hover:text-[#b8956a] transition-colors">
                  {event.name}
                </h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColors[event.status]}`}>
                  {event.status}
                </span>
              </div>
              <p className="text-xs text-[#b8956a] mt-3 uppercase tracking-wider">{event.type}</p>
              <p className="text-sm text-[#6b7280] mt-1">{formatDate(event.startDate || event.eventDate)}</p>
              {event.venue && <p className="text-sm text-[#9ca3af] mt-1 truncate">{event.venue}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
