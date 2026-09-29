'use client'

import type { ReactNode } from 'react'

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
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
