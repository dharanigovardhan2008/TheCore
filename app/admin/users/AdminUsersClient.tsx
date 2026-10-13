'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  User,
  Shield,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import LoadingOrb from '@/components/ui/LoadingOrb';
import {
  getAdminUsers,
  getAdminUserDetail,
  extendUserPro,
  revokeUserPro,
  toggleUserDisabled,
} from '../actions';

type AdminUserItem = Awaited<ReturnType<typeof getAdminUsers>>['users'][number];
type AdminUserDetail = Awaited<ReturnType<typeof getAdminUserDetail>>;

interface AdminUsersClientProps {
  initialUsers: AdminUserItem[];
  totalCount: number;
}

export default function AdminUsersClient({ initialUsers, totalCount }: AdminUsersClientProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [count, setCount] = useState(totalCount);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // User detail drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action mutation state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleFilter = async (s: string, p: string) => {
    try {
      setLoading(true);
      const res = await getAdminUsers({ search: s, plan: p, limit: 50 });
      setUsers(res.users);
      setCount(res.totalCount);
    } catch (err: unknown) {
      console.error('Filter error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    setActionMessage(null);
    try {
      const data = await getAdminUserDetail(userId);
      setUserDetail(data);
    } catch (err: unknown) {
      console.error('Failed to load user detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExtendPro = async (cycle: 'month' | 'year') => {
    if (!selectedUserId) return;
    const reason = prompt(`Reason for granting/extending Pro (${cycle === 'year' ? '12 Months' : '1 Month'}):`);
    if (!reason) return;

    try {
      setActionLoading(true);
      const res = await extendUserPro(selectedUserId, cycle, reason);
      setActionMessage(`Pro extended until ${new Date(res.newExpiry).toLocaleDateString()}`);
      // Refresh detail and list
      const updated = await getAdminUserDetail(selectedUserId);
      setUserDetail(updated);
      handleFilter(search, planFilter);
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to extend Pro');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokePro = async () => {
    if (!selectedUserId) return;
    const reason = prompt('Reason for revoking Pro subscription:');
    if (!reason) return;
    if (!confirm('Are you sure you want to downgrade this user to Free?')) return;

    try {
      setActionLoading(true);
      await revokeUserPro(selectedUserId, reason);
      setActionMessage('Pro subscription revoked.');
      const updated = await getAdminUserDetail(selectedUserId);
      setUserDetail(updated);
      handleFilter(search, planFilter);
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to revoke Pro');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDisabled = async (currentlyDisabled: boolean) => {
    if (!selectedUserId) return;
    const reason = prompt(`Reason for ${currentlyDisabled ? 're-enabling' : 'disabling'} account:`);
    if (!reason) return;
    if (!confirm(`Are you sure you want to ${currentlyDisabled ? 'enable' : 'disable'} this account?`)) return;

    try {
      setActionLoading(true);
      await toggleUserDisabled(selectedUserId, !currentlyDisabled, reason);
      setActionMessage(`Account ${currentlyDisabled ? 'enabled' : 'disabled'}.`);
      const updated = await getAdminUserDetail(selectedUserId);
      setUserDetail(updated);
      handleFilter(search, planFilter);
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to update account status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-[var(--text-content-secondary)] mt-1">
            Total registered: {count} accounts. Audit and manage plans.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-content-tertiary)]" />
          <input
            type="text"
            placeholder="Search by display name or user UUID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilter(e.target.value, planFilter);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-[var(--bg-surface)] border border-[var(--separator)] text-[var(--text-content)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-content-tertiary)]" />
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              handleFilter(search, e.target.value);
            }}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-[var(--bg-surface)] border border-[var(--separator)] text-[var(--text-content)] focus:outline-none"
          >
            <option value="all">All Plans</option>
            <option value="free">Free Starter</option>
            <option value="pro">TheCore Pro</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <LoadingOrb
              state="listening"
              size={64}
              label="Loading users..."
              sublabel="Fetching registered users from directory"
            />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--text-content-secondary)]">
            No users match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--separator)] bg-[var(--bg-grouped)] text-[var(--text-content-secondary)]">
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Plan</th>
                  <th className="py-3 px-4 font-semibold">Expiry Date</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Joined</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--separator)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-grouped)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--text-content)]">
                        {u.display_name || 'Anonymous User'}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--text-content-tertiary)] mt-0.5">
                        {u.id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          u.plan === 'pro'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-[var(--bg-grouped)] text-[var(--text-content-secondary)]'
                        }`}
                      >
                        {u.plan || 'free'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-content-secondary)]">
                      {u.plan_expires_at
                        ? new Date(u.plan_expires_at).toLocaleDateString()
                        : u.plan === 'pro'
                        ? 'Permanent'
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono uppercase text-[10px] text-[var(--text-content-secondary)]">
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.is_disabled ? (
                        <span className="text-red-500 font-semibold text-[10px]">Disabled</span>
                      ) : (
                        <span className="text-emerald-500 font-semibold text-[10px]">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-content-secondary)]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openUserDetail(u.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Slide-over / Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[var(--bg-surface)] border border-[var(--separator)] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--separator)] mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-base">User Inspection & Actions</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="p-1 rounded-lg hover:bg-[var(--bg-grouped)] text-[var(--text-content-secondary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !userDetail ? (
              <div className="py-16 text-center text-xs text-[var(--text-content-secondary)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Loading user details...
              </div>
            ) : (
              <div className="space-y-6">
                {actionMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{actionMessage}</span>
                  </div>
                )}

                {/* Identity & Plan Status */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--text-content-secondary)]">Plan</span>
                    <div className="font-bold text-sm uppercase mt-0.5">{userDetail.profile.plan || 'free'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--text-content-secondary)]">Expiry</span>
                    <div className="font-semibold text-xs mt-0.5 truncate">
                      {userDetail.profile.plan_expires_at
                        ? new Date(userDetail.profile.plan_expires_at).toLocaleDateString()
                        : '—'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--text-content-secondary)]">Projects</span>
                    <div className="font-bold text-sm mt-0.5">{userDetail.projectCount}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--text-content-secondary)]">.env Files</span>
                    <div className="font-bold text-sm mt-0.5">{userDetail.envFileCount}</div>
                  </div>
                </div>

                {/* Privacy Rule Banner */}
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-start gap-2.5">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Privacy Enforcement:</strong> Plaintext .env values and vault master passwords are client-encrypted with AES-256-GCM. Admins can never access or download decrypted file contents.
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="p-4 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-[var(--text-content-secondary)]">
                    Administrative Controls
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleExtendPro('month')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      +1 Month Pro
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleExtendPro('year')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      +1 Year Pro
                    </button>
                    {userDetail.profile.plan === 'pro' && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleRevokePro}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Revoke Pro
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleToggleDisabled(Boolean(userDetail.profile.is_disabled))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                        userDetail.profile.is_disabled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {userDetail.profile.is_disabled ? 'Enable Account' : 'Disable Account'}
                    </button>
                  </div>
                </div>

                {/* Orders History for this user */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-[var(--text-content-secondary)] mb-2">
                    Order History ({userDetail.orders.length})
                  </h4>
                  {userDetail.orders.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[var(--bg-grouped)] text-xs text-center text-[var(--text-content-secondary)]">
                      No order transactions for this user.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userDetail.orders.map((ord: NonNullable<AdminUserDetail['orders']>[number]) => (
                        <div
                          key={ord.id}
                          className="p-3 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-medium">{ord.cf_order_id}</span>
                            <span className="text-[11px] text-[var(--text-content-secondary)] ml-2">
                              {new Date(ord.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">₹{(ord.amount_paise / 100).toFixed(2)}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                ord.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

