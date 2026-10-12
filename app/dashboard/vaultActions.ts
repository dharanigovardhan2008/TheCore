'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { EnvFile } from '@/lib/types'
// In lib/crypto, VaultVerifier and EncryptedData are interfaces
import { VaultVerifier, EncryptedData } from '@/lib/crypto'
import { logActivity } from './actions'
import { getEffectiveLimits } from '@/lib/plans'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, vault_verifier, plan, plan_expires_at, role')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  return data
}

export async function setupVaultVerifier(verifier: VaultVerifier) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Use upsert to handle case where profile doesn't exist yet
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { 
        id: user.id, 
        vault_verifier: verifier as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    )
    .select()

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Failed to save profile.')
  }
  revalidatePath('/dashboard')
}

export async function getEnvFiles(projectId?: string): Promise<EnvFile[]> {
  const supabase = await createClient()
  let query = supabase.from('env_files').select('*')
  
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as EnvFile[]) || []
}

async function assertCanCreateEnvFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string,
  fileName: string,
  id?: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle()

  const limits = getEffectiveLimits(profile?.plan, profile?.plan_expires_at)
  if (Number.isFinite(limits.maxEnvFilesPerProject)) {
    // If id or (projectId, fileName) exists, it is an update, not a new file
    let query = supabase.from('env_files').select('id').eq('project_id', projectId)
    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.eq('file_name', fileName)
    }
    const { data: existing } = await query.maybeSingle()

    if (!existing) {
      const { count } = await supabase
        .from('env_files')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      if ((count || 0) >= limits.maxEnvFilesPerProject) {
        throw new Error(
          `PLAN_LIMIT_REACHED: Free plan allows up to ${limits.maxEnvFilesPerProject} .env file per project. Upgrade to Pro for unlimited .env files.`
        )
      }
    }
  }
}

export async function upsertEnvFile(
  projectId: string,
  fileName: string,
  label: string | null,
  data: EncryptedData,
  version: string,
  id?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check plan limits before inserting new .env file
  await assertCanCreateEnvFile(supabase, user.id, projectId, fileName, id)

  const payload: any = {
    project_id: projectId,
    user_id: user.id,
    file_name: fileName,
    label: label,
    ciphertext: data.ciphertext,
    iv: data.iv,
    salt: data.salt,
    iterations: data.iterations,
    version: version,
    updated_at: new Date().toISOString()
  }

  if (id) {
    payload.id = id
  }

  const { error } = await supabase
    .from('env_files')
    .upsert(payload, { onConflict: 'project_id,file_name' })

  if (error) throw error

  await logActivity('env_updated', `Updated environment file: ${fileName}`, projectId)

  revalidatePath(`/dashboard/${projectId}`)
  revalidatePath('/dashboard/env')
}

export async function deleteEnvFile(id: string) {
  const supabase = await createClient()
  
  // Need to get project_id to log activity properly
  const { data } = await supabase.from('env_files').select('project_id').eq('id', id).single()
  
  const { error } = await supabase
    .from('env_files')
    .delete()
    .eq('id', id)

  if (error) throw error

  if (data?.project_id) {
    await logActivity('env_deleted', `Deleted environment file`, data.project_id)
    revalidatePath(`/dashboard/${data.project_id}`)
  }
  revalidatePath('/dashboard/env')
}
