export function pageFrame(pathname: string): 'access' | 'admin' | 'site' {
  if (['/login', '/login/', '/admin/login', '/admin/login/'].includes(pathname)) return 'access'
  return pathname === '/admin' || pathname.startsWith('/admin/') ? 'admin' : 'site'
}
