import { getAdminOverviewStats } from './actions';
import { Users, UserPlus, Zap, IndianRupee, FolderGit2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats();

  const metricCards = [
    {
      label: 'Total Registered Users',
      value: stats.totalUsers,
      sub: `${stats.newUsers7d} in last 7 days • ${stats.newUsers30d} in 30 days`,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Active Pro Subscriptions',
      value: stats.paidUsers,
      sub: `${stats.totalUsers > 0 ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1) : 0}% conversion rate`,
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Revenue (This Month)',
      value: `₹${stats.revenueThisMonthRupees}`,
      sub: 'Cashfree paid orders',
      icon: IndianRupee,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Projects Created',
      value: stats.totalProjects,
      sub: 'Across all user workspaces',
      icon: FolderGit2,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-sm text-[var(--text-content-secondary)] mt-1">
          High-level metrics, recent user registrations, and subscription volume.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-content-secondary)]">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight">{card.value}</div>
                <div className="text-[11px] text-[var(--text-content-secondary)] mt-1">{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-500" /> Recent Signups
            </h2>
            <Link
              href="/admin/users"
              className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[var(--separator)]">
            {stats.recentSignups.map((u: (typeof stats.recentSignups)[number]) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-[var(--text-content)]">
                    {u.display_name || 'Anonymous User'}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-content-secondary)] mt-0.5">
                    {u.id.slice(0, 8)}...
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      u.plan === 'pro'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-[var(--bg-grouped)] text-[var(--text-content-secondary)]'
                    }`}
                  >
                    {u.plan || 'free'}
                  </span>
                  <span className="text-[11px] text-[var(--text-content-tertiary)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-500" /> Recent Cashfree Orders
            </h2>
            <Link
              href="/admin/payments"
              className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-content-secondary)]">
              No orders recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--separator)]">
              {stats.recentOrders.map((o: (typeof stats.recentOrders)[number]) => (
                <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono text-[11px] font-medium">{o.cf_order_id}</div>
                    <div className="text-[11px] text-[var(--text-content-secondary)] mt-0.5 capitalize">
                      {o.billing_cycle === 'year' ? 'Annual Plan' : 'Monthly Plan'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{(o.amount_paise / 100).toFixed(2)}</div>
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded-full text-[10px] font-semibold capitalize mt-0.5 ${
                        o.status === 'paid'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : o.status === 'created'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

