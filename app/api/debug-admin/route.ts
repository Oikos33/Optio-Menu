import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Temporary debug endpoint — remove after issue is resolved
export async function GET() {
  try {
    const supabase = await createClient()

    // Check session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        status: 'unauthenticated',
        error: userError?.message ?? 'no user in session',
      })
    }

    // Check platform_admins
    const { data: adminRow, error: adminError } = await (supabase as any)
      .from('platform_admins')
      .select('user_id, note, created_at')
      .eq('user_id', user.id)
      .maybeSingle()

    // Check all rows in platform_admins
    const { data: allAdmins, error: listError } = await (supabase as any)
      .from('platform_admins')
      .select('user_id, note')

    return NextResponse.json({
      status: adminRow ? 'admin' : 'not_admin',
      user: { id: user.id, email: user.email },
      adminRow,
      adminError: adminError?.message,
      allAdmins,
      listError: listError?.message,
    })
  } catch (e) {
    return NextResponse.json({ status: 'error', message: String(e) })
  }
}
