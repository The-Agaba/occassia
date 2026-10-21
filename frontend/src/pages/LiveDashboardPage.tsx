import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { eventsApi } from '../api';
import type { EventStats } from '../types';
import EventTabs from '../components/EventTabs';
import SEO from '../components/SEO';
import { wsManager } from '../lib/websocket';
import type { ConnectionState } from '../lib/websocket';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import { formatDateTime } from '../lib/utils';
import { useUiStore } from '../store/uiStore';
import { 
  Radio, 
  Users, 
  UserCheck, 
  Clock, 
  RefreshCw, 
  WifiOff, 
  Layers, 
  Check 
} from 'lucide-react';
import './LiveDashboardPage.css';

interface Activity {
  guestName: string;
  category: string;
  checkedInAt: string;
}

export default function LiveDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [connState, setConnState] = useState<ConnectionState>('DISCONNECTED');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const showToast = useUiStore((s) => s.showToast);
  
  const statsSub = useRef<StompSubscription | null>(null);
  const checkinSub = useRef<StompSubscription | null>(null);

  const loadStats = async (isManual = false) => {
    if (!id) return;
    if (isManual) setIsRefreshing(true);
    try {
      const res = await eventsApi.stats(id);
      setStats(res.data);
      if (isManual) showToast('Live metrics refreshed', 'success');
    } catch {
      if (isManual) showToast('Failed to refresh live metrics', 'error');
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    if (!id) return;

    const unsubscribeState = wsManager.onStateChange((state) => {
      setConnState(state);
      
      if (state === 'CONNECTED') {
        statsSub.current = wsManager.subscribe(`/topic/stats/${id}`, (msg: IMessage) => {
          try {
            setStats(JSON.parse(msg.body));
          } catch {
            // Ignore parse errors
          }
        });
        checkinSub.current = wsManager.subscribe(`/topic/checkin/${id}`, (msg: IMessage) => {
          try {
            const data = JSON.parse(msg.body);
            setActivity((prev) => [
              { guestName: data.guestName, category: data.category, checkedInAt: data.checkedInAt },
              ...prev.slice(0, 24),
            ]);
          } catch {
            // Ignore parse errors
          }
        });
      } else {
        statsSub.current = null;
        checkinSub.current = null;
      }
    });

    wsManager.connect();

    return () => {
      unsubscribeState();
      wsManager.disconnect();
    };
  }, [id]);

  const totalGuests = stats?.totalGuests ?? 0;
  const checkedIn = stats?.checkedIn ?? 0;
  const remaining = stats?.remaining ?? 0;
  const turnoutRate = totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0;
  const categories = stats?.byCategory ?? [];

  const formatActivityTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const formatted = formatDateTime(isoString);
      if (formatted.includes(',')) {
        return formatted.split(',')[1].trim();
      }
      return formatted;
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="ldb-page-wrapper">
      <SEO 
        title="Live Dashboard | Occassia" 
        description="Real-time entrance check-in monitoring and category turnout." 
        noIndex 
      />
      <EventTabs />

      <div className="ldb-container">
        {/* Disconnection Notice Banner */}
        {connState !== 'CONNECTED' && (
          <div 
            className="flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium bg-amber-500/10 text-amber-500 border-amber-500/25"
            role="status"
          >
            {connState === 'DISCONNECTED' ? (
              <>
                <WifiOff size={18} className="shrink-0" />
                <span>Live stream paused. Offline or reconnecting to live check-in events...</span>
              </>
            ) : (
              <>
                <RefreshCw size={18} className="animate-spin shrink-0" />
                <span>Connecting to live entrance stream...</span>
              </>
            )}
          </div>
        )}

        {/* Clean, uncluttered header */}
        <div className="ldb-header">
          <div>
            <span className="ldb-eyebrow">
              <Radio size={13} /> Real-Time Monitoring
            </span>
            <h2 className="ldb-title">Live Dashboard</h2>
            <p className="ldb-subtitle">Live entrance check-ins and category turnout progress.</p>
          </div>

          <div className="ldb-header-actions">
            {/* Live stream status indicator */}
            <div className="ldb-status-pill" title="WebSocket status">
              <span 
                className={`ldb-pulse-dot ${
                  connState === 'CONNECTED' 
                    ? 'live' 
                    : connState === 'CONNECTING' || connState === 'RECONNECTING' 
                    ? 'connecting' 
                    : 'offline'
                }`} 
              />
              <span>
                {connState === 'CONNECTED' 
                  ? 'Live' 
                  : connState === 'CONNECTING' || connState === 'RECONNECTING' 
                  ? 'Connecting' 
                  : 'Offline'}
              </span>
            </div>

            {/* Manual refresh button */}
            <button
              onClick={() => loadStats(true)}
              disabled={isRefreshing}
              className="ldb-refresh-btn"
              title="Refresh statistics"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Top 3 Stat Cards */}
        <div className="ldb-stats-grid">
          {/* Total Invited */}
          <div className="ldb-stat-card">
            <div className="ldb-stat-top">
              <div className="ldb-icon-pill total" aria-hidden="true">
                <Users size={20} />
              </div>
              <span className="ldb-badge-subtle">Total</span>
            </div>
            <div className="ldb-stat-main">
              <span className="ldb-stat-value">{totalGuests}</span>
              <span className="ldb-stat-label">Total invited</span>
            </div>
            <div className="ldb-stat-foot">
              <span>Registered on guest list</span>
            </div>
          </div>

          {/* Checked In */}
          <div className="ldb-stat-card">
            <div className="ldb-stat-top">
              <div className="ldb-icon-pill arrived" aria-hidden="true">
                <UserCheck size={20} />
              </div>
              <span className="ldb-badge-subtle">Verified</span>
            </div>
            <div className="ldb-stat-main">
              <span className="ldb-stat-value arrived">{checkedIn}</span>
              <span className="ldb-stat-label">Checked in</span>
            </div>
            <div className="ldb-stat-foot">
              <span>{totalGuests > 0 ? `${turnoutRate}% of guest list` : 'Awaiting check-ins'}</span>
            </div>
            <div className="ldb-progress-track" aria-hidden="true">
              <div 
                className="ldb-progress-fill" 
                style={{ width: `${turnoutRate}%` }} 
              />
            </div>
          </div>

          {/* Remaining */}
          <div className="ldb-stat-card">
            <div className="ldb-stat-top">
              <div className="ldb-icon-pill pending" aria-hidden="true">
                <Clock size={20} />
              </div>
              <span className="ldb-badge-subtle">Pending</span>
            </div>
            <div className="ldb-stat-main">
              <span className="ldb-stat-value pending">{remaining}</span>
              <span className="ldb-stat-label">Awaiting arrival</span>
            </div>
            <div className="ldb-stat-foot">
              <span>{totalGuests > 0 ? `${100 - turnoutRate}% remaining` : 'Awaiting check-ins'}</span>
            </div>
          </div>
        </div>

        {/* 2 Bottom Panels: Category Turnout & Recent Activity */}
        <div className="ldb-panels-grid">
          {/* Category Turnout Progress */}
          <div className="ldb-panel">
            <div className="ldb-panel-header">
              <div className="ldb-panel-title-group">
                <h3 className="ldb-panel-title">Category Turnout</h3>
                <span className="ldb-count-badge">
                  {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                </span>
              </div>
            </div>

            <div className="ldb-panel-body">
              {categories.length === 0 ? (
                <div className="ldb-empty-state">
                  <div className="ldb-empty-icon" aria-hidden="true">
                    <Layers size={22} />
                  </div>
                  <h4 className="ldb-empty-title">No Categories Found</h4>
                  <p className="ldb-empty-desc">
                    Guest categories configured for this event will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="ldb-category-list">
                  {categories.map((c) => {
                    const catRate = c.total > 0 ? Math.round((c.checkedIn / c.total) * 100) : 0;
                    const catColor = c.colorHex || '#6366f1';
                    return (
                      <div key={c.name} className="ldb-category-item">
                        <div className="ldb-category-row-top">
                          <div className="ldb-category-name-group">
                            <span 
                              className="ldb-cat-dot" 
                              style={{ 
                                backgroundColor: catColor, 
                                color: catColor 
                              }} 
                            />
                            <span className="ldb-cat-label">{c.name}</span>
                          </div>
                          <div className="ldb-category-counts">
                            <strong>{c.checkedIn}</strong>
                            <span>/ {c.total} arrived ({catRate}%)</span>
                          </div>
                        </div>
                        <div className="ldb-cat-track" aria-hidden="true">
                          <div 
                            className="ldb-cat-bar" 
                            style={{ 
                              width: `${catRate}%`, 
                              backgroundColor: catColor 
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Check-in Activity */}
          <div className="ldb-panel">
            <div className="ldb-panel-header">
              <div className="ldb-panel-title-group">
                <h3 className="ldb-panel-title">Entrance Activity</h3>
                <span className="ldb-count-badge">
                  {activity.length > 0 ? `${activity.length} Checked In` : 'Live Stream'}
                </span>
              </div>
            </div>

            <div className="ldb-panel-body">
              {activity.length === 0 ? (
                <div className="ldb-empty-state">
                  <div className="ldb-empty-icon" aria-hidden="true">
                    <Radio size={22} />
                  </div>
                  <h4 className="ldb-empty-title">Waiting for Check-ins</h4>
                  <p className="ldb-empty-desc">
                    When guests tap their NFC cards or scan QR codes at gates, arrivals will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="ldb-activity-scroll">
                  {activity.map((a, i) => {
                    const initial = (a.guestName || 'G').charAt(0).toUpperCase();
                    return (
                      <div key={i} className="ldb-activity-item">
                        <div className="ldb-guest-avatar" aria-hidden="true">
                          {initial}
                        </div>
                        <div className="ldb-activity-info">
                          <p className="ldb-guest-name">{a.guestName}</p>
                          <p className="ldb-guest-cat">{a.category || 'General'}</p>
                        </div>
                        <span className="ldb-time-badge">
                          <Check size={11} />
                          {formatActivityTime(a.checkedInAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
