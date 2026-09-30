import { Clock } from 'lucide-react'
import { type VerificationAge, verificationStyles } from '@/utils/tournament-verification'

// Antigüedad de verificación con su color (al día, ámbar o rojo "sin
// confirmar"). Sin hooks, así que sirve tanto en Server como en Client Components.
export function VerificationBadge({ age, className = '' }: { age: VerificationAge; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-sm uppercase font-mono ${verificationStyles[age.level]} ${className}`}>
      <Clock className="w-3.5 h-3.5 shrink-0" />
      {age.label}
    </span>
  )
}
