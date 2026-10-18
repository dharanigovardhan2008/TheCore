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
  Briefcase,
  Building,
  CreditCard,
} from 'lucide-react';
import LoadingOrb from '@/components/ui/LoadingOrb';
import {
  getAdminUsers,
  getAdminUserDetail,
  extendUserPro,
  revokeUserPro,
  toggleUserDisabled,
} from '../actions';
import { formatMinor } from '@/lib/currency';

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
          <div className="py-20 flex items-center justify-center w-full">
            <LoadingOrb state="listening" size={64} />
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
                  <th className="py-3 px-4 font-semibold">Profession & Workplace</th>
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
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-[var(--separator)] shrink-0 flex items-center justify-center">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.display_name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-500 uppercase">
                              {(u.display_name || 'U').charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--text-content)] truncate max-w-[160px] sm:max-w-xs">
                            {u.display_name || 'Anonymous User'}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--text-content-tertiary)] truncate max-w-[140px]">
                            {u.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--text-content)]">
                        {u.profession || '—'}
                      </div>
                      {u.workplace && (
                        <div className="text-[10px] text-[var(--text-content-secondary)] mt-0.5">
                          @ {u.workplace}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          u.plan === 'pro'
                            ? 'bg-blue-500/10 text-blue-600'
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
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors cursor-pointer"
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
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{actionMessage}</span>
                  </div>
                )}

                {/* User Profile Card */}
                <div className="flex items-start sm:items-center gap-4 p-4 rounded-2xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-blue-500/30 shrink-0 shadow-sm flex items-center justify-center">
                    {userDetail.profile.avatar_url ? (
                      <img
                        src={userDetail.profile.avatar_url}
                        alt={userDetail.profile.display_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-slate-500 uppercase">
                        {(userDetail.profile.display_name || 'U').charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base sm:text-lg text-[var(--text-content)]">
                        {userDetail.profile.display_name || 'Anonymous User'}
                      </h4>
                      <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600 font-semibold">
                        {userDetail.profile.role || 'user'}
                      </span>
                      {userDetail.profile.is_disabled ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 font-semibold">
                          Disabled
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-[var(--text-content-tertiary)] mt-0.5 select-all">
                      {userDetail.profile.id}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs">
                      {userDetail.profile.profession && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 font-medium">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{userDetail.profile.profession}</span>
                        </div>
                      )}
                      {userDetail.profile.workplace && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/70 text-[var(--text-content-secondary)] font-medium">
                          <Building className="w-3.5 h-3.5" />
                          <span>{userDetail.profile.workplace}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-[var(--text-content-secondary)]">
                        Joined: {new Date(userDetail.profile.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

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
                        : userDetail.profile.plan === 'pro'
                        ? 'Permanent'
                        : '—'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--text-content-secondary)]">Projects</span>
                    <div className="font-bold text-sm mt-0.5">{userDetail.projectCount}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--text-content-secondary)]">Subscriptions Taken</span>
                    <div className="font-bold text-sm mt-0.5 text-blue-600">
                      {userDetail.orders.length}
                    </div>
                  </div>
                </div>

                {/* Privacy Rule Banner */}
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs flex items-start gap-2.5">
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
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
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

                {/* Subscriptions & Orders Taken */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-content-secondary)]">
                        Subscriptions & Orders Taken ({userDetail.orders.length})
                      </h4>
                    </div>
                  </div>

                  {userDetail.orders.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[var(--bg-grouped)] border border-dashed border-[var(--separator)] text-xs text-center text-[var(--text-content-secondary)]">
                      No subscriptions or payment orders recorded for this user.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {userDetail.orders.map((ord: NonNullable<AdminUserDetail['orders']>[number]) => (
                        <div
                          key={ord.id}
                          className="p-3.5 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-[var(--text-content)]">
                                {ord.cf_order_id}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 capitalize">
                                {ord.billing_cycle === 'year' ? '12 Months Pro' : '1 Month Pro'}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--text-content-secondary)] flex items-center gap-2 flex-wrap">
                              <span>Created: {new Date(ord.created_at).toLocaleString()}</span>
                              {ord.paid_at && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 font-medium">
                                    Paid: {new Date(ord.paid_at).toLocaleString()}
                                  </span>
                                </>
                              )}
                            </div>
                            {ord.refund_note && (
                              <div className="text-[11px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                                Audit Note: {ord.refund_note}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span className="font-bold text-sm text-[var(--text-content)]">
                              {formatMinor(ord.amount_paise, ord.currency)}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize flex items-center gap-1 ${
                                ord.status === 'paid'
                                  ? 'bg-emerald-500/15 text-emerald-600'
                                  : ord.status === 'created'
                                  ? 'bg-amber-500/15 text-amber-600'
                                  : 'bg-red-500/15 text-red-600'
                              }`}
                            >
                              {ord.status === 'paid' && <CheckCircle className="w-3 h-3" />}
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

