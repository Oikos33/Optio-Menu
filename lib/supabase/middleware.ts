import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: must call getUser() to keep session alive
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect dashboard routes
  const isDashboard = pathname.includes('/dashboard')
  if (isDashboard && !user) {
    const pathParts = pathname.split('/')
    const locale = pathParts[1] || 'en'
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = `/${locale}/login`
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect admin routes — auth check only (role check is in the server component)
  // Extract locale from path: /{locale}/admin/...
  const adminMatch = pathname.match(/^\/([^/]+)\/admin(\/|$)/)
  if (adminMatch && !user) {
    const locale = adminMatch[1]
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = `/${locale}/login`
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
