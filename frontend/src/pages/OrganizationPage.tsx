import { useEffect, useState } from 'react';
import { organizationsApi } from '../api';
import type { Organization } from '../types';
import { Plus, Edit2, Power, X, Building2, AlertCircle } from 'lucide-react';
import { useUiStore } from '../store/uiStore';
import { formatDateTime } from '../lib/utils';

interface OrgForm {
  name: string;
  contactEmail: string;
  contactPhone: string;
}

const emptyForm: OrgForm = { name: '', contactEmail: '', contactPhone: '' };

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const setLoading = useUiStore((s) => s.setLoading);
  const showToast = useUiStore((s) => s.showToast);
  const confirmAction = useUiStore((s) => s.confirmAction);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState<OrgForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setLocalLoading(true);
      setError('');
      const res = await organizationsApi.list();
      setOrgs(res.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load organizations.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
      setLocalLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingOrg(null);
    setForm(emptyForm);
    setFormError('');
    setSuccessMsg('');
    setShowForm(true);
  };

  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    setForm({ name: org.name, contactEmail: org.contactEmail, contactPhone: org.contactPhone || '' });
    setFormError('');
    setSuccessMsg('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingOrg(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contactEmail.trim()) {
      setFormError('Name and Contact Email are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
      };
      if (editingOrg) {
        await organizationsApi.update(editingOrg.id, payload);
        setSuccessMsg('Organization updated successfully.');
      } else {
        await organizationsApi.create(payload);
        setSuccessMsg('Organization created successfully.');
      }
      await load();
      setTimeout(() => { setSuccessMsg(''); closeForm(); }, 1200);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (org: Organization) => {
    const action = org.status === 'ACTIVE' ? 'deactivate' : 'activate';
    const confirmed = await confirmAction({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} organization`,
      message: `Are you sure you want to ${action} "${org.name}"?`,
      confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    try {
      if (org.status === 'ACTIVE') {
        await organizationsApi.deactivate(org.id);
      } else {
        await organizationsApi.activate(org.id);
      }
      await load();
      showToast(`Organization ${action}d successfully.`, 'success');
    } catch (err: any) {
      const message = err.response?.data?.message || `Failed to ${action} organization.`;
      showToast(message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0c0f14] flex items-center gap-2">
            <Building2 size={22} className="text-[#b8956a]" />
            Organizations
          </h1>
          <p className="text-slate-500 text-xs mt-1">Manage all tenant organizations (SUPER_ADMIN only)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#0c0f14] text-white text-sm font-medium rounded-lg hover:bg-[#161b24] transition-colors self-start sm:self-auto"
        >
          <Plus size={16} /> New Organization
        </button>
      </div>

      {/* Global error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0c0f14]">
                {editingOrg ? 'Edit Organization' : 'Create Organization'}
              </h3>
              <button onClick={closeForm} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Acme Events Co."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#b8956a]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@acme.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#b8956a]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#b8956a]"
                />
              </div>

              {formError && (
                <p className="text-red-600 text-xs flex items-center gap-1">
                  <AlertCircle size={13} /> {formError}
                </p>
              )}
              {successMsg && (
                <p className="text-emerald-600 text-xs font-medium">{successMsg}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0c0f14] text-white rounded-lg text-sm font-medium hover:bg-[#161b24] disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : editingOrg ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-slate-400 text-sm py-12 text-center">Loading organizations…</div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-xl">
          <Building2 size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm">No organizations yet.</p>
          <button onClick={openCreate} className="mt-4 text-sm text-[#b8956a] hover:underline">
            Create the first one
          </button>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-700">Name</th>
                <th className="text-left p-3 font-semibold text-slate-700">Email</th>
                <th className="text-left p-3 font-semibold text-slate-700">Phone</th>
                <th className="text-left p-3 font-semibold text-slate-700">Status</th>
                <th className="text-left p-3 font-semibold text-slate-700">Created</th>
                <th className="text-left p-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-900">{org.name}</td>
                  <td className="p-3 text-slate-600">{org.contactEmail}</td>
                  <td className="p-3 text-slate-500">{org.contactPhone || '-'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      org.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {org.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 whitespace-nowrap">{formatDateTime(org.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(org)}
                        title="Edit"
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-[#0c0f14]"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(org)}
                        title={org.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded hover:bg-slate-100 ${
                          org.status === 'ACTIVE' ? 'text-red-400 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-700'
                        }`}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
