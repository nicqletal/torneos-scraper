import { createClient } from '@supabase/supabase-js'

// Cliente efímero: comprobar la contraseña no reemplaza las cookies ni la sesión AAL2 actual.
export async function verifyOwnPassword(url: string, key: string, email: string, password: string, userId: string, fetcher: typeof fetch = fetch) {
  const verifier = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: fetcher } })
  const { data, error } = await verifier.auth.signInWithPassword({ email, password })
  if (error || !data.user || data.user.id !== userId || !data.session) return false
  const { error: cleanupError } = await verifier.auth.signOut({ scope: 'local' })
  return !cleanupError
}
