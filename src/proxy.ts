import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
  const protectedPrefixes = ['/admin', '/crear-torneo', '/mis-torneos', '/perfil', '/crear-equipo', '/mis-equipos']
  const isProtectedRoute = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  if (!user && isProtectedRoute) {
    // Redirect to login page and preserve the original URL in the `next` query parameter
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // --- Second layer: /admin requires the admin role ---
  // Calls is_admin(), a security-definer RPC that reads the `admins` table
  // without exposing it through the API. Non-admins land on home silently.
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/'
      homeUrl.search = ''
      return NextResponse.redirect(homeUrl)
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
