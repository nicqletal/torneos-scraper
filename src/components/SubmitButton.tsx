'use client'

import { useFormStatus } from 'react-dom'

// Botón de envío que avisa mientras la Server Action corre: cambia el texto y
// se deshabilita, así nadie lo toca dos veces pensando que no pasó nada.
// useFormStatus lee el estado del <form> que lo contiene, por eso vive en su
// propio componente de cliente y la página puede seguir siendo de servidor.
export function SubmitButton({
  children,
  pendingLabel,
  className,
  formAction,
}: {
  children: React.ReactNode
  pendingLabel: React.ReactNode
  className: string
  formAction?: (formData: FormData) => void | Promise<void>
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:opacity-60 disabled:cursor-wait`}
    >
      {pending ? pendingLabel : children}
    </button>
  )
}
