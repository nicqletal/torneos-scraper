'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { authenticateAdmin } from '@/utils/supabase/admin-login'
import { ADMIN_LOGIN_PATH, adminDestination } from '@/utils/admin-access'

export async function loginAsAdmin(formData: FormData) {
  const next = adminDestination(formData.get('next'))
  const supabase = await createClient()
  const result = await authenticateAdmin(supabase, formData.get('email'), formData.get('password'))
  revalidatePath('/', 'layout')
  if (!result.ok) redirect(`${ADMIN_LOGIN_PATH}?error=${result.error}&next=${encodeURIComponent(next)}`)
  redirect(next)
}
