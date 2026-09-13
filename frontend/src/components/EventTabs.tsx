import { Link, useParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { ArrowLeft, BarChart3, ClipboardList, CreditCard, Gauge, Radio, UsersRound } from 'lucide-react';

const tabs = [
  { path: '', label: 'Overview', icon: Gauge },
  { path: '/guests', label: 'Guest list', icon: UsersRound },
  { path: '/cards', label: 'Card inventory', icon: CreditCard, roles: ['ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'] },
  { path: '/cards/register', label: 'Register card', icon: Radio, roles: ['ADMIN', 'EVENT_MANAGER'] },
  { path: '/cards/assign', label: 'Assign card', icon: ClipboardList, roles: ['ADMIN', 'EVENT_MANAGER'] },
  { path: '/checkin', label: 'Gate check-in', icon: Radio, roles: ['ADMIN', 'EVENT_MANAGER', 'CHECKIN_STAFF'] },
  { path: '/dashboard', label: 'Live view', icon: BarChart3 },
  { path: '/reports', label: 'Reports', icon: ClipboardList },
];

export default function EventTabs() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const base = `/events/${id}`;
  const visibleTabs = tabs.filter((tab) => !tab.roles || (user && tab.roles.includes(user.role)));

  return (
    <>
    <div className="event-workspace-nav-spacer" aria-hidden="true" />
    <div className="event-workspace-nav">
      <div className="event-workspace-nav-inner"><Link to="/dashboard" className="event-back-link"><ArrowLeft size={15} /> All events</Link><div className="event-tab-strip">
        {visibleTabs.map((tab) => {
          const to = base + tab.path;
          // Keep the active marker exclusive: /cards/register and /cards/assign
          // are separate workflows and must not also highlight Card inventory.
          const active = location.pathname === to;
          return (
            <Link
              key={tab.path}
              to={to}
              className={cn('event-tab-link', active && 'active')}
            >
              <tab.icon size={15} /> {tab.label}
            </Link>
          );
        })}
      </div></div>
    </div>
    </>
  );
}
