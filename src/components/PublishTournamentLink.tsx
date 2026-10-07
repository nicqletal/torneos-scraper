import Link from 'next/link'

// Lleva a Crear cuenta y, después de registrarse, al panel de organizador.
export const PUBLISH_TOURNAMENT_HREF = '/login?modo=registro&next=/mis-torneos'

// Link para captar organizadores. Va al pie del catálogo y en el footer, nunca
// en la barra superior (ver "Cuenta y acceso" en docs/decisiones-casos-de-uso.md).
export function PublishTournamentLink({ className }: { className?: string }) {
  return (
    <Link href={PUBLISH_TOURNAMENT_HREF} className={className}>
      ¿Organizás torneos? <span className="underline underline-offset-4">Publicalo</span>
    </Link>
  )
}
