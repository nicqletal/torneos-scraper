import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Save, UserRound } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { ZoneSelect } from '@/components/ZoneSelect'
import { toNationalNumber } from '@/utils/whatsapp'
import { safeNextPath } from '@/utils/safe-next-path'
import { updateProfile } from './actions'

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/perfil')
  }

  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : undefined
  const saved = params.ok === '1'
  const next = typeof params.next === 'string' ? safeNextPath(params.next, '') : ''

  const [{ data: profile }, { data: contact }] = await Promise.all([
    supabase.from('profiles').select('display_name, zone_id, avatar_url').eq('id', user.id).single(),
    supabase.from('profile_contacts').select('whatsapp').eq('user_id', user.id).single(),
  ])

  const labelClass = 'text-xs font-semibold uppercase tracking-wider font-mono text-white/60'
  const inputClass =
    'px-3 py-2.5 bg-brand-bg border border-brand-border rounded-sm text-white text-sm focus:outline-none focus:border-brand-lime transition-colors'

  return (
    <div className="max-w-xl w-full mx-auto flex flex-col gap-8">
      <div className="border-b border-brand-border pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-brand-lime flex items-center justify-center text-brand-bg">
          <UserRound className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-4xl font-display tracking-wider text-white uppercase leading-none">Mi perfil</h1>
          <p className="text-white/50 text-xs mt-1">{user.email}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-brand-red/40 bg-brand-red/10 text-brand-red text-sm rounded-sm">
          {error}
        </div>
      )}
      {saved && (
        <div className="p-3 border border-brand-lime/40 bg-brand-lime/10 text-brand-lime text-sm rounded-sm">
          Perfil guardado.
        </div>
      )}
      {next && !error && !contact?.whatsapp && (
        <div className="p-3 border border-brand-border bg-brand-surface text-white/80 text-sm rounded-sm">
          Para seguir, cargá tu WhatsApp.
        </div>
      )}

      <form action={updateProfile} className="p-6 bg-brand-surface border border-brand-border rounded-sm flex flex-col gap-5">
        {next && <input type="hidden" name="next" value={next} />}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="avatar" className={labelClass}>Foto de perfil</label>
          {profile?.avatar_url && (
            <Image 
              src={profile.avatar_url} 
              alt="Tu avatar" 
              width={64} 
              height={64} 
              className="w-16 h-16 rounded-sm object-cover border border-brand-border mb-2" 
            />
          )}
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg, image/png, image/webp"
            className="text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-brand-secondary file:text-white file:font-mono file:cursor-pointer hover:file:bg-brand-border transition-colors border border-brand-border rounded-sm p-1"
          />
          <p className="text-xs text-white/50 mt-1">JPG, PNG o WebP. Máximo 2 MB.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="display_name" className={labelClass}>Nombre</label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            minLength={2}
            maxLength={50}
            defaultValue={profile?.display_name ?? ''}
            className={inputClass}
          />
          <p className="text-xs text-white/50 mt-1">Es público: lo ven todos en tu página de organizador.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="zone_id" className={labelClass}>Zona</label>
          <ZoneSelect id="zone_id" name="zone_id" defaultValue={profile?.zone_id} placeholder="Sin zona" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="whatsapp" className={labelClass}>WhatsApp</label>
          <div className="flex items-stretch">
            <span className="px-3 flex items-center bg-brand-secondary border border-r-0 border-brand-border rounded-l-sm text-white/50 text-sm font-mono">
              +54 9
            </span>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="numeric"
              placeholder="11 2345 6789"
              defaultValue={contact?.whatsapp ? toNationalNumber(contact.whatsapp) : ''}
              className={`${inputClass} flex-1 rounded-l-none`}
            />
          </div>
          <p className="text-xs text-white/50 mt-1">
            Código de área sin 0 y número sin 15. No es público: hace falta para crear un equipo o ser capitán, y
            solo lo ve el capitán rival cuando tienen un partido acordado.
          </p>
        </div>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center gap-2 py-3 px-6 bg-brand-lime hover:bg-white text-brand-bg font-display font-bold uppercase tracking-wider text-base rounded-sm transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Guardar
        </button>
      </form>
    </div>
  )
}
