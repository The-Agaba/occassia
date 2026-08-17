import { Link, useParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

const tabs = [
  { path: '', label: 'Overview' },
  { path: '/guests', label: 'Guests' },
  { path: '/cards', label: 'Cards', roles: ['ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'] },
  { path: '/checkin', label: 'Check-in', roles: ['ADMIN', 'EVENT_MANAGER', 'CHECKIN_STAFF'] },
  { path: '/dashboard', label: 'Live Dashboard' },
  { path: '/reports', label: 'Reports' },
];

export default function EventTabs() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const base = `/events/${id}`;
  const visibleTabs = tabs.filter((tab) => !tab.roles || (user && tab.roles.includes(user.role)));

  return (
    <div className="border-b border-[#e8e4de] bg-white px-6">
      <div className="flex gap-1 -mb-px overflow-x-auto">
        {visibleTabs.map((tab) => {
          const to = base + tab.path;
          const active =
            tab.path === ''
              ? location.pathname === base
              : location.pathname.startsWith(base + tab.path);
          return (
            <Link
              key={tab.path}
              to={to}
              className={cn(
                'px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                active
                  ? 'border-[#b8956a] text-[#0c0f14]'
                  : 'border-transparent text-[#9ca3af] hover:text-[#6b7280]'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
