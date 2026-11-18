import Image from 'next/image'
import { UserRound } from 'lucide-react'
import { avatarSrc } from '@/utils/profile-avatar'

export function AdminUserAvatar({ url, name, size = 48 }: { url: string | null; name: string; size?: number }) {
  const src = avatarSrc(url, process.env.NEXT_PUBLIC_SUPABASE_URL!)
  return src ? (
    <Image src={src} alt={`Foto de ${name}`} width={size} height={size} className="rounded-sm object-cover shrink-0" />
  ) : (
    <span className="rounded-sm bg-brand-bg border border-brand-border flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <UserRound className="w-5 h-5 text-foreground/60" aria-hidden="true" />
    </span>
  )
}
