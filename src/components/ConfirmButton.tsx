'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

// Submit button that asks for confirmation first. Lives inside a <form action>.
export function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string
  className?: string
  children: ReactNode
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`ui-action ${className ?? ''} disabled:opacity-60 disabled:cursor-wait`}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {pending ? 'Procesando…' : children}
    </button>
  )
}
