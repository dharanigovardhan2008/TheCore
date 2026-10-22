'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient, hasServiceRoleKey } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { projectPath } from '@/lib/routes'
import { CURRENT_TERMS_VERSION } from '@/lib/legal'
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
  type BillingCycle
} from '@/lib/plans'
import {
  createCashfreeOrder,
  safeFetchCashfreeOrder,
  isValidIndianMobile
} from '@/lib/cashfree'
import { getDodoProductId, assertDodoProductPrice, createDodoCheckout, getDodoCheckoutSession, getDodoPayment, createDodoPortalLink } from '@/lib/dodo'
import { fulfillDodoPayment } from '@/lib/dodo-fulfill'
import { getSiteUrl } from '@/lib/site-url'
import {
  currencyFromCountry,
  providerForCurrency,
  isProviderAllowed,
  type PayProvider
} from '@/lib/currency'

const accents = ['pink', 'blue', 'orange'] as const;

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

export async function acceptTerms(version: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (version !== CURRENT_TERMS_VERSION) {
      return { success: false, message: 'These terms were updated. Please refresh the page and try again.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Please sign in again.' }

    // The user ID comes from the verified session, never from the client.
    // The server key is used so acceptance is saved even if the profile row is missing.
    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from('profiles')
      .upsert(
        { id: user.id, terms_version: version, terms_accepted_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
    if (error) {
      console.error('[Terms] could not save acceptance:', error.message)
      return { success: false, message: "We couldn't save your acceptance. Please try again." }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (err) {
    console.error('[Terms] failed:', (err as Error)?.message)
    return { success: false, message: "We couldn't save your acceptance. Please try again." }
  }
}

/**
 * Fetch current user plan, expiry date, limits, project count, and order history
 */
/** Cheap check used by the UI to show the "limit reached" popup before the create form opens. */
export async function getProjectLimitStatus(): Promise<{ atLimit: boolean; limit: number | null; count: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { atLimit: false, limit: null, count: 0 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', user.id)
    .maybeSingle()

  const limits = getEffectiveLimits(profile?.plan, profile?.plan_expires_at)
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const limit = Number.isFinite(limits.maxProjects) ? limits.maxProjects : null
  const used = count ?? 0
  return { atLimit: limit !== null && used >= limit, limit, count: used }
}

export async function getUserPlanAndUsage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, plan, plan_expires_at, role, plan_provider, polar_customer_id, cancel_at_period_end')
    .eq('id', user.id)
    .maybeSingle()

  const isPro = isProActive(profile?.plan, profile?.plan_expires_at)
  const limits = getEffectiveLimits(profile?.plan, profile?.plan_expires_at)

  const [{ count: projectCount }, { data: orders }, { data: planConfigs }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('plan_configs').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  return {
    plan: (isPro ? 'pro' : 'free') as 'free' | 'pro',
    plan_expires_at: profile?.plan_expires_at || null,
    isPro,
    role: profile?.role || 'user',
    projectCount: projectCount || 0,
    limits,
    orders: (orders || []) as Order[],
    planConfigs: (planConfigs || []) as any[],
    planProvider: (profile?.plan_provider ?? null) as 'cashfree' | 'polar' | 'dodo' | null,
    hasIntlCustomer: Boolean(profile?.polar_customer_id),
    cancelAtPeriodEnd: Boolean(profile?.cancel_at_period_end),
  }
}

/** Result of starting a checkout. Returned (not thrown) so messages survive production error masking. */
export type CheckoutSessionResult =
  | {
      ok: true
      provider: 'cashfree'
      orderId: string
      paymentSessionId: string
      environment: 'production' | 'sandbox'
      returnUrl: string
    }
  | { ok: true; provider: 'dodo'; orderId: string; checkoutUrl: string }
  | { ok: false; code: 'PHONE_REQUIRED' | 'ERROR'; message: string }

const GENERIC_CHECKOUT_ERROR = "We couldn't start your payment. Please try again or contact support."

/**
 * Server action: start a checkout. The SERVER decides provider and currency
 * (India -> Cashfree INR, everyone else -> Dodo Payments USD). The client may only request
 * a manual switch, which is validated here. Amounts come from plan_configs, never from the client.
 */
export async function createCheckoutSession(
  cycle: BillingCycle,
  options?: { provider?: PayProvider; phone?: string }
): Promise<CheckoutSessionResult> {
  try {
    if (cycle !== 'month' && cycle !== 'year') {
      return { ok: false, code: 'ERROR', message: 'Invalid billing cycle.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, code: 'ERROR', message: 'You must be signed in to upgrade.' }
    }
    if (!user.email) {
      return { ok: false, code: 'ERROR', message: 'Your account has no email address, which payments require.' }
    }
    if (!hasServiceRoleKey()) {
      console.error('[Checkout] SUPABASE_SERVICE_ROLE_KEY is not configured')
      return { ok: false, code: 'ERROR', message: GENERIC_CHECKOUT_ERROR }
    }

    // 1. Provider: from the request country, with a validated manual switch.
    const country = (await headers()).get('x-vercel-ip-country')
    const provider: PayProvider = options?.provider ?? providerForCurrency(currencyFromCountry(country))
    if (!isProviderAllowed(country, provider)) {
      return { ok: false, code: 'ERROR', message: 'INR payments are only available for customers in India. Please pay in USD.' }
    }

    // 2. Price from the database (server side).
    const { data: dbPlan } = await supabase
      .from('plan_configs')
      .select('price_month_rupees, price_year_rupees, price_month_usd, price_year_usd')
      .eq('id', 'pro')
      .maybeSingle()
    if (!dbPlan) {
      return { ok: false, code: 'ERROR', message: GENERIC_CHECKOUT_ERROR }
    }

    const siteUrl = getSiteUrl()
    const orderRef = `core_${user.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const adminDb = createAdminClient()
    const returnUrl = `${siteUrl}/billing/return?order_id=${orderRef}`
    const customerName = user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0]

    if (provider === 'cashfree') {
      const rupees = Number(cycle === 'year' ? dbPlan.price_year_rupees : dbPlan.price_month_rupees)
      if (!Number.isFinite(rupees) || rupees <= 0) {
        return { ok: false, code: 'ERROR', message: GENERIC_CHECKOUT_ERROR }
      }
      const phone = (options?.phone ?? user.user_metadata?.phone ?? '').toString().replace(/\D/g, '').slice(-10)
      if (!isValidIndianMobile(phone)) {
        return { ok: false, code: 'PHONE_REQUIRED', message: 'Enter your 10-digit mobile number to pay in INR.' }
      }

      const cfOrder = await createCashfreeOrder({
        orderId: orderRef,
        amountInRupees: rupees,
        customerId: user.id,
        customerName,
        customerEmail: user.email,
        customerPhone: phone,
        returnUrl,
        notifyUrl: `${siteUrl}/api/cashfree/webhook`,
        orderNote: `TheCore Pro (${cycle === 'year' ? '12 months' : '1 month'})`,
      })

      const { error } = await adminDb.from('orders').insert({
        user_id: user.id,
        plan_id: 'pro',
        billing_cycle: cycle,
        amount_paise: Math.round(rupees * 100),
        currency: 'INR',
        cf_order_id: orderRef,
        cf_payment_session_id: cfOrder.payment_session_id,
        status: 'created',
        provider: 'cashfree',
        product: 'core',
      })
      if (error) {
        console.error('[Checkout] Failed to store Cashfree order:', error.message)
        return { ok: false, code: 'ERROR', message: GENERIC_CHECKOUT_ERROR }
      }

      const environment = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox'
      return {
        ok: true,
        provider: 'cashfree',
        orderId: orderRef,
        paymentSessionId: cfOrder.payment_session_id,
        environment,
        returnUrl,
      }
    }

    // ---- Dodo Payments (USD) ----
    const usd = Number(cycle === 'year' ? dbPlan.price_year_usd : dbPlan.price_month_usd)
    if (!Number.isFinite(usd) || usd <= 0) {
      return { ok: false, code: 'ERROR', message: GENERIC_CHECKOUT_ERROR }
    }
    const cents = Math.round(usd * 100)
    const productId = getDodoProductId(cycle)
    await assertDodoProductPrice(productId, cents)

    const { error: insertError } = await adminDb.from('orders').insert({
      user_id: user.id,
      plan_id: 'pro',
      billing_cycle: cycle,
      amount_paise: cents,
      currency: 'USD',
      cf_order_id: orderRef,
      status: 'created',
      provider: 'dodo',
      product: 'core',
    })
    if (insertError) {
      console.error('[Checkout] Failed to store Dodo order:', insertError.message)
      return { ok: false, code: 'ERROR', message: GENERIC_CHECKOUT_ERROR }
    }

    try {
      const checkout = await createDodoCheckout({
        productId,
        userId: user.id,
        email: user.email,
        name: customerName,
        orderRef,
        cycle,
        returnUrl,
      })
      await adminDb.from('orders').update({ provider_checkout_id: checkout.sessionId }).eq('cf_order_id', orderRef)
      return { ok: true, provider: 'dodo', orderId: orderRef, checkoutUrl: checkout.url }
    } catch (err) {
      await adminDb.from('orders').update({ status: 'failed' }).eq('cf_order_id', orderRef)
      throw err
    }
  } catch (err) {
    console.error('[Checkout] Failed to start checkout:', (err as Error)?.message)
    return { ok: false, code: 'ERROR', message: GENERIC_CHECKOUT_ERROR }
  }
}

/**
 * Open the Dodo customer portal (cancel, update card, invoices) for international subscribers.
 * Uses the signed-in user's own stored customer ID, never a client-supplied one.
 */
export async function createCustomerPortalSession(): Promise<
  { ok: true; url: string } | { ok: false; message: string }
> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: 'Please sign in.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('polar_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile?.polar_customer_id) {
      return { ok: false, message: 'No international subscription found for this account.' }
    }

    const url = await createDodoPortalLink(profile.polar_customer_id, `${getSiteUrl()}/dashboard/settings/billing`)
    return { ok: true, url }
  } catch (err) {
    console.error('[Portal] failed:', (err as Error)?.message)
    return { ok: false, message: "We couldn't open the subscription portal. Please try again." }
  }
}

export type VerifyOrderReturnResult = {
  success: boolean
  orderStatus: 'paid' | 'pending' | 'failed' | 'expired'
  order?: Order | null
  errorMessage?: string
}

/**
 * Status check for the return page. Never throws.
 *  - Dodo: asks Dodo for the payment and calls the same idempotent fulfil function as the webhook.
 *  - Cashfree: re-checks the order with Cashfree, then calls the SAME idempotent fulfil function
 *    the webhook uses, so a duplicate webhook or a page refresh can never extend Pro twice.
 */
export async function verifyOrderReturn(orderId: string): Promise<VerifyOrderReturnResult> {
  try {
    const ref = (orderId || '').trim()
    if (!ref) {
      return { success: false, orderStatus: 'failed', errorMessage: 'Missing order reference ID.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, orderStatus: 'failed', errorMessage: 'Please sign in to view this payment.' }
    }

    // RLS limits this to the signed-in user's own orders.
    const { data: found } = await supabase
      .from('orders')
      .select('*')
      .eq('cf_order_id', ref)
      .eq('user_id', user.id)
      .maybeSingle()
    const order = found as Order | null
    if (!order) {
      return {
        success: false,
        orderStatus: 'failed',
        errorMessage: 'Order not found. If you completed payment, check your Billing page or contact support.',
      }
    }

    if (order.status === 'paid') return { success: true, orderStatus: 'paid', order }
    if (order.status === 'refunded' || order.status === 'partially_refunded') {
      return { success: false, orderStatus: 'failed', order, errorMessage: 'This payment was refunded.' }
    }
    if (order.status === 'expired') {
      return { success: false, orderStatus: 'expired', order, errorMessage: 'Payment session has expired. Please start checkout again.' }
    }
    if (order.status === 'failed') {
      return { success: false, orderStatus: 'failed', order, errorMessage: 'This payment did not complete.' }
    }

    // status === 'created'
    if (order.provider === 'dodo') {
      // Ask Dodo directly, so Pro activates even if the webhook is late or missed.
      // The same safe function as the webhook is used, so Pro is never extended twice.
      if (order.provider_checkout_id && hasServiceRoleKey()) {
        try {
          const session = await getDodoCheckoutSession(order.provider_checkout_id)
          if (session?.payment_id && session?.payment_status === 'succeeded') {
            const payment = await getDodoPayment(session.payment_id)
            const adminDb = createAdminClient()
            const result = await fulfillDodoPayment(adminDb, payment)
            revalidatePath('/dashboard', 'layout')
            revalidatePath('/dashboard/settings/billing')
            if (result === 'fulfilled' || result === 'duplicate') {
              return { success: true, orderStatus: 'paid', order: { ...order, status: 'paid', paid_at: order.paid_at ?? new Date().toISOString() } }
            }
            if (result === 'mismatch') {
              return { success: false, orderStatus: 'failed', order, errorMessage: 'Payment verification failed. Please contact support with your order ID.' }
            }
          }
        } catch (err) {
          console.error('[Billing Return] Dodo check failed:', (err as Error)?.message)
        }
      }
      return {
        success: false,
        orderStatus: 'pending',
        order,
        errorMessage: 'Payment received. Waiting for confirmation from our payment provider; this usually takes a few seconds.',
      }
    }

    // Cashfree: authoritative re-check
    const cfOrder = await safeFetchCashfreeOrder(order.cf_order_id)
    if (!cfOrder) {
      return { success: false, orderStatus: 'pending', order, errorMessage: 'Awaiting status confirmation from Cashfree. Please refresh in a moment.' }
    }

    if (cfOrder.order_status === 'PAID') {
      const adminDb = createAdminClient()
      const { data: result, error } = await adminDb.rpc('fulfill_payment', {
        p_provider: 'cashfree',
        p_order_ref: order.cf_order_id,
        p_provider_order_id: null,
        p_user_id: order.user_id,
        p_billing_cycle: order.billing_cycle,
        p_paid_amount: Math.round(Number(cfOrder.order_amount) * 100),
        p_currency: String(cfOrder.order_currency || '').toUpperCase(),
      })
      if (error) {
        console.error('[Billing Return] fulfill_payment failed:', error.message)
        return { success: false, orderStatus: 'pending', order, errorMessage: 'We are confirming your payment. Please refresh in a moment.' }
      }
      if (result === 'mismatch') {
        console.error('[Billing Return] AMOUNT MISMATCH - Pro NOT granted', order.cf_order_id)
        return { success: false, orderStatus: 'failed', order, errorMessage: 'Order verification failed due to an amount mismatch. Please contact support.' }
      }

      revalidatePath('/dashboard', 'layout')
      revalidatePath('/dashboard/settings/billing')
      revalidatePath('/billing/return')
      return { success: true, orderStatus: 'paid', order: { ...order, status: 'paid' } }
    }

    if (cfOrder.order_status === 'EXPIRED' || cfOrder.order_status === 'TERMINATED') {
      await createAdminClient().from('orders').update({ status: 'expired' }).eq('cf_order_id', order.cf_order_id).eq('status', 'created')
      return { success: false, orderStatus: 'expired', order: { ...order, status: 'expired' }, errorMessage: 'Payment session has expired. Please start checkout again.' }
    }

    return { success: false, orderStatus: 'pending', order, errorMessage: `Payment status is ${cfOrder.order_status}. Awaiting confirmation.` }
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
