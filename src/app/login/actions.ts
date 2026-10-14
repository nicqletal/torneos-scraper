'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { safeNextPath } from '@/utils/safe-next-path'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextUrl = safeNextPath(formData.get('next'))

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
  const displayName = ((formData.get('display_name') as string) || '').trim()
  const nextUrl = safeNextPath(formData.get('next'))

  // Same rule as the check on profiles.display_name. Validating here avoids
  // the generic "Database error saving new user" from the trigger.
  if (displayName.length < 2 || displayName.length > 50) {
    redirect(`/login?modo=registro&error=${encodeURIComponent('El nombre tiene que tener entre 2 y 50 caracteres')}&next=${encodeURIComponent(nextUrl)}`)
  }

  // display_name travels in the user metadata; the handle_new_user trigger
  // reads it to create the profile.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })

  if (error) {
    redirect(`/login?modo=registro&error=Error en registro&next=${encodeURIComponent(nextUrl)}`)
  }

  revalidatePath('/', 'layout')
  redirect(nextUrl)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  revalidatePath('/', 'layout')
  redirect('/')
}
