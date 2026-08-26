'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextUrl = formData.get('next') as string || '/admin' // Default to /admin (mis torneos)

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // You could return an error object here to show in the UI, 
    // but for simplicity in this MVP we redirect with an error flag.
    redirect(`/login?error=Invalid Credentials&next=${encodeURIComponent(nextUrl)}`)
  }

  revalidatePath('/', 'layout')
  redirect(nextUrl)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextUrl = formData.get('next') as string || '/admin'

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=Error en registro&next=${encodeURIComponent(nextUrl)}`)
  }

  revalidatePath('/', 'layout')
  redirect(nextUrl)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
