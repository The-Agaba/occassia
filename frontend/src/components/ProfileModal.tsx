import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';
import { useUiStore } from '../store/uiStore';
import { Shield, ShieldAlert, ShieldCheck, User, Mail, Building2, KeyRound, Lock, Pencil, Check, X } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore();
  const showToast = useUiStore((s) => s.showToast);

  // Check editing privileges: admins or super admins as mandated
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setError('You do not have administrative privileges to edit profiles.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await authApi.updateMe({
        fullName: fullName.trim(),
        email: email.trim(),
        ...(newPassword ? { password: newPassword } : {}),
      });

      if (res.data) {
        setUser(res.data);
      } else {
        setUser({ ...user, fullName: fullName.trim(), email: email.trim() });
      }

      showToast('Profile updated successfully', 'success');
      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Administrator', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'ADMIN':
        return { label: 'Administrator', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'EVENT_MANAGER':
        return { label: 'Event Manager', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'CHECKIN_STAFF':
        return { label: 'Check-in Staff', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
      default:
        return { label: role?.replace('_', ' ') || 'Staff', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12161f] shadow-2xl overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-xl flex items-center justify-center shadow-md">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                User Profile
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Account credentials and permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status / Permission Notice */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center gap-2.5 text-xs">
          {canEdit ? (
            <>
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">
                You have <strong>Administrative privileges</strong>. You are authorized to update profile information.
              </span>
            </>
          ) : (
            <>
              <ShieldAlert size={16} className="text-amber-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">
                <strong>Read-Only Access:</strong> Your role ({roleInfo.label}) can inspect profile data. Editing requires Administrator privileges.
              </span>
            </>
          )}
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User size={13} /> Full Name
            </label>
            <input
              type="text"
              value={fullName}
              disabled={!isEditing || !canEdit}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Mail size={13} /> Email Address
            </label>
            <input
              type="email"
              value={email}
              disabled={!isEditing || !canEdit}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Shield size={13} /> Role Privileges
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-between">
                <span>{user.role}</span>
                <Lock size={12} className="text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Building2 size={13} /> Organization
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-semibold truncate flex items-center justify-between">
                <span className="truncate">{user.organizationId ? `Org #${user.organizationId.slice(0, 8)}...` : 'Default Tenant'}</span>
                <Lock size={12} className="text-slate-400" />
              </div>
            </div>
          </div>

          {/* Password update if in editing mode */}
          {isEditing && canEdit && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound size={13} /> Change Password (Optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Occassia v2.0 Identity Security
            </span>

            <div className="flex items-center gap-2">
              {canEdit ? (
                isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFullName(user.fullName || '');
                        setEmail(user.email || '');
                        setNewPassword('');
                        setConfirmPassword('');
                        setError(null);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      {saving ? (
                        'Saving...'
                      ) : (
                        <>
                          <Check size={14} /> Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Pencil size={13} /> Edit Profile
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-semibold transition"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
