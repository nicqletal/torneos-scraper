import Image from 'next/image'
import { crestSrc } from '@/utils/team-crest'

interface TeamCrestProps {
  name: string
  size?: 'sm' | 'lg'
  src?: string | null
}

// Escudo del bucket propio; sin imagen válida se muestran las iniciales.
export function TeamCrest({ name, size = 'sm', src }: TeamCrestProps) {
  const imageUrl = crestSrc(src ?? null, process.env.NEXT_PUBLIC_SUPABASE_URL!)
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

  const sizeClass = size === 'lg' ? 'w-28 h-28 text-5xl' : 'w-12 h-12 text-xl'

  return (
    <div
      className={`${sizeClass} overflow-hidden shrink-0 rounded-sm bg-brand-secondary border border-brand-border flex items-center justify-center font-display tracking-wider text-brand-lime`}
      aria-hidden
    >
      {imageUrl ? <Image src={imageUrl} alt="" width={size === 'lg' ? 112 : 48} height={size === 'lg' ? 112 : 48} className="w-full h-full object-cover" /> : initials}
    </div>
  )
}
