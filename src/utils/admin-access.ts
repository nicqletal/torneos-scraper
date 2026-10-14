import { safeNextPath } from './safe-next-path.ts'

export const ADMIN_LOGIN_PATH = '/admin/login'
export function isAdminLogin(pathname: string) {
  return pathname === ADMIN_LOGIN_PATH || pathname === `${ADMIN_LOGIN_PATH}/`
}
export function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}
export function isProtectedAdminPath(pathname: string) {
  return isAdminPath(pathname) && !isAdminLogin(pathname)
}
export function adminDestination(next: unknown) {
  const destination = safeNextPath(next, '/admin')
  const pathname = new URL(destination, 'http://internal.invalid').pathname
  return isProtectedAdminPath(pathname) ? destination : '/admin'
}

export const ADMIN_ACCESS_ERRORS = {
  credentials: 'No pudimos iniciar sesión. Revisá tu email y contraseña.',
  denied: 'Tu cuenta no tiene acceso al Panel de administración.',
  unavailable: 'No pudimos verificar el acceso de administrador. Probá de nuevo.',
} as const

export function adminAccessError(code: unknown): string | undefined {
  return typeof code === 'string' && Object.hasOwn(ADMIN_ACCESS_ERRORS, code)
    ? ADMIN_ACCESS_ERRORS[code as keyof typeof ADMIN_ACCESS_ERRORS] : undefined
}
