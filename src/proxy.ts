import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_LOGIN_PATH, isProtectedAdminPath } from '@/utils/admin-access'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- First layer: routes that require any session ---
  // Optimistic check only: each page and Server Action verifies the session again
  const pathname = request.nextUrl.pathname
  const adminRoute = isProtectedAdminPath(pathname)
  const protectedPrefixes = ['/crear-torneo', '/mis-torneos', '/perfil', '/crear-equipo', '/mis-equipos', '/partidos']
  const isProtectedRoute = adminRoute || protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  function redirectWithCookies(url: URL) {
    const response = NextResponse.redirect(url)
    // No perder cookies renovadas al redirigir desde el proxy.
    for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie)
    return response
  }

  if (!user && isProtectedRoute) {
    // Redirect to login page and preserve the original URL in the `next` query parameter
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = adminRoute ? ADMIN_LOGIN_PATH : '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return redirectWithCookies(loginUrl)
  }

  // --- Second layer: /admin requires the admin role ---
  // Calls is_admin(), a security-definer RPC that reads the `admins` table
  // without exposing it through the API. /admin/login is the public access form.
  if (user && adminRoute) {
    const { data: isAdmin, error } = await supabase.rpc('is_admin')
    if (error || isAdmin !== true) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = ADMIN_LOGIN_PATH
      homeUrl.search = ''
      homeUrl.searchParams.set('error', error ? 'unavailable' : 'denied')
      homeUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return redirectWithCookies(homeUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
