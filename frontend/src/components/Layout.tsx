import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';
import { disconnectWebSocket } from '../lib/websocket';
import { Building2, Calendar, LogOut, Menu, Settings, Shield, X, User, Eye, EyeOff } from 'lucide-react';
import Toaster from './Toaster';
import LoadingOverlay from './LoadingOverlay';
import ConfirmationModal from './ConfirmationModal';

const nav = [
  { to: '/dashboard', label: 'Events', icon: Calendar },
  { to: '/organizations', label: 'Organizations', icon: Building2, roles: ['SUPER_ADMIN'] },
  { to: '/settings/users', label: 'Users', icon: Settings, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/audit', label: 'Audit Log', icon: Shield, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, token } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', password: '' });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const [updating, setUpdating] = useState(false);

  const openEditModal = () => {
    if (user) {
      setEditForm({ fullName: user.fullName, email: user.email, password: '' });
      setEditError('');
      setEditSuccess(false);
      setShowEditModal(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setEditError('');
    setEditSuccess(false);
    try {
      const res = await authApi.updateMe({
        fullName: editForm.fullName,
        email: editForm.email,
        password: editForm.password || undefined,
      });
      useAuthStore.setState({ user: res.data });
      setEditSuccess(true);
      setTimeout(() => setShowEditModal(false), 1200);
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update account details');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) await authApi.logout();
    } catch { /* ignore */ }
    disconnectWebSocket();
    logout();
    navigate('/login');
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  const renderNavItems = (mobile = false) =>
    nav
      .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
      .map((item) => {
        const active = location.pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={mobile ? closeMobileNav : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
              active
                ? 'bg-[#b8956a]/15 text-[#d4b896]'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Icon size={17} strokeWidth={active ? 2 : 1.5} />
            {item.label}
          </Link>
        );
      });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#faf8f5]">
      <div className="md:hidden flex items-center justify-between border-b border-[#0c0f14]/10 bg-[#0c0f14] px-4 py-3 text-white">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Occassia</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#b8956a]">
            Cotronix · Events
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
      </div>

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeMobileNav}
          aria-label="Close navigation"
        />
      )}

      <aside className="hidden w-64 shrink-0 flex-col bg-[#0c0f14] text-white md:flex">
        <div className="p-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
            Occassia
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[#b8956a]">
            Cotronix · Weddings & Events
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">{renderNavItems()}</nav>

        <div className="mx-3 mb-4 rounded-lg bg-white/5 p-4">
          <div className="truncate text-sm font-medium text-white/90">{user?.fullName}</div>
          <div className="mt-0.5 truncate text-xs text-[#b8956a]/80">
            {user?.role?.replace('_', ' ')}
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={openEditModal}
              className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              <User size={12} /> Edit Account
            </button>
            <span className="text-white/10 text-[10px]">|</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-[#0c0f14] text-white transition-transform duration-200 md:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-white">
              Occassia
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[#b8956a]">
              Cotronix · Events
            </p>
          </div>
          <button
            type="button"
            onClick={closeMobileNav}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">{renderNavItems(true)}</nav>

        <div className="mx-3 mb-4 rounded-lg bg-white/5 p-4">
          <div className="truncate text-sm font-medium text-white/90">{user?.fullName}</div>
          <div className="mt-0.5 truncate text-xs text-[#b8956a]/80">
            {user?.role?.replace('_', ' ')}
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                openEditModal();
                closeMobileNav();
              }}
              className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              <User size={12} /> Edit Account
            </button>
            <span className="text-white/10 text-[10px]">|</span>
            <button
              onClick={() => {
                handleLogout();
                closeMobileNav();
              }}
              className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/70"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">{children}</main>

      <Toaster />
      <LoadingOverlay />
      <ConfirmationModal />

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#0c0f14] text-white rounded-xl border border-white/10 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display text-xl font-semibold text-white mb-1">Edit Account Details</h3>
            <p className="text-white/50 text-xs mb-4">Update your profile information and password.</p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/45 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full py-2 bg-transparent border-0 border-b border-white/20 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#b8956a] transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-white/45 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full py-2 bg-transparent border-0 border-b border-white/20 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#b8956a] transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-white/45 uppercase tracking-wider mb-1">New Password (leave blank to keep current)</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full py-2 pr-8 bg-transparent border-0 border-b border-white/20 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#b8956a] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white focus:outline-none"
                  >
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {editError && <p className="text-red-500 text-xs mt-2">{editError}</p>}
              {editSuccess && <p className="text-emerald-500 text-xs mt-2 font-medium">Account updated successfully!</p>}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={updating}
                  className="px-4 py-2 border border-white/10 rounded-lg text-xs font-medium text-white/70 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-[#b8956a] text-[#0c0f14] rounded-lg text-xs font-medium hover:bg-[#cbb08d] transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
