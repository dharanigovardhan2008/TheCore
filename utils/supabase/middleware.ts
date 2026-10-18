import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-project.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "mock-anon-key",
    {
      cookieOptions: {
        maxAge: 400 * 24 * 60 * 60, // 400 days persistent cookie
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Dev-only bypass when no real Supabase project is configured. NEVER active in production.
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("mock-project")) {
    return supabaseResponse
  }

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Unauthenticated users trying to access protected dashboard routes -> redirect to /login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    // IMPORTANT: carry refreshed cookies onto redirect response so session state is preserved
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // 2. Signed-in users visiting auth pages or landing page -> redirect to /dashboard
  const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup'
  const isLandingRoot = request.nextUrl.pathname === '/' && !request.nextUrl.searchParams.has('preview')

  if (user && (isAuthPage || isLandingRoot)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    // Carry refreshed cookies onto redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}
