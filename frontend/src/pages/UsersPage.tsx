import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationsApi, usersApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { disconnectWebSocket } from '../lib/websocket';
import { Eye, EyeOff } from 'lucide-react';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  organizationId?: string | null;
  organizationName?: string;
  createdById?: string | null;
  creatorRole?: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'EVENT_MANAGER' });
  const currentUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const confirmAction = useUiStore((s) => s.confirmAction);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  const load = async () => {
    try {
      const usersRes = await usersApi.list();
      const userRows = usersRes.data as UserRow[];
    if (currentUser?.role === 'SUPER_ADMIN') {
      const orgsRes = await organizationsApi.list();
      const map = orgsRes.data.reduce((acc: Record<string, string>, org) => {
        acc[org.id] = org.name;
        return acc;
      }, {});
      const enriched = userRows.map((u) => ({ ...u, organizationName: u.organizationId ? map[u.organizationId] : 'Unknown' }));
      setUsers(enriched);
      const counts = enriched.reduce((acc: Record<string, number>, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
      setRoleCounts(counts);
    } else {
      setUsers(userRows);
      const counts = userRows.reduce((acc: Record<string, number>, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
      setRoleCounts(counts);
    }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load users', 'error');
    }
  };

  useEffect(() => { load(); }, [currentUser?.role]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          fullName: form.fullName,
          email: form.email,
          password: form.password || undefined,
          role: form.role,
        });
        showToast('User updated', 'success');
      } else {
        await usersApi.create(form);
        showToast('User created', 'success');
      }
      setShowForm(false);
      setEditingUser(null);
      setForm({ fullName: '', email: '', password: '', role: 'EVENT_MANAGER' });
      await load();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save user', 'error');
    } finally { setLoading(false); }
  };

  const handleEdit = (u: UserRow) => {
    setEditingUser(u);
    setForm({ fullName: u.fullName, email: u.email, password: '', role: u.role });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setForm({ fullName: '', email: '', password: '', role: 'EVENT_MANAGER' });
  };

  const canEditUser = (target: UserRow) => {
    if (!currentUser) return false;
    if (target.id === currentUser.id) return true;

    // Only ADMIN and SUPER_ADMIN can edit others
    const isEditorAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
    if (!isEditorAdmin) return false;

    // If target has a creator with greater privilege than the current editor
    if (target.createdById && target.creatorRole) {
      const roleOrder = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'CHECKIN_STAFF', 'VIEWER'];
      const creatorPrivilege = roleOrder.indexOf(target.creatorRole);
      const editorPrivilege = roleOrder.indexOf(currentUser.role);

      if (creatorPrivilege < editorPrivilege) {
        // Creator has greater privilege. Only the creator themselves can edit.
        return currentUser.id === target.createdById;
      }
    }
    return true;
  };

  const canDeleteUser = (target: UserRow) => {
    if (!currentUser) return false;
    // Can always delete your own account unless you're the sole SUPER_ADMIN or sole ADMIN in the org
    if (target.id === currentUser.id) {
      if (currentUser.role === 'SUPER_ADMIN') {
        return (roleCounts['SUPER_ADMIN'] || 0) > 1;
      }
      if (currentUser.role === 'ADMIN') {
        return (roleCounts['ADMIN'] || 0) > 1;
      }
      return true;
    }
    // Can delete accounts you created
    if (target.createdById === currentUser.id) return true;
    // Admins can delete users they have privilege over
    const isEditorAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
    if (!isEditorAdmin) return false;
    // But not if the target was created by someone with higher privilege (unless you're the creator)
    if (target.createdById && target.creatorRole) {
      const roleOrder = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'CHECKIN_STAFF', 'VIEWER'];
      const creatorPrivilege = roleOrder.indexOf(target.creatorRole);
      const editorPrivilege = roleOrder.indexOf(currentUser.role);
      if (creatorPrivilege < editorPrivilege) return false;
    }
    return true;
  };

  const handleDelete = async (u: UserRow) => {
    const isSelf = u.id === currentUser?.id;
    const label = isSelf ? 'your own account' : `${u.fullName}'s account`;
    const confirmMsg = isSelf
      ? 'Deactivate your own account? You will be signed out immediately and will no longer be able to log in.'
      : `Deactivate ${label}? This will prevent them from logging in.`;

    const confirmed = await confirmAction({
      title: 'Deactivate user',
      message: confirmMsg,
      confirmLabel: 'Deactivate',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await usersApi.delete(u.id);
      showToast('User deactivated', 'success');
      if (isSelf) {
        disconnectWebSocket();
        logout();
        navigate('/login', { state: { message: 'Your account has been deactivated.' } });
        return;
      }
      await load();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to deactivate account.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0c0f14]">User Management</h1>
          <p className="text-slate-500 text-xs mt-1">
            {currentUser?.role === 'SUPER_ADMIN'
              ? 'View and manage users across the entire Occassia platform.'
              : 'Add and manage organization user accounts.'}
          </p>
        </div>
        <button onClick={() => { if(showForm) handleCancel(); else setShowForm(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium self-start sm:self-auto">
          {showForm ? 'Close Form' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateOrUpdate} className="bg-white border rounded-xl p-6 mb-6 grid md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500 mb-1">Full Name</label>
            <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500 mb-1">Email</label>
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500 mb-1">
              {editingUser ? "New Password (leave blank to keep current)" : "Password"}
            </label>
            <div className="relative">
              <input 
                placeholder={editingUser ? "••••••••" : "Password"} 
                type={showPassword ? "text" : "password"} 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg text-sm pr-10" 
                required={!editingUser} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="EVENT_MANAGER">Event Manager</option>
              <option value="CHECKIN_STAFF">Check-in Staff</option>
              <option value="VIEWER">Viewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 font-semibold text-slate-700">Name</th>
              <th className="text-left p-3 font-semibold text-slate-700">Email</th>
              {currentUser?.role === 'SUPER_ADMIN' && (
                <th className="text-left p-3 font-semibold text-slate-700">Organization</th>
              )}
              <th className="text-left p-3 font-semibold text-slate-700">Role</th>
              <th className="text-left p-3 font-semibold text-slate-700">Status</th>
              <th className="text-left p-3 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-900">{u.fullName}</td>
                <td className="p-3 text-slate-600">{u.email}</td>
                {currentUser?.role === 'SUPER_ADMIN' && (
                  <td className="p-3 text-slate-600">{u.organizationName || u.organizationId || '—'}</td>
                )}
                <td className="p-3 text-slate-600">{u.role.replace('_', ' ')}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {canEditUser(u) && (
                      <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-900 font-medium text-xs">
                        Edit
                      </button>
                    )}
                    {canDeleteUser(u) && u.active && (
                      <button onClick={() => handleDelete(u)} disabled={loading} className="text-red-500 hover:text-red-700 font-medium text-xs disabled:opacity-50">
                        {u.id === currentUser?.id ? 'Deactivate Me' : 'Deactivate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
