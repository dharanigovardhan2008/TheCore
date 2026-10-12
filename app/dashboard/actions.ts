'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
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
  fetchCashfreeOrder
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thecore.indevs.in'
  const uniqueSuffix = Math.random().toString(36).substring(2, 8)
  const orderId = `order_${user.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}_${Date.now()}_${uniqueSuffix}`
  const returnUrl = `${siteUrl}/billing/return?order_id=${orderId}`

  const cfOrder = await createCashfreeOrder({
    orderId,
    amountInRupees: amountRupees,
    customerId: user.id,
    customerEmail: user.email || 'user@thecore.indevs.in',
    returnUrl,
    orderNote: `TheCore Pro Subscription (${cycle === 'year' ? '12 Months' : '1 Month'})`,
  })

  // Store created order in database using server-only admin client
  const adminDb = createAdminClient()
  const { error: dbError } = await adminDb.from('orders').insert({
    user_id: user.id,
    plan_id: 'pro',
    billing_cycle: cycle,
    amount_paise: amountPaise,
    currency: 'INR',
    cf_order_id: cfOrder.cf_order_id || orderId,
    cf_payment_session_id: cfOrder.payment_session_id,
    status: 'created',
  })

  if (dbError) {
    console.error('Failed to store order in database:', dbError)
    throw new Error('Failed to initialize subscription order.')
  }

  return {
    orderId,
    cfOrderId: cfOrder.cf_order_id,
    paymentSessionId: cfOrder.payment_session_id,
    amountRupees,
    environment: (process.env.CASHFREE_ENV || 'sandbox').toLowerCase(),
  }
}

/**
 * Server action to verify order return status authoritatively from Cashfree
 */
export async function verifyOrderReturn(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const adminDb = createAdminClient()
  const { data: order, error: orderError } = await adminDb
    .from('orders')
    .select('*')
    .or(`cf_order_id.eq.${orderId},id.eq.${orderId}`)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    throw new Error('Order not found.')
  }

  // Re-fetch authoritative status from Cashfree
  const cfOrder = await fetchCashfreeOrder(order.cf_order_id)
  const isPaid = cfOrder.order_status === 'PAID'

  if (isPaid && order.status !== 'paid') {
    // 1. Mark order paid
    await adminDb.from('orders').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    }).eq('id', order.id)

    // 2. Fetch current profile
    const { data: profile } = await adminDb
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', user.id)
      .single()

    const newExpiry = calculateNewExpiry(profile?.plan_expires_at, order.billing_cycle as BillingCycle)

    // 3. Upgrade user to Pro
    await adminDb.from('profiles').update({
      plan: 'pro',
      plan_expires_at: newExpiry.toISOString(),
    }).eq('id', user.id)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings/billing')
  } else if (!isPaid && cfOrder.order_status === 'EXPIRED') {
    await adminDb.from('orders').update({
      status: 'expired',
    }).eq('id', order.id)
  }

  return {
    orderStatus: isPaid ? 'paid' : (cfOrder.order_status.toLowerCase() as string),
    order: {
      ...order,
      status: isPaid ? 'paid' : order.status,
    },
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
