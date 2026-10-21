import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eventsApi, reportsApi } from '../api';
import type { EventStats } from '../types';
import EventTabs from '../components/EventTabs';
import SEO from '../components/SEO';
import { useUiStore } from '../store/uiStore';
import { 
  Download, 
  Loader2, 
  AlertCircle, 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Layers 
} from 'lucide-react';
import './ReportsPage.css';

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => {
    if (id) {
      setLoading(true);
      eventsApi.stats(id)
        .then((r) => setStats(r.data))
        .catch(() => showToast('Could not load attendance statistics', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, showToast]);

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
    } catch {
      const message = 'Failed to generate export. Please try again.';
      setExportError(message);
      showToast(message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const totalGuests = stats?.totalGuests ?? 0;
  const checkedIn = stats?.checkedIn ?? 0;
  const remaining = stats?.remaining ?? 0;
  const attendanceRate = totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0;
  const categories = stats?.byCategory ?? [];

  return (
    <div className="rep-page-wrapper">
      <SEO 
        title="Attendance Report | Occassia" 
        description="Real-time attendance metrics and guest category breakdown." 
        noIndex 
      />
      <EventTabs />

      <div className="rep-container">
        {exportError && (
          <div className="rep-error-banner" role="alert">
            <AlertCircle size={18} className="shrink-0" />
            <p>{exportError}</p>
          </div>
        )}

        {/* Clean, uncluttered header */}
        <div className="rep-header">
          <div>
            <span className="rep-eyebrow">
              <BarChart3 size={13} /> Event Analytics
            </span>
            <h2 className="rep-title">Attendance Report</h2>
            <p className="rep-subtitle">Real-time attendance metrics and guest category breakdown.</p>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="rep-export-btn"
            title="Download CSV report of guest attendance"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <>
            <div className="rep-stats-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rep-skeleton-card" />
              ))}
            </div>
            <div className="rep-skeleton-table" />
          </>
        ) : stats ? (
          <>
            {/* Stat Cards Grid */}
            <div className="rep-stats-grid">
              {/* Total Guests */}
              <div className="rep-stat-card">
                <div className="rep-stat-top">
                  <div className="rep-icon-pill total" aria-hidden="true">
                    <Users size={20} />
                  </div>
                  <span className="rep-badge-subtle">Total</span>
                </div>
                <div className="rep-stat-main">
                  <span className="rep-stat-value">{totalGuests}</span>
                  <span className="rep-stat-label">Total guests</span>
                </div>
                <div className="rep-stat-foot">
                  <span>Registered guests</span>
                </div>
              </div>

              {/* Checked In / Arrived */}
              <div className="rep-stat-card">
                <div className="rep-stat-top">
                  <div className="rep-icon-pill arrived" aria-hidden="true">
                    <UserCheck size={20} />
                  </div>
                  <span className="rep-badge-subtle">Turnout</span>
                </div>
                <div className="rep-stat-main">
                  <span className="rep-stat-value arrived">{checkedIn}</span>
                  <span className="rep-stat-label">Arrived</span>
                </div>
                <div className="rep-stat-foot">
                  <span>{totalGuests > 0 ? `${attendanceRate}% verified` : 'Awaiting arrivals'}</span>
                </div>
              </div>

              {/* No-shows / Pending */}
              <div className="rep-stat-card">
                <div className="rep-stat-top">
                  <div className="rep-icon-pill pending" aria-hidden="true">
                    <Clock size={20} />
                  </div>
                  <span className="rep-badge-subtle">Pending</span>
                </div>
                <div className="rep-stat-main">
                  <span className="rep-stat-value pending">{remaining}</span>
                  <span className="rep-stat-label">No-shows</span>
                </div>
                <div className="rep-stat-foot">
                  <span>{totalGuests > 0 ? `${100 - attendanceRate}% remaining` : 'Awaiting arrivals'}</span>
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="rep-stat-card">
                <div className="rep-stat-top">
                  <div className="rep-icon-pill rate" aria-hidden="true">
                    <TrendingUp size={20} />
                  </div>
                  <span className="rep-badge-subtle">Overall</span>
                </div>
                <div className="rep-stat-main">
                  <span className="rep-stat-value rate">{attendanceRate}%</span>
                  <span className="rep-stat-label">Attendance rate</span>
                </div>
                <div className="rep-rate-progress-track" aria-hidden="true">
                  <div 
                    className="rep-rate-progress-fill" 
                    style={{ width: `${attendanceRate}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="rep-table-card">
              <div className="rep-table-header">
                <div className="rep-table-title-group">
                  <h3 className="rep-table-title">Category Breakdown</h3>
                  <span className="rep-count-badge">
                    {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                  </span>
                </div>
              </div>

              {categories.length === 0 ? (
                <div className="rep-empty-state">
                  <div className="rep-empty-icon" aria-hidden="true">
                    <Layers size={24} />
                  </div>
                  <h4 className="rep-empty-title">No Category Data</h4>
                  <p className="rep-empty-desc">
                    Guest categories and their check-in breakdown will appear here once attendees are added to this event.
                  </p>
                </div>
              ) : (
                <div className="rep-table-scroll">
                  <table className="rep-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th className="right">Total</th>
                        <th className="right">Checked In</th>
                        <th className="right">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => {
                        const catRate = c.total > 0 ? Math.round((c.checkedIn / c.total) * 100) : 0;
                        return (
                          <tr key={c.name}>
                            <td>
                              <div className="rep-category-cell">
                                <span 
                                  className="rep-cat-dot" 
                                  style={{ 
                                    backgroundColor: c.colorHex || '#6366f1',
                                    color: c.colorHex || '#6366f1'
                                  }} 
                                />
                                <span className="rep-cat-name">{c.name}</span>
                              </div>
                            </td>
                            <td className="right">{c.total}</td>
                            <td className="right">{c.checkedIn}</td>
                            <td className="right">
                              <div className="rep-rate-cell">
                                <span className="rep-rate-pct">{catRate}%</span>
                                <div className="rep-inline-progress-track" aria-hidden="true">
                                  <div 
                                    className="rep-inline-progress-bar" 
                                    style={{ 
                                      width: `${catRate}%`,
                                      backgroundColor: c.colorHex || '#6366f1'
                                    }} 
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
