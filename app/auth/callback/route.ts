import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CURRENT_TERMS_VERSION } from '@/lib/legal'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookieOptions: {
          maxAge: 400 * 24 * 60 * 60,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        },
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore if called in unsupported context
            }
          },
        },
      }
    )
    
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (data?.user) {
      // Record terms acceptance on OAuth sign-in (By continuing you agree notice counts)
      await supabase
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            display_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url,
            terms_version: CURRENT_TERMS_VERSION,
            terms_accepted_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      // Check if new user (created within the last 30 seconds)
      const isNewUser = new Date(data.user.created_at).getTime() > Date.now() - 30000
      if (isNewUser) {
        return NextResponse.redirect(`${requestUrl.origin}/login?mode=complete_google_signup`)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
