export function navigationItems(hasSession: boolean, isAdmin: boolean) {
  const destination = (path: string) => hasSession ? path : `/login?next=${encodeURIComponent(path)}`
  return [
    { id: 'tournaments', label: 'Torneos', href: '/torneos', paths: ['/torneos'] },
    { id: 'teams', label: 'Mis equipos', href: destination('/mis-equipos'), paths: ['/mis-equipos', '/equipos', '/crear-equipo', '/unirse'] },
    { id: 'organizer', label: 'Soy organizador', href: destination('/mis-torneos'), paths: ['/mis-torneos', '/crear-torneo', '/panel'] },
    ...(hasSession && isAdmin ? [{ id: 'admin', label: 'Administración', href: '/admin', paths: ['/admin'] }] : []),
  ]
}

export function navigationIsActive(pathname: string, paths: string[]) {
  return paths.some(path => pathname === path || pathname.startsWith(`${path}/`))
}
