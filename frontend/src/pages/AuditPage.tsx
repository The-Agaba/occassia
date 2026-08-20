import { useEffect, useState } from 'react';
import { auditApi } from '../api';
import type { AuditEntry } from '../types';
import { formatDateTime } from '../lib/utils';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    auditApi.org().then((r) => setLogs(r.data));
  }, []);

  const filtered = logs.filter(
    (l) =>
      !filter ||
      l.action.toLowerCase().includes(filter.toLowerCase()) ||
      l.entityType.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      <input
        placeholder="Filter by action or entity..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 px-3 py-2 border rounded-lg w-full max-w-md"
      />
      <div className="bg-white border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">Entity</th>
              <th className="text-left p-3">User</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3 text-slate-500 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                <td className="p-3 font-mono text-xs">{l.action}</td>
                <td className="p-3">{l.entityType} / {l.entityId.slice(0, 8)}...</td>
                <td className="p-3">{l.userName || 'System'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
