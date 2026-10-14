import type { SupabaseClient } from '@supabase/supabase-js'

type AdminLoginResult = { ok: true } | { ok: false; error: 'credentials' | 'denied' | 'unavailable' }

export async function authenticateAdmin(supabase: SupabaseClient, email: unknown, password: unknown): Promise<AdminLoginResult> {
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return { ok: false, error: 'credentials' }
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error || !data.user || !data.session) return { ok: false, error: 'credentials' }

  // La sesión recién autenticada determina el rol; ningún dato del formulario lo asigna.
  const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin')
  if (roleError) return { ok: false, error: 'unavailable' }
  if (isAdmin !== true) return { ok: false, error: 'denied' }
  return { ok: true }
}
