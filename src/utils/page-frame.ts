// Decide qué marco envuelve a cada ruta. Solo /admin se sale del sitio: tiene
// su propia sidebar. Las pantallas de acceso (/login, /admin/login) llevan la
// barra mínima como cualquier otra página.
export function pageFrame(pathname: string): 'admin' | 'site' {
  return pathname === '/admin' || pathname.startsWith('/admin/') ? 'admin' : 'site'
}
