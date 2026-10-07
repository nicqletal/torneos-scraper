import Link from 'next/link'

// Apunta directo al panel de organizador. Con sesión, entra; sin sesión, el
// proxy manda a /login?next=/mis-torneos y esa pantalla abre Crear cuenta con
// el aviso de "Publicalo" (ver src/utils/login-screen.ts). Así el link sirve
// para los dos casos sin que el componente tenga que conocer la sesión.
export const PUBLISH_TOURNAMENT_HREF = '/mis-torneos'

// Link para captar organizadores. Va al pie del catálogo y en el footer, nunca
// en la barra superior (ver "Cuenta y acceso" en docs/decisiones-casos-de-uso.md).
export function PublishTournamentLink({ className }: { className?: string }) {
  return (
    <Link href={PUBLISH_TOURNAMENT_HREF} className={className}>
      ¿Organizás torneos? <span className="underline underline-offset-4">Publicalo</span>
    </Link>
  )
}
