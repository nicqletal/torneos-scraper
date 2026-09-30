import { login, signup } from './actions'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'

// Los mismos estilos de campo que el formulario de torneo
const labelClass = 'font-display tracking-wider text-sm text-white/60 uppercase'
const inputClass =
  'px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-lime transition-colors'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const awaitedParams = await searchParams
  const error = awaitedParams.error as string | undefined
  const next = awaitedParams.next as string || '/admin'
  // The mode lives in the URL (not in client state) so the page stays a Server Component
  const isSignup = awaitedParams.modo === 'registro'
  const toggleHref = isSignup
    ? `/login?next=${encodeURIComponent(next)}`
    : `/login?modo=registro&next=${encodeURIComponent(next)}`

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="border-b border-brand-border pb-4 flex flex-col gap-2">
          <h1 className="text-5xl font-display tracking-wider font-bold text-white uppercase leading-none">
            {isSignup ? 'Crear cuenta' : 'Iniciar sesión'}
          </h1>
          <p className="text-white/60 text-xs tracking-wider uppercase font-mono">
            {isSignup ? 'Con tu cuenta publicás y manejás tus torneos.' : 'Entrá para cargar y manejar tus torneos.'}
          </p>
        </div>

        {error && (
          <p role="alert" className="px-4 py-3 border border-brand-red/40 bg-brand-red/5 text-brand-red text-sm rounded-sm">
            {error}
          </p>
        )}

        <form className="p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />

          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="display_name" className={labelClass}>Nombre</label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={50}
                className={inputClass}
                placeholder="Como te van a ver los demás"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              placeholder="tu@email.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={labelClass}>Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              // Le dice al gestor de contraseñas si tiene que sugerir una nueva o completar la guardada
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              className={inputClass}
            />
          </div>

          <SubmitButton
            formAction={isSignup ? signup : login}
            pendingLabel={isSignup ? 'Creando cuenta…' : 'Ingresando…'}
            className="press mt-2 w-full py-3 bg-brand-lime hover:bg-white text-brand-bg font-display font-bold uppercase tracking-wider text-lg rounded-sm cursor-pointer"
          >
            {isSignup ? 'Registrarme' : 'Ingresar'}
          </SubmitButton>
        </form>

        <p className="text-center text-sm text-white/60">
          {isSignup ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <Link href={toggleHref} className="font-medium text-white hover:text-brand-lime transition-colors">
            {isSignup ? 'Iniciá sesión' : 'Registrate'}
          </Link>
        </p>
      </div>
    </div>
  )
}
