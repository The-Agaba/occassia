import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { eventsApi } from '../api';
import type { EventStats } from '../types';
import EventTabs from '../components/EventTabs';
import { wsManager } from '../lib/websocket';
import type { ConnectionState } from '../lib/websocket';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import { formatDateTime } from '../lib/utils';
import { useUiStore } from '../store/uiStore';
import { WifiOff, RefreshCcw } from 'lucide-react';

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
  const showToast = useUiStore((s) => s.showToast);
  
  const statsSub = useRef<StompSubscription | null>(null);
  const checkinSub = useRef<StompSubscription | null>(null);

  const loadStats = () => {
    if (id) {
      eventsApi.stats(id)
        .then((r) => setStats(r.data))
        .catch((err: any) => showToast(err.response?.data?.message || 'Failed to load live stats', 'error'));
    }
  };

  useEffect(() => {
    loadStats(); // Load initial stats via REST
    if (!id) return;

    // Listen to WS connection state
    const unsubscribeState = wsManager.onStateChange((state) => {
      setConnState(state);
      
      if (state === 'CONNECTED') {
        // Safe to subscribe now
        statsSub.current = wsManager.subscribe(`/topic/stats/${id}`, (msg: IMessage) => {
          setStats(JSON.parse(msg.body));
        });
        checkinSub.current = wsManager.subscribe(`/topic/checkin/${id}`, (msg: IMessage) => {
          const data = JSON.parse(msg.body);
          setActivity((prev) => [
            { guestName: data.guestName, category: data.category, checkedInAt: data.checkedInAt },
            ...prev.slice(0, 19),
          ]);
        });
      } else {
        // Clear subs references when disconnected
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

  const chartData = stats?.byCategory.map((c) => ({
    name: c.name,
    value: c.checkedIn,
    color: c.colorHex,
  })) || [];

  const ConnectionStatusBanner = () => {
    if (connState === 'CONNECTED') return null;
    
    return (
      <div className={`mb-6 p-3 rounded-lg flex items-center gap-3 text-sm font-medium ${
        connState === 'DISCONNECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
        'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        {connState === 'DISCONNECTED' ? (
          <><WifiOff size={18} /> Live updates disconnected. Please check your network.</>
        ) : (
          <><RefreshCcw size={18} className="animate-spin" /> Reconnecting to live updates...</>
        )}
      </div>
    );
  };

  return (
    <div>
      <EventTabs />
      <div className="p-4 sm:p-8">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <h2 className="text-xl font-bold">Live Dashboard</h2>
          <div className="flex items-center gap-2 text-xs font-medium bg-white border px-3 py-1.5 rounded-full shadow-sm self-start sm:self-auto">
            {connState === 'CONNECTED' ? (
              <><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Live</>
            ) : connState === 'CONNECTING' || connState === 'RECONNECTING' ? (
              <><span className="w-2 h-2 rounded-full bg-amber-500" /> Connecting</>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-red-500" /> Offline</>
            )}
          </div>
        </div>

        <ConnectionStatusBanner />

        {stats && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="bg-white border rounded-xl p-6 text-center shadow-sm">
              <p className="text-3xl font-bold text-slate-900">{stats.totalGuests}</p>
              <p className="text-slate-500 text-sm mt-1">Total Invited</p>
            </div>
            <div className="bg-white border rounded-xl p-6 text-center shadow-sm">
              <p className="text-3xl font-bold text-emerald-600">{stats.checkedIn}</p>
              <p className="text-slate-500 text-sm mt-1">Checked In</p>
            </div>
            <div className="bg-white border rounded-xl p-6 text-center shadow-sm">
              <p className="text-3xl font-bold text-amber-600">{stats.remaining}</p>
              <p className="text-slate-500 text-sm mt-1">Remaining</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">By Category</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">No data yet</p>
            )}
          </div>

          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Recent Check-ins</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {activity.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Waiting for check-ins...</p>
              ) : (
                activity.map((a, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b last:border-0 hover:bg-slate-50 rounded px-2 transition-colors">
                    <div>
                      <p className="font-medium text-slate-900">{a.guestName}</p>
                      <p className="text-xs text-slate-500">{a.category}</p>
                    </div>
                    <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      {formatDateTime(a.checkedInAt).split(',')[1]}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
