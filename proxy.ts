import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  // Run Supabase session refresh + auth guards first
  const supabaseResponse = await updateSession(request)

  // If Supabase middleware redirected (e.g. unauthenticated admin access), honour it
  if (supabaseResponse.status !== 200) {
    return supabaseResponse
  }

  // Otherwise run next-intl locale handling
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|auth|trpc|_next|_vercel|.*\\..*).*)'],
}
