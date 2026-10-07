// Qué pantalla abre /login y si muestra el aviso de "Publicalo"
// (ver "Cuenta y acceso" en docs/decisiones-casos-de-uso.md).
// Es TypeScript puro para poder testearlo con `pnpm test`.

export type LoginMode = 'login' | 'signup'

export interface LoginScreen {
  mode: LoginMode
  showPublishNotice: boolean
}

// `next` tiene que venir ya validado por safeNextPath.
export function loginScreen(modo: unknown, next: string): LoginScreen {
  const toPanel = isOrganizerPanelPath(next)
  // El modo de la URL manda; sin modo, el que va al panel viene de "Publicalo"
  // y lo más probable es que todavía no tenga cuenta.
  const mode: LoginMode =
    modo === 'registro' ? 'signup' : modo === 'ingreso' ? 'login' : toPanel ? 'signup' : 'login'
  // El aviso habla de crear una cuenta: en Iniciar sesión no tiene sentido.
  return { mode, showPublishNotice: mode === 'signup' && toPanel }
}

// Link a una de las dos pantallas con el modo explícito, conservando el `next`.
export function loginHref(mode: LoginMode, next: string): string {
  const modo = mode === 'signup' ? 'registro' : 'ingreso'
  return `/login?modo=${modo}&next=${encodeURIComponent(next)}`
}

// El Panel de organizador: "Mis torneos" y todo lo que cuelga, más el alta de torneo.
function isOrganizerPanelPath(next: string): boolean {
  const pathname = next.split(/[?#]/)[0]
  return ['/mis-torneos', '/crear-torneo'].some(
    (root) => pathname === root || pathname.startsWith(`${root}/`)
  )
}
