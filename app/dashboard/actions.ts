'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient, hasServiceRoleKey } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { projectPath } from '@/lib/routes'
import {
  projectSchema,
  serviceSchema,
  todoSchema,
  ProjectFormData,
  ServiceFormData,
  TodoFormData
} from '@/lib/validations'
import type {
  Project,
  ProjectWithRelations,
  DashboardProject,
  Service,
  Todo,
  ActivityLog,
  Order
} from '@/lib/types'
import {
  getEffectiveLimits,
  isProActive,
  getPlanPriceInPaise,
  calculateNewExpiry,
  type BillingCycle
} from '@/lib/plans'
import {
  createCashfreeOrder,
  fetchCashfreeOrder,
  safeFetchCashfreeOrder
} from '@/lib/cashfree'

const accents = ['pink', 'blue', 'indigo', 'orange'] as const;

/**
 * Server-side guard to verify project limits based on user plan
 */
async function assertCanCreateProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle();

  const limits = getEffectiveLimits(profile?.plan, profile?.plan_expires_at);
  if (Number.isFinite(limits.maxProjects)) {
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking project count for plan limit:', error);
    } else if ((count || 0) >= limits.maxProjects) {
      throw new Error(
        `PLAN_LIMIT_REACHED: Free plan limit of ${limits.maxProjects} projects reached. Upgrade to Pro for unlimited projects.`
      );
    }
  }
}

export async function getProjects(options?: { showArchived?: boolean, includeArchived?: boolean }): Promise<DashboardProject[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
    .from('projects')
    .select('*, services(*), todos(id, done, due_date), env_files(id)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (options?.includeArchived) {
    // get all, don't filter by archived_at
  } else if (options?.showArchived) {
    query = query.not('archived_at', 'is', null)
  } else {
    query = query.is('archived_at', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('getProjects error:', error);
    throw new Error('Failed to fetch projects');
  }

  return (data || []) as DashboardProject[]
}

export async function getProject(id: string): Promise<ProjectWithRelations | null> {
  if (!id) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [projectRes, servicesRes, todosRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('services').select('*').eq('project_id', id),
    supabase.from('todos').select('*').eq('project_id', id).order('created_at', { ascending: false })
  ])

  if (projectRes.error) return null

  return {
    ...(projectRes.data as Project),
    services: (servicesRes.data || []) as Service[],
    todos: (todosRes.data || []) as Todo[],
  }
}

export async function createProject(data: ProjectFormData): Promise<Project> {
  const validated = projectSchema.parse(data)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check plan limits server-side
  await assertCanCreateProject(supabase, user.id)

  const accent = accents[Math.floor(Math.random() * accents.length)]

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      ...validated,
      user_id: user.id,
      accent: validated.accent || accent,
    })
    .select()
    .single()

  if (error) throw error

  await logActivity('project_created', `Created project ${project.name}`, project.id);

  revalidatePath('/dashboard')
  return project as Project
}

export async function createProjectWithServices(
  projectData: ProjectFormData, 
  servicesData: Omit<ServiceFormData, 'project_id'>[]
): Promise<Project> {
  const validatedProject = projectSchema.parse(projectData);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Check plan limits server-side
  await assertCanCreateProject(supabase, user.id);

  const accent = accents[Math.floor(Math.random() * accents.length)];

  // 1. Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      ...validatedProject,
      user_id: user.id,
      accent: validatedProject.accent || accent,
    })
    .select()
    .single();

  if (projectError) throw projectError;

  // 2. Create services
  if (servicesData.length > 0) {
    const servicesToInsert = servicesData.map(s => ({
      ...s,
      custom_kind: s.kind === 'other' ? s.custom_kind : null,
      project_id: project.id,
      user_id: user.id
    }));

    const { error: servicesError } = await supabase
      .from('services')
      .insert(servicesToInsert);
      
    if (servicesError) {
      console.error("Failed to insert services:", servicesError);
    }
  }

  await logActivity('project_created', `Created project ${project.name}`, project.id);

  revalidatePath('/dashboard');
  return project as Project;
}

export async function updateProject(id: string, data: ProjectFormData): Promise<Project> {
  const validated = projectSchema.parse(data)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: project, error } = await supabase
    .from('projects')
    .update({
      ...validated,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  await logActivity('project_updated', `Updated project ${project.name}`, project.id);

  revalidatePath('/dashboard')
  revalidatePath(projectPath(id));
  return project as Project
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: project } = await supabase.from('projects').select('name').eq('id', id).single()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  if (project) {
    await logActivity('project_deleted', `Deleted project ${project.name}`, id);
  }

  revalidatePath('/dashboard')
}

export async function getServices(projectId: string): Promise<Service[]> {
  if (!projectId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Service[]
}

export async function createService(data: ServiceFormData): Promise<Service> {
  const validated = serviceSchema.parse(data)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: service, error } = await supabase
    .from('services')
    .insert({
      ...validated,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath(projectPath(validated.project_id))
  return service as Service
}

export async function deleteService(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: service } = await supabase.from('services').select('project_id').eq('id', id).single()
  
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) throw error

  if (service) {
    revalidatePath(projectPath(service.project_id))
  }
}

export async function getTodos(projectId: string): Promise<Todo[]> {
  if (!projectId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Todo[]
}

export async function createTodo(
  projectOrData: string | TodoFormData,
  text?: string,
  priority: Todo['priority'] = 'med',
  dueDate?: string | null
): Promise<Todo> {
  let projectId: string;
  let todoText: string;
  let todoPriority: Todo['priority'] | null | undefined = priority;
  let todoDueDate: string | null | undefined = dueDate;

  if (typeof projectOrData === 'object') {
    projectId = projectOrData.project_id;
    todoText = projectOrData.text;
    todoPriority = projectOrData.priority || 'med';
    todoDueDate = projectOrData.due_date;
  } else {
    projectId = projectOrData;
    todoText = text || '';
  }

  const validated = todoSchema.parse({
    project_id: projectId,
    text: todoText,
    priority: todoPriority,
    due_date: todoDueDate
  })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: todo, error } = await supabase
    .from('todos')
    .insert({
      ...validated,
      user_id: user.id,
      done: false,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath(projectPath(projectId))
  revalidatePath('/dashboard/todos')
  return todo as Todo
}

export async function toggleTodo(id: string, done: boolean, projectId?: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('todos')
    .update({ done })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  if (projectId) {
    revalidatePath(projectPath(projectId))
  }
  revalidatePath('/dashboard/todos')
}

export async function deleteTodo(id: string, projectId?: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  if (projectId) {
    revalidatePath(projectPath(projectId))
  }
  revalidatePath('/dashboard/todos')
}

export async function getAllServices(): Promise<Service[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data as Service[]
}

export async function getAllTodos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*, projects(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data
}

export async function logActivity(action: string, summary: string, projectId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('activity_log').insert({
    user_id: user.id,
    project_id: projectId || null,
    action,
    summary
  })
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []

  return data as ActivityLog[]
}

export type ServiceUpdateData = (Omit<ServiceFormData, 'project_id'> & { id?: string });

export async function updateProjectWithServices(
  id: string,
  projectData: ProjectFormData, 
  servicesData: ServiceUpdateData[]
): Promise<Project> {
  const validatedProject = projectSchema.parse(projectData);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 1. Update project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .update({
      ...validatedProject,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (projectError) throw projectError;

  // 2. Manage services: get existing to diff
  const { data: existingServices } = await supabase
    .from('services')
    .select('id')
    .eq('project_id', id);

  const existingIds = (existingServices || []).map(s => s.id);
  const incomingIds = servicesData.filter(s => s.id).map(s => s.id as string);

  const idsToDelete = existingIds.filter(eid => !incomingIds.includes(eid));

  if (idsToDelete.length > 0) {
    await supabase.from('services').delete().in('id', idsToDelete);
  }

  const toInsert = servicesData.filter(s => !s.id).map(s => ({
    ...s,
    project_id: id,
    user_id: user.id,
    custom_kind: s.kind === 'other' ? s.custom_kind : null
  }));

  if (toInsert.length > 0) {
    await supabase.from('services').insert(toInsert);
  }

  const toUpdate = servicesData.filter(s => s.id);
  for (const s of toUpdate) {
    await supabase.from('services').update({
      kind: s.kind,
      custom_kind: s.kind === 'other' ? s.custom_kind : null,
      platform: s.platform,
      login_email: s.login_email
    }).eq('id', s.id).eq('project_id', id);
  }

  await logActivity('project_updated', `Updated project ${project.name}`, project.id);

  revalidatePath('/dashboard');
  revalidatePath(projectPath(id));
  return project as Project;
}

export async function duplicateProject(id: string): Promise<Project> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check plan limits before duplicating
  await assertCanCreateProject(supabase, user.id)

  // Get project
  const { data: original, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error

  const { id: _oldId, created_at, updated_at, archived_at, ...rest } = original

  const { data: newProject, error: insertError } = await supabase
    .from('projects')
    .insert({
      ...rest,
      name: `${original.name} (copy)`,
    })
    .select()
    .single()

  if (insertError) throw insertError

  // Duplicate services
  const { data: services } = await supabase.from('services').select('*').eq('project_id', id)
  if (services && services.length > 0) {
    const newServices = services.map(s => {
      const { id: _sId, created_at: _sc, ...sRest } = s
      return { ...sRest, project_id: newProject.id }
    })
    await supabase.from('services').insert(newServices)
  }

  // Duplicate todos
  const { data: todos } = await supabase.from('todos').select('*').eq('project_id', id)
  if (todos && todos.length > 0) {
    const newTodos = todos.map(t => {
      const { id: _tId, created_at: _tc, ...tRest } = t
      return { ...tRest, project_id: newProject.id }
    })
    await supabase.from('todos').insert(newTodos)
  }

  await logActivity('project_duplicated', `Duplicated project ${original.name}`, newProject.id);

  revalidatePath('/dashboard')
  return newProject as Project
}

export async function archiveProject(id: string, archive: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: project, error } = await supabase
    .from('projects')
    .update({
      archived_at: archive ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  
  await logActivity('project_archived', `${archive ? 'Archived' : 'Restored'} project ${project.name}`, project.id);

  revalidatePath('/dashboard')
  revalidatePath(projectPath(id));
}

export async function acceptTerms(version: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        terms_version: version,
        terms_accepted_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    )
    .select('terms_version')
    .single()

  if (error) {
    console.error('Failed to update terms acceptance:', error)
    throw error
  }

  if (data?.terms_version !== version) {
    throw new Error('Terms version update mismatch')
  }
  
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Fetch current user plan, expiry date, limits, project count, and order history
 */
export async function getUserPlanAndUsage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, plan, plan_expires_at, role')
    .eq('id', user.id)
    .maybeSingle()

  const isPro = isProActive(profile?.plan, profile?.plan_expires_at)
  const limits = getEffectiveLimits(profile?.plan, profile?.plan_expires_at)

  const [{ count: projectCount }, { data: orders }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return {
    plan: (isPro ? 'pro' : 'free') as 'free' | 'pro',
    plan_expires_at: profile?.plan_expires_at || null,
    isPro,
    role: profile?.role || 'user',
    projectCount: projectCount || 0,
    limits,
    orders: (orders || []) as Order[],
  }
}

/**
 * Server action to create a Cashfree Checkout Session.
 * Guaranteed to obtain amount strictly from lib/plans.ts.
 */
export async function createCheckoutSession(cycle: BillingCycle) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to upgrade.')
  }

  const amountPaise = getPlanPriceInPaise('pro', cycle)
  const amountRupees = amountPaise / 100

  // Dynamically resolve siteUrl to match active deployed domain
  let siteUrl = 'https://thecore.indevs.in'
  try {
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') || headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') || 'https'
    if (host && !host.includes('thecore.isroot.in')) {
      siteUrl = `${proto}://${host}`
    } else if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
      const configured = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, '')
      if (!configured.includes('thecore.isroot.in')) {
        siteUrl = configured
      }
    }
  } catch {
    if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
      const configured = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, '')
      if (!configured.includes('thecore.isroot.in')) {
        siteUrl = configured
      }
    }
  }

  siteUrl = siteUrl.replace(/\/+$/, '')
  const uniqueSuffix = Math.random().toString(36).substring(2, 8)
  const orderId = `order_${user.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}_${Date.now()}_${uniqueSuffix}`
  const returnUrl = `${siteUrl}/billing/return?order_id=${orderId}`

  const customerName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Subscriber'
  const customerPhone = user.user_metadata?.phone || (user as { phone?: string }).phone || '9876543210'

  const cfOrder = await createCashfreeOrder({
    orderId,
    amountInRupees: amountRupees,
    customerId: user.id,
    customerName,
    customerEmail: user.email || 'user@thecore.indevs.in',
    customerPhone,
    returnUrl,
    orderNote: `TheCore Pro Subscription (${cycle === 'year' ? '12 Months' : '1 Month'})`,
  })

  // Store created order in database:
  // Store orderId as cf_order_id so return_url query parameter and webhooks match reliably
  const orderRecord = {
    user_id: user.id,
    plan_id: 'pro',
    billing_cycle: cycle,
    amount_paise: amountPaise,
    currency: 'INR',
    cf_order_id: orderId,
    cf_payment_session_id: cfOrder.payment_session_id,
    status: 'created',
  };

  let dbError = null;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminDb = createAdminClient();
    const { error } = await adminDb.from('orders').insert(orderRecord);
    dbError = error;
  } else {
    const { error } = await supabase.from('orders').insert(orderRecord);
    dbError = error;
  }

  // If service role insert failed, try user client as fallback
  if (dbError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error: fallbackError } = await supabase.from('orders').insert(orderRecord);
    if (!fallbackError) {
      dbError = null;
    }
  }

  if (dbError) {
    console.error('Failed to store order in database:', dbError);
    const hint = !process.env.SUPABASE_SERVICE_ROLE_KEY
      ? ' (Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Add it from Supabase Dashboard > Project Settings > API)'
      : '';
    throw new Error(`Failed to initialize subscription order: ${dbError.message || 'Database error'}${hint}`);
  }

  const rawEnv = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase()
  const environment: 'production' | 'sandbox' = (rawEnv === 'production' || rawEnv === 'prod') ? 'production' : 'sandbox'

  return {
    orderId,
    cfOrderId: cfOrder.cf_order_id,
    paymentSessionId: cfOrder.payment_session_id,
    amountRupees,
    environment,
    returnUrl,
  }
}

export type VerifyOrderReturnResult = {
  success: boolean
  orderStatus: 'paid' | 'pending' | 'failed' | 'expired'
  order?: Order | null
  errorMessage?: string
}

/**
 * Server action to verify order return status authoritatively from Cashfree
 * Never throws uncaught exceptions to the client, preventing minified React errors.
 */
export async function verifyOrderReturn(orderId: string): Promise<VerifyOrderReturnResult> {
  try {
    if (!orderId || !orderId.trim()) {
      return {
        success: false,
        orderStatus: 'failed',
        errorMessage: 'Missing order reference ID.',
      }
    }

    const trimmedOrderId = orderId.trim()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Look up order with user client first (RLS safe) or adminDb
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedOrderId)
    const filterClause = isUuid
      ? `cf_order_id.eq.${trimmedOrderId},id.eq.${trimmedOrderId},cf_payment_session_id.eq.${trimmedOrderId}`
      : `cf_order_id.eq.${trimmedOrderId},cf_payment_session_id.eq.${trimmedOrderId}`

    let order: Order | null = null

    if (user) {
      const { data: userOrder } = await supabase
        .from('orders')
        .select('*')
        .or(filterClause)
        .eq('user_id', user.id)
        .maybeSingle()
      order = userOrder as Order | null
    }

    if (!order && hasServiceRoleKey()) {
      const adminDb = createAdminClient()
      const query = adminDb.from('orders').select('*').or(filterClause)
      if (user) {
        query.eq('user_id', user.id)
      }
      const { data: adminOrder } = await query.maybeSingle()
      order = adminOrder as Order | null
    }

    // Fallback: If order wasn't found by exact filter, check user's most recent order
    if (!order && user) {
      const { data: latestOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latestOrder) {
        order = latestOrder as Order | null
      }
    }

    // If order is still not found in database:
    if (!order) {
      return {
        success: false,
        orderStatus: 'failed',
        errorMessage: 'Order not found in database. If you completed payment, please check your Billing page or contact support.',
      }
    }

    // If order is ALREADY marked as paid in our database:
    if (order.status === 'paid') {
      const targetUserId = user?.id || order.user_id
      if (hasServiceRoleKey() && targetUserId) {
        try {
          const adminDb = createAdminClient()
          await adminDb.from('profiles').update({ plan: 'pro' }).eq('id', targetUserId)
        } catch {
          // Profile may already be updated
        }
      }
      return {
        success: true,
        orderStatus: 'paid',
        order,
      }
    }

    // 2. Authoritative verification from Cashfree PG API
    // Cashfree GET /pg/orders/{order_id} expects merchant order ID (order_...)
    const lookupId = trimmedOrderId.startsWith('order_') ? trimmedOrderId : order.cf_order_id
    let cfOrder = await safeFetchCashfreeOrder(lookupId)
    if (!cfOrder && lookupId !== order.cf_order_id) {
      cfOrder = await safeFetchCashfreeOrder(order.cf_order_id)
    }

    if (!cfOrder) {
      // If Cashfree order lookup returns null (e.g. transient network or pending propagation)
      return {
        success: false,
        orderStatus: 'pending',
        order,
        errorMessage: 'Awaiting status confirmation from Cashfree. Please refresh this page in a moment.',
      }
    }

    // 3. Strict security: verify order amount matches stored plan amount
    const expectedAmountRupees = order.amount_paise / 100
    const amountMatches = Math.abs(cfOrder.order_amount - expectedAmountRupees) < 1.0
    const isPaid = cfOrder.order_status === 'PAID' && amountMatches

    if (cfOrder.order_status === 'PAID' && !amountMatches) {
      console.error('Tampering detected: order amount does not match stored plan amount', {
        orderAmount: cfOrder.order_amount,
        expected: expectedAmountRupees,
      })
      return {
        success: false,
        orderStatus: 'failed',
        order,
        errorMessage: 'Order verification failed due to amount mismatch.',
      }
    }

    const targetUserId = user?.id || order.user_id
    const cycle = (order.billing_cycle || 'month') as BillingCycle

    if (isPaid) {
      let fulfilled = false

      // Method A: Admin client (if service role is available)
      if (hasServiceRoleKey()) {
        try {
          const adminDb = createAdminClient()

          // Mark order paid
          await adminDb.from('orders').update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          }).eq('id', order.id)

          // Fetch profile and extend Pro
          const { data: profile } = await adminDb
            .from('profiles')
            .select('plan, plan_expires_at')
            .eq('id', targetUserId)
            .single()

          const newExpiry = calculateNewExpiry(profile?.plan_expires_at, cycle)

          await adminDb.from('profiles').update({
            plan: 'pro',
            plan_expires_at: newExpiry.toISOString(),
          }).eq('id', targetUserId)

          await adminDb.from('payment_events').upsert({
            cf_order_id: order.cf_order_id,
            event_type: 'ORDER_RETURN_VERIFIED_PAID',
            payload: {
              verified_at: new Date().toISOString(),
              cf_order_id: order.cf_order_id,
              amount_paid: cfOrder.order_amount,
            },
          }, { onConflict: 'cf_order_id,event_type' })

          fulfilled = true
        } catch (adminErr) {
          console.warn('[Billing Return] Admin update encountered error, trying RPC fallback:', adminErr)
        }
      }

      // Method B: RPC fallback (fulfill_order_and_activate_pro)
      if (!fulfilled && targetUserId) {
        try {
          const { error: rpcError } = await supabase.rpc('fulfill_order_and_activate_pro', {
            p_order_id: order.cf_order_id,
            p_user_id: targetUserId,
            p_billing_cycle: cycle,
            p_amount_paise: order.amount_paise,
          })
          if (rpcError) {
            console.warn('[Billing Return] RPC error:', rpcError.message)
          } else {
            fulfilled = true
          }
        } catch (rpcErr) {
          console.warn('[Billing Return] RPC invocation exception:', rpcErr)
        }
      }

      revalidatePath('/dashboard')
      revalidatePath('/dashboard/settings/billing')
      revalidatePath('/billing/return')

      return {
        success: true,
        orderStatus: 'paid',
        order: {
          ...order,
          status: 'paid',
        },
      }
    } else if (cfOrder.order_status === 'EXPIRED') {
      if (hasServiceRoleKey()) {
        try {
          const adminDb = createAdminClient()
          await adminDb.from('orders').update({ status: 'expired' }).eq('id', order.id)
        } catch {
          // ignore
        }
      }
      return {
        success: false,
        orderStatus: 'expired',
        order: { ...order, status: 'expired' },
        errorMessage: 'Payment session has expired. Please initiate checkout again from the pricing page.',
      }
    }

    return {
      success: false,
      orderStatus: (cfOrder.order_status.toLowerCase() as 'pending' | 'failed') || 'pending',
      order,
      errorMessage: `Payment status is ${cfOrder.order_status}. Cashfree is awaiting confirmation.`,
    }
  } catch (err: unknown) {
    console.error('Unhandled error in verifyOrderReturn:', err)
    return {
      success: false,
      orderStatus: 'failed',
      errorMessage: 'An unexpected error occurred while verifying the payment. If you were charged, please check your billing settings or contact support.',
    }
  }
}

export async function getUserEmails(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('services')
    .select('login_email')
    .eq('user_id', user.id)

  if (error || !data) return []
  return Array.from(new Set(data.map(s => s.login_email).filter(Boolean)))
}
