import { createClient } from '@supabase/supabase-js';

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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    // In development or test environments where service role key isn't configured,
    // fallback to publishable key with a warning or throw in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in production environment.');
    }
  }

  return createClient(supabaseUrl, serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'mock-service-role-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

