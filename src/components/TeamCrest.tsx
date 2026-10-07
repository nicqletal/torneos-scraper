interface TeamCrestProps {
  name: string
  size?: 'sm' | 'lg'
}

// Placeholder crest with the team's initials. The uploaded crest (Storage)
// replaces it when that part of the module is built.
export function TeamCrest({ name, size = 'sm' }: TeamCrestProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

  const sizeClass = size === 'lg' ? 'w-28 h-28 text-5xl' : 'w-12 h-12 text-xl'

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-sm bg-brand-secondary border border-brand-border flex items-center justify-center font-display tracking-wider text-brand-lime`}
      aria-hidden
    >
      {initials}
    </div>
  )
}
