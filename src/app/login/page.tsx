import { login, signup } from './actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Trophy, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { SubmitButton } from '@/components/SubmitButton'
import { safeNextPath } from '@/utils/safe-next-path'
import { loginHref, loginScreen } from '@/utils/login-screen'

// Los mismos estilos de campo que el formulario de torneo
const labelClass = 'font-sans tracking-wider text-sm text-foreground/60 uppercase'
const inputClass =
  'px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-brand-lime transition-colors'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const awaitedParams = await searchParams
  const error = typeof awaitedParams.error === 'string' ? awaitedParams.error : undefined
  // Se valida acá y también en la Server Action: el hidden input se puede editar
  const next = safeNextPath(awaitedParams.next, '/')
  // Con sesión no hay nada que hacer acá: se sigue al destino
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(next)
  // The mode lives in the URL (not in client state) so the page stays a Server Component
  // Qué pantalla se abre lo decide loginScreen: con `next` al Panel de organizador
  // y sin modo en la URL, Crear cuenta con el aviso de "Publicalo".
  const { mode, showPublishNotice } = loginScreen(awaitedParams.modo, next)
  const isSignup = mode === 'signup'
  // El link lleva siempre el modo explícito: si no, "Iniciá sesión" con `next`
  // al panel volvería a abrir Crear cuenta.
  const toggleHref = loginHref(isSignup ? 'login' : 'signup', next)

  return (
    <div className="min-h-[65vh] w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-x-16 items-center">
      <section className="hidden lg:flex flex-col gap-6 lg:col-start-1 lg:row-start-1" aria-labelledby="welcome-title">
        <p className="text-brand-lime font-semibold text-sm tracking-widest uppercase">Fútbol amateur · Buenos Aires</p>
        <h2 id="welcome-title" className="font-display text-5xl sm:text-6xl lg:text-7xl leading-none tracking-wide">
          Tu próximo torneo <span className="text-brand-lime">empieza acá.</span>
        </h2>
        <p className="text-foreground/75 text-base leading-relaxed max-w-md">
          Encontrá torneos por zona y modalidad. Con tu cuenta, armá tu equipo o gestioná los torneos que organizás.
        </p>
        <div className="grid gap-3 text-base">
          <div className="flex items-center gap-3"><Trophy className="w-5 h-5 text-brand-lime" aria-hidden="true" /><span>Explorá torneos cerca tuyo</span></div>
          <div className="flex items-center gap-3"><Users className="w-5 h-5 text-brand-lime" aria-hidden="true" /><span>Creá tu equipo y sumá a tu plantel</span></div>
        </div>
      </section>
      <section className="w-full max-w-md mx-auto flex flex-col gap-4 sm:gap-5 lg:col-start-2 lg:row-start-1" aria-label="Acceso a tu cuenta">
        <div className="border-b border-brand-border pb-4 flex flex-col gap-2">
          <h1 className="text-5xl font-display tracking-wider font-bold text-foreground uppercase leading-none">
            {isSignup ? 'Crear cuenta' : 'Iniciar sesión'}
          </h1>
          <p className="text-foreground/60 text-sm tracking-wider uppercase font-sans">
            {isSignup
              ? 'Con tu cuenta publicás torneos, armás tu equipo y buscás rival.'
              : 'Entrá para seguir con tus torneos, tus equipos y tus partidos.'}
          </p>
        </div>

        {showPublishNotice && (
          <p className="px-4 py-3 border border-brand-lime/40 bg-brand-lime/5 text-foreground text-sm rounded-sm">
            Para publicar un torneo necesitás una cuenta. Es gratis.
          </p>
        )}

        {error && (
          <p role="alert" className="px-4 py-3 border border-brand-red/40 bg-brand-red/5 text-brand-red text-sm rounded-sm">
            {error}
          </p>
        )}

        <form className="p-5 sm:p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />

          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="display_name" className={`ui-label ${labelClass}`}>Nombre</label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={50}
                className={`ui-input ${inputClass}`}
                placeholder="Como te van a ver los demás"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={`ui-label ${labelClass}`}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`ui-input ${inputClass}`}
              placeholder="tu@email.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={`ui-label ${labelClass}`}>Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              // Le dice al gestor de contraseñas si tiene que sugerir una nueva o completar la guardada
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              className={`ui-input ${inputClass}`}
            />
          </div>

          <SubmitButton
            formAction={isSignup ? signup : login}
            pendingLabel={isSignup ? 'Creando cuenta…' : 'Ingresando…'}
            className="ui-action press mt-2 w-full py-3 bg-brand-lime hover:bg-foreground text-brand-bg font-display font-bold uppercase tracking-wider text-lg rounded-sm cursor-pointer"
          >
            {isSignup ? 'Registrarme' : 'Ingresar'}
          </SubmitButton>
        </form>

        <p className="text-center text-sm text-foreground/60">
          {isSignup ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <Link href={toggleHref} className="font-medium text-foreground hover:text-brand-lime transition-colors">
            {isSignup ? 'Iniciá sesión' : 'Registrate'}
          </Link>
        </p>
        <Link href="/admin/login" className="ui-action justify-center text-sm text-foreground/60 hover:text-brand-lime">Acceso de administrador</Link>
      </section>
    </div>
  )
}
