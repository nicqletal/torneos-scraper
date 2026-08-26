import { login, signup } from './actions'
import { Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const awaitedParams = await searchParams
  const error = awaitedParams.error as string | undefined
  const next = awaitedParams.next as string || '/admin'

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
          <Trophy className="w-6 h-6 text-zinc-950" />
        </div>
        <span className="font-bold text-2xl tracking-tight text-white">Torneos Scraper</span>
      </Link>

      <div className="w-full max-w-sm p-8 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar sesión</h1>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-white/70 font-medium">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500 text-white transition-colors"
              placeholder="tu@email.com"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-white/70 font-medium">Contraseña</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500 text-white transition-colors"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button 
              formAction={login}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
            >
              Ingresar
            </button>
            <button 
              formAction={signup}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/80 font-medium rounded-lg transition-colors border border-white/10"
            >
              Registrarme
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
