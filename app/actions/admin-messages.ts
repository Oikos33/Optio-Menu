'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/is-admin'
import { revalidatePath } from 'next/cache'

export type MessageStatus = 'unread' | 'read' | 'replied' | 'archived'

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('contact_messages')
    .update({ status })
    .eq('id', messageId)

  if (error) return { error: error.message }

  revalidatePath('/admin/messages')
  return {}
}
