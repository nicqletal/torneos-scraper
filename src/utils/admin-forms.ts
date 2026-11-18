export function validUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}
export function parseSettings(form: FormData) {
  const email = String(form.get('support_email') ?? '').trim()
  const title = String(form.get('help_title') ?? '').trim()
  const text = String(form.get('help_text') ?? '').trim()
  const url = String(form.get('help_url') ?? '').trim()
  const version = String(form.get('updated_at') ?? '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { ok: false as const, error: 'Revisá el correo de contacto.' }
  if (!title || title.length > 100 || text.length > 2000) return { ok: false as const, error: 'El título admite 100 caracteres y el texto, 2000.' }
  if (url) {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || url.length > 2048) throw new Error()
    } catch { return { ok: false as const, error: 'El enlace de ayuda debe ser una dirección HTTPS válida.' } }
  }
  if (!version || !Number.isFinite(Date.parse(version))) return { ok: false as const, error: 'Recargá la configuración antes de guardar.' }
  return { ok: true as const, fields: { p_email: email, p_title: title, p_text: text, p_url: url, p_updated_at: version } }
}
export function parseSuspension(form: FormData) {
  const userId = form.get('user_id'), rawDays = form.get('days')
  const reason = String(form.get('reason') ?? '').trim()
  if (!validUuid(userId) || !['7', '30', 'indefinida'].includes(String(rawDays)) || reason.length < 3 || reason.length > 500) return { ok: false as const, error: 'Elegí la cuenta responsable, la duración y un motivo de 3 a 500 caracteres.' }
  return { ok: true as const, fields: { userId, days: rawDays === 'indefinida' ? null : Number(rawDays), reason } }
}
export function passwordError(current: unknown, password: unknown, repeat: unknown): string | undefined {
  if (typeof current !== 'string' || !current) return 'Ingresá tu contraseña actual.'
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) return 'La contraseña nueva debe tener entre 8 y 128 caracteres.'
  if (password !== repeat) return 'Las contraseñas nuevas no coinciden.'
  if (password === current) return 'Elegí una contraseña distinta de la actual.'
}
