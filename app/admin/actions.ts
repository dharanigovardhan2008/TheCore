'use server';

import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { calculateNewExpiry, type BillingCycle } from '@/lib/plans';
import { revalidatePath } from 'next/cache';

// In-memory rate-limiter for administrative mutations (prevent accidental rapid fire)
const adminActionTimestamps = new Map<string, number[]>();

function checkRateLimit(adminId: string, limit: number = 20, windowMs: number = 60000) {
  const now = Date.now();
  const timestamps = (adminActionTimestamps.get(adminId) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    throw new Error('Admin rate limit reached. Please wait a moment before trying again.');
  }
  timestamps.push(now);
  adminActionTimestamps.set(adminId, timestamps);
}

/**
 * Server-only guard to verify that current user is an authenticated administrator.
 * Throws 404 (notFound) if not an admin.
 */
async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const adminDb = createAdminClient();
  const { data: profile } = await adminDb
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    notFound();
  }

  return { adminId: user.id, adminEmail: user.email, adminDb };
}

/**
 * Write a record into admin_audit_log.
 * Admins cannot edit or delete rows in this table.
 */
async function logAdminAction(
  adminDb: ReturnType<typeof createAdminClient>,
  adminId: string,
  action: string,
  targetUserId: string | null,
  details: Record<string, unknown>
) {
  await adminDb.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    details,
  });
}

/**
 * Fetch top-level platform overview metrics
 */
export async function getAdminOverviewStats() {
  const { adminDb } = await assertAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalUsers },
    { count: users7d },
    { count: users30d },
    { count: paidUsers },
    { count: totalProjects },
    { data: monthOrders },
    { data: recentSignups },
    { data: recentOrders },
  ] = await Promise.all([
    adminDb.from('profiles').select('*', { count: 'exact', head: true }),
    adminDb.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    adminDb.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    adminDb.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    adminDb.from('projects').select('*', { count: 'exact', head: true }),
    adminDb.from('orders').select('amount_paise').eq('status', 'paid').gte('paid_at', startOfMonth),
    adminDb
      .from('profiles')
      .select('id, display_name, plan, created_at, role')
      .order('created_at', { ascending: false })
      .limit(8),
    adminDb
      .from('orders')
      .select('id, cf_order_id, amount_paise, status, billing_cycle, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const revenuePaiseThisMonth = (monthOrders || []).reduce(
    (sum, o) => sum + (o.amount_paise || 0),
    0
  );

  return {
    totalUsers: totalUsers || 0,
    newUsers7d: users7d || 0,
    newUsers30d: users30d || 0,
    paidUsers: paidUsers || 0,
    totalProjects: totalProjects || 0,
    revenueThisMonthRupees: Math.round(revenuePaiseThisMonth / 100),
    recentSignups: recentSignups || [],
    recentOrders: recentOrders || [],
  };
}

/**
 * Fetch users with filtering and pagination
 */
export async function getAdminUsers(options?: {
  search?: string;
  plan?: string;
  limit?: number;
  offset?: number;
}) {
  const { adminDb } = await assertAdmin();

  let query = adminDb
    .from('profiles')
    .select('id, display_name, avatar_url, profession, workplace, plan, plan_expires_at, role, is_disabled, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.plan && options.plan !== 'all') {
    query = query.eq('plan', options.plan);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`display_name.ilike.${term},id.ilike.${term},profession.ilike.${term},workplace.ilike.${term}`);
  }

  const limit = options?.limit || 25;
  const offset = options?.offset || 0;

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    users: data || [],
    totalCount: count || 0,
  };
}

/**
 * Fetch detailed record for a specific user (counts only, NO env contents)
 */
export async function getAdminUserDetail(userId: string) {
  const { adminDb } = await assertAdmin();

  const [
    { data: profile },
    { count: projectCount },
    { count: envFileCount },
    { data: orders },
  ] = await Promise.all([
    adminDb.from('profiles').select('*').eq('id', userId).single(),
    adminDb.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    adminDb.from('env_files').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    adminDb.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);

  return {
    profile,
    projectCount: projectCount || 0,
    envFileCount: envFileCount || 0, // ONLY count, never contents!
    orders: orders || [],
  };
}

/**
 * Extend or grant a user's Pro subscription
 */
export async function extendUserPro(userId: string, cycle: BillingCycle, reason: string) {
  const { adminId, adminDb } = await assertAdmin();
  checkRateLimit(adminId);

  if (!reason || reason.trim().length < 4) {
    throw new Error('A valid reason (at least 4 characters) is required to grant or extend Pro.');
  }

  const { data: profile } = await adminDb
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single();

  const newExpiry = calculateNewExpiry(profile?.plan_expires_at, cycle);

  await adminDb.from('profiles').update({
    plan: 'pro',
    plan_expires_at: newExpiry.toISOString(),
  }).eq('id', userId);

  await logAdminAction(adminDb, adminId, 'extend_pro', userId, {
    cycle,
    reason,
    previous_expiry: profile?.plan_expires_at,
    new_expiry: newExpiry.toISOString(),
  });

  revalidatePath('/admin/users');
  return { success: true, newExpiry: newExpiry.toISOString() };
}

/**
 * Revoke a user's Pro subscription (downgrade to Free)
 */
export async function revokeUserPro(userId: string, reason: string) {
  const { adminId, adminDb } = await assertAdmin();
  checkRateLimit(adminId);

  if (!reason || reason.trim().length < 4) {
    throw new Error('A valid reason is required to revoke Pro access.');
  }

  const { data: profile } = await adminDb
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single();

  await adminDb.from('profiles').update({
    plan: 'free',
    plan_expires_at: null,
  }).eq('id', userId);

  await logAdminAction(adminDb, adminId, 'revoke_pro', userId, {
    reason,
    previous_plan: profile?.plan,
    previous_expiry: profile?.plan_expires_at,
  });

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Disable or re-enable a user account
 */
export async function toggleUserDisabled(userId: string, disabled: boolean, reason: string) {
  const { adminId, adminDb } = await assertAdmin();
  checkRateLimit(adminId);

  if (!reason || reason.trim().length < 4) {
    throw new Error('A valid reason is required to modify account status.');
  }

  await adminDb.from('profiles').update({
    is_disabled: disabled,
  }).eq('id', userId);

  await logAdminAction(adminDb, adminId, disabled ? 'disable_user' : 'enable_user', userId, {
    disabled,
    reason,
  });

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Fetch all payments with filtering
 */
export async function getAdminPayments(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const { adminDb } = await assertAdmin();

  let query = adminDb
    .from('orders')
    .select('*, profiles(id, display_name, avatar_url, profession, workplace)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  const limit = options?.limit || 30;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    orders: data || [],
    totalCount: count || 0,
  };
}

/**
 * Add a refund or audit note to an order
 */
export async function markOrderRefundNote(orderId: string, note: string) {
  const { adminId, adminDb } = await assertAdmin();
  checkRateLimit(adminId);

  if (!note || note.trim().length < 4) {
    throw new Error('A note of at least 4 characters is required.');
  }

  const { data: order } = await adminDb
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error('Order not found');

  await logAdminAction(adminDb, adminId, 'order_refund_note', order.user_id, {
    order_id: orderId,
    cf_order_id: order.cf_order_id,
    note,
  });

  revalidatePath('/admin/payments');
  return { success: true };
}

/**
 * Fetch immutable admin audit logs
 */
export async function getAdminAuditLogs(limit: number = 50) {
  const { adminDb } = await assertAdmin();

  const { data, error } = await adminDb
    .from('admin_audit_log')
    .select('*, profiles:admin_id(display_name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

