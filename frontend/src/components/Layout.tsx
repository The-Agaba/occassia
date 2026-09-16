import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, CalendarDays, CreditCard, FileText, LogOut, Menu, Settings2, ShieldCheck, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';
import { disconnectWebSocket } from '../lib/websocket';
import LoadingOverlay from './LoadingOverlay';
import ConfirmationModal from './ConfirmationModal';
import { ThemeToggle } from './ThemeProvider';

const nav = [
  { to: '/dashboard', label: 'Events', note: 'Your event spaces', icon: CalendarDays },
  { to: '/settings/users', label: 'Team access', note: 'Roles & permissions', icon: UserRound, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/audit', label: 'Audit trail', note: 'Operational history', icon: ShieldCheck, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/card-control', label: 'Card inventory', note: 'Event card control', icon: CreditCard, roles: ['ADMIN', 'EVENT_MANAGER'] },
  { to: '/organizations', label: 'Organizations', note: 'Platform settings', icon: Settings2, roles: ['SUPER_ADMIN'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, token } = useAuthStore(); const location = useLocation(); const navigate = useNavigate(); const [open, setOpen] = useState(false);
  const visibleNav = nav.filter((item) => !item.roles || (user && item.roles.includes(user.role)));
  const currentEventId = location.pathname.match(/^\/events\/([^/]+)/)?.[1];
  const signOut = async () => { try { if (token) await authApi.logout(); } catch { /* best effort */ } disconnectWebSocket(); logout(); navigate('/login'); };
  return <div className="app-shell">
    <button className={`mobile-scrim ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} aria-label="Close menu" />
    <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-brand"><img src="/new-favicon.svg" alt="Occassia logo" /><div><strong>Occassia</strong><span>by Cotronix</span></div><button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="workspace-chip"><span className="live-pip" /> <span>Operations workspace</span></div>
      <nav className="app-nav">{visibleNav.map(({ to, label, note, icon: Icon }) => { const target = to === '/card-control' ? (currentEventId ? `/events/${currentEventId}/cards` : '/dashboard') : to; const active = to === '/card-control' ? location.pathname.includes('/cards') : location.pathname.startsWith(to); return <Link key={to} to={target} onClick={() => setOpen(false)} className={`app-nav-link ${active ? 'active' : ''}`}><span className="nav-icon"><Icon size={18} /></span><span><b>{label}</b><small>{note}</small></span></Link>; })}</nav>
      <div className="sidebar-bottom"><Link className="help-link" to="/terms"><FileText size={16} /> Operating terms</Link><div className="sidebar-user"><div className="avatar">{user?.fullName?.charAt(0) || 'O'}</div><div className="user-details"><b>{user?.fullName}</b><span>{user?.role?.replace('_', ' ')}</span></div><button onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button></div></div>
    </aside>
    <section className="app-main"><header className="app-header"><button className="menu-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div><span className="header-kicker"><Activity size={13} /> OCCASSIA / LIVE OPERATIONS</span><h1>{location.pathname.includes('checkin') ? 'Gate check-in' : location.pathname.includes('cards') ? 'Card control' : 'Welcome back, ' + (user?.fullName?.split(' ')[0] || 'there')}</h1></div><div className="header-actions"><ThemeToggle /><span className="connection-badge"><i /> Connected</span><button className="header-avatar" onClick={() => navigate('/settings/users')} aria-label="Open account">{user?.fullName?.charAt(0) || 'O'}</button></div></header><main className="app-content">{children}</main></section>
    <LoadingOverlay /><ConfirmationModal />
  </div>;
}
