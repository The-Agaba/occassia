import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eventsApi, reportsApi } from '../api';
import type { EventStats } from '../types';
import EventTabs from '../components/EventTabs';
import { useUiStore } from '../store/uiStore';
import { Download, Loader2, AlertCircle } from 'lucide-react';

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => {
    if (id) eventsApi.stats(id).then((r) => setStats(r.data));
  }, [id]);

  const handleExport = async () => {
    if (!id) return;
    setIsExporting(true);
    setExportError('');
    try {
      const res = await reportsApi.export(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Report exported successfully', 'success');
    } catch (err: any) {
      const message = 'Failed to generate export. Please try again.';
      setExportError(message);
      showToast(message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="p-4 sm:p-8 pb-2">
        {/* Consistent header area for positioning */}
      </div>
      <EventTabs />
      <div className="p-4 sm:p-8">
        
        {exportError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm shadow-sm">
            <AlertCircle size={18} className="shrink-0" />
            <p>{exportError}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <h2 className="text-xl font-bold">Attendance Report</h2>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed self-start sm:self-auto"
          >
            {isExporting ? (
              <><Loader2 size={16} className="animate-spin" /> Exporting...</>
            ) : (
              <><Download size={16} /> Export CSV</>
            )}
          </button>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border rounded-xl p-4">
                <p className="text-2xl font-bold">{stats.totalGuests}</p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-600">{stats.checkedIn}</p>
                <p className="text-sm text-slate-500">Arrived</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-2xl font-bold text-amber-600">{stats.remaining}</p>
                <p className="text-sm text-slate-500">No-shows</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <p className="text-2xl font-bold">
                  {stats.totalGuests > 0 ? Math.round((stats.checkedIn / stats.totalGuests) * 100) : 0}%
                </p>
                <p className="text-sm text-slate-500">Attendance Rate</p>
              </div>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">Category</th>
                    <th className="text-right p-3">Total</th>
                    <th className="text-right p-3">Checked In</th>
                    <th className="text-right p-3">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byCategory.map((c) => (
                    <tr key={c.name} className="border-t">
                      <td className="p-3">
                        <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: c.colorHex }} />
                        {c.name}
                      </td>
                      <td className="p-3 text-right">{c.total}</td>
                      <td className="p-3 text-right">{c.checkedIn}</td>
                      <td className="p-3 text-right">
                        {c.total > 0 ? Math.round((c.checkedIn / c.total) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
