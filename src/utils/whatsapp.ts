// Los WhatsApp se guardan como celulares argentinos en el formato que pide wa.me:
// 549 + código de área (sin 0) + número (sin 15) = 13 dígitos.
// Es la misma regla que el check de profile_contacts.whatsapp, y la usan el
// perfil y el contacto del torneo.

const STORED_FORMAT = /^549[0-9]{10}$/

// Lleva lo que escribió la persona al formato guardado. Devuelve null si no se puede.
// El "15" de celular se rechaza: después del código de área (11 15 1234 5678)
// no se sabe dónde termina el código, y sin código de área (15 1234 5678) falta
// el código. Ningún código de área argentino empieza con 15.
export function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')

  let local: string | null = null
  if (digits.length === 13 && digits.startsWith('549')) local = digits.slice(3)
  else if (digits.length === 12 && digits.startsWith('54')) local = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) local = digits.slice(1)
  else if (digits.length === 10) local = digits

  if (!local || local.startsWith('15')) return null
  return '549' + local
}

// Código de área + número, como lo escribe la persona en el formulario (sin 54 9).
export function toNationalNumber(stored: string): string {
  return STORED_FORMAT.test(stored) ? stored.slice(3) : stored
}

export function whatsappLink(stored: string, message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${stored}${text}`
}
