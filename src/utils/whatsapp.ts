// WhatsApp numbers are stored as Argentine mobiles in the format wa.me expects:
// 549 + area code (without 0) + number (without 15) = 13 digits.
// Same rule as the check on profile_contacts.whatsapp.

const STORED_FORMAT = /^549[0-9]{10}$/

// Returns the stored format, or null if the input can't be read unambiguously.
// The "15" prefix is not stripped: whether it belongs to the number depends on
// the area code length, so the form asks for the number without it instead.
export function normalizeWhatsapp(input: string): string | null {
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('549') && digits.length === 13) return digits
  if (digits.startsWith('54') && digits.length === 12) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) return `549${digits}`

  return null
}

// Area code + number, as the user typed it in the form (without 54 9).
export function toNationalNumber(stored: string): string {
  return STORED_FORMAT.test(stored) ? stored.slice(3) : stored
}

export function whatsappLink(stored: string, message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${stored}${text}`
}
