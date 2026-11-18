'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createSupportThread(formData: FormData) {
  const subject = formData.get('subject')
  const body = formData.get('body')
  if (typeof subject !== 'string' || typeof body !== 'string' || subject.trim().length < 3 || subject.trim().length > 100 || body.trim().length < 1 || body.trim().length > 2000) redirect('/soporte?error=datos')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/soporte')
  const { data: id, error } = await supabase.rpc('create_support_thread', { p_subject: subject, p_body: body })
  if (error || !id) redirect('/soporte?error=guardar')
  revalidatePath('/soporte')
  revalidatePath('/admin/soporte')
  redirect(`/soporte/${id}`)
}

export async function sendSupportMessage(formData: FormData) {
  const id = formData.get('id')
  const body = formData.get('body')
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || typeof body !== 'string' || body.trim().length < 1 || body.trim().length > 2000) redirect('/soporte?error=datos')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/soporte')
  const isAdminContext = formData.get('context') === 'admin' && (await supabase.rpc('is_verified_admin')).data === true
  const destination = isAdminContext ? `/admin/soporte/${id}` : `/soporte/${id}`
  const { error } = await supabase.rpc('send_support_message', { p_thread_id: id, p_body: body })
  if (error) redirect(`${destination}?error=1`)
  revalidatePath('/soporte')
  revalidatePath('/admin/soporte')
  revalidatePath('/avisos')
  revalidatePath('/', 'layout')
  revalidatePath(destination)
  redirect(destination)
}

export async function closeSupportThread(formData: FormData) {
  const id = formData.get('id')
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) redirect('/soporte')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/soporte')
  const isAdminContext = formData.get('context') === 'admin' && (await supabase.rpc('is_verified_admin')).data === true
  const destination = isAdminContext ? `/admin/soporte/${id}` : `/soporte/${id}`
  const { error } = await supabase.rpc('close_support_thread', { p_thread_id: id })
  if (error) redirect(`${destination}?error=1`)
  revalidatePath('/soporte')
  revalidatePath('/admin/soporte')
  revalidatePath(destination)
  redirect(destination)
}
