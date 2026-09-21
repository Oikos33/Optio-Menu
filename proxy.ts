import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  // 1. Run Supabase session refresh + auth guards
  const supabaseResponse = await updateSession(request)

  // 2. If Supabase redirected (unauthenticated admin/dashboard access), honour it
  if (supabaseResponse.status !== 200) {
    return supabaseResponse
  }

  // 3. Run next-intl locale routing
  const intlResponse = intlMiddleware(request)

  // 4. CRITICAL: copy any Supabase auth cookies (refreshed tokens) onto the
  //    intl response — without this the page server components can't read
  //    the session and requireAdmin() / auth checks silently fail.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie as any)
  })

  return intlResponse
}

export const config = {
  matcher: ['/((?!api|auth|trpc|_next|_vercel|.*\\..*).*)'],
}
