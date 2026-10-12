import { getAdminAuditLogs } from '../actions';
import { ShieldCheck } from 'lucide-react';

export default async function AdminAuditPage() {
  const logs = await getAdminAuditLogs(100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administrative Audit Log</h1>
          <p className="text-sm text-[var(--text-content-secondary)] mt-1">
            Immutable log of all administrative actions, subscription modifications, and refund notes.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--separator)] text-xs text-[var(--text-content-secondary)]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Tamper-evident system record</span>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--text-content-secondary)]">
            No administrative actions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--separator)] bg-[var(--bg-grouped)] text-[var(--text-content-secondary)]">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Admin</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Target User</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--separator)]">
                {logs.map((log: (typeof logs)[number]) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-grouped)] transition-colors">
                    <td className="py-3 px-4 text-[var(--text-content-secondary)] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {log.profiles?.display_name || log.admin_id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-grouped)] border border-[var(--separator)]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-content-secondary)]">
                      {log.target_user_id ? `${log.target_user_id.slice(0, 8)}...` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[var(--text-content-secondary)] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

