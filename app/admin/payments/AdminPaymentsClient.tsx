'use client';

import { useState } from 'react';
import { Filter, Loader2, StickyNote } from 'lucide-react';
import LoadingOrb from '@/components/ui/LoadingOrb';
import { getAdminPayments, markOrderRefundNote } from '../actions';

type AdminPaymentItem = Awaited<ReturnType<typeof getAdminPayments>>['orders'][number];

interface AdminPaymentsClientProps {
  initialOrders: AdminPaymentItem[];
  totalCount: number;
}

export default function AdminPaymentsClient({ initialOrders, totalCount }: AdminPaymentsClientProps) {
  const [orders, setOrders] = useState<AdminPaymentItem[]>(initialOrders);
  const [count, setCount] = useState(totalCount);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const handleFilter = async (status: string) => {
    try {
      setLoading(true);
      setStatusFilter(status);
      const res = await getAdminPayments({ status, limit: 50 });
      setOrders(res.orders);
      setCount(res.totalCount);
    } catch (err: unknown) {
      console.error('Failed to filter payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRefundNote = async (orderId: string, cfOrderId: string) => {
    const note = prompt(`Add a refund / dispute note for order ${cfOrderId}:`);
    if (!note) return;

    try {
      await markOrderRefundNote(orderId, note);
      alert('Refund/audit note logged successfully.');
      handleFilter(statusFilter);
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to record refund note');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments & Orders</h1>
          <p className="text-sm text-[var(--text-content-secondary)] mt-1">
            Cashfree transaction records, checkout orders, and refund notes ({count} total).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-content-tertiary)]" />
          <select
            value={statusFilter}
            onChange={(e) => handleFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-[var(--bg-surface)] border border-[var(--separator)] text-[var(--text-content)] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="created">Created (Incomplete)</option>
            <option value="failed">Failed / Dropped</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center w-full">
            <LoadingOrb state="listening" size={64} />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--text-content-secondary)]">
            No payments found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--separator)] bg-[var(--bg-grouped)] text-[var(--text-content-secondary)]">
                  <th className="py-3 px-4 font-semibold">Cashfree Order ID</th>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Plan Cycle</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--separator)]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bg-grouped)] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium">
                      {o.cf_order_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--text-content)]">
                        {o.profiles?.display_name || 'Anonymous User'}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--text-content-tertiary)] mt-0.5">
                        {o.user_id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {o.billing_cycle === 'year' ? '12 Months' : '1 Month'}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      ₹{(o.amount_paise / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          o.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : o.status === 'created'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-content-secondary)]">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleAddRefundNote(o.id, o.cf_order_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--bg-grouped)] hover:bg-[var(--separator)] text-[var(--text-content-secondary)] transition-colors cursor-pointer"
                      >
                        <StickyNote className="w-3.5 h-3.5" /> Note
                      </button>
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

