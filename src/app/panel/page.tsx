import { redirect } from 'next/navigation'

// Conservamos los links anteriores; el Panel de organizador es "Mis torneos".
export default function PanelPage() {
  redirect('/mis-torneos')
}
