import { createClient } from '@supabase/supabase-js';

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Server-only Supabase client initialized with the SERVICE ROLE key.
 * Used strictly for webhooks, admin panel operations, and server-side order fulfillment.
 * NEVER expose this or import it into client components.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient must only be invoked in server environments.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    console.warn('[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables. Admin capabilities requiring service role will fall back.');
  }

  return createClient(supabaseUrl, serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'mock-service-role-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

