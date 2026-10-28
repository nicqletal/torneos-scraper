'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { buenosAiresToday, parseRivalSearchForm } from '@/utils/rival-search-form'
import { parseCoordination, parseDropReason, parseRating, parseResult } from '@/utils/match-forms'

// Vuelve al panel con el mismo equipo y modalidad, y el error si lo hubo.
function backToPanel(teamId: unknown, modality: unknown, error?: string): never {
  const params = new URLSearchParams()
  if (typeof teamId === 'string' && teamId) params.set('equipo', teamId)
  if (typeof modality === 'string' && modality) params.set('modalidad', modality)
  if (error) params.set('error', error)
  redirect(`/partidos?${params}`)
}

// Publicar, agregar o sacar franjas y cancelar son el mismo guardado: el
// formulario manda el conjunto completo de franjas que quedan, y vacío cancela.
export async function saveRivalSearch(formData: FormData) {
  const teamId = formData.get('team_id')
  const modality = formData.get('modality')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const parsed = parseRivalSearchForm(formData, buenosAiresToday(new Date()))
  if (!parsed.ok) backToPanel(teamId, modality, parsed.error)

  // La RPC repite cada validación y además exige capitán actual, equipo no
  // disuelto y WhatsApp en el perfil.
  const { error } = await supabase.rpc('save_rival_search', {
    p_team_id: parsed.fields.team_id,
    p_modality: parsed.fields.modality,
    p_slots: parsed.fields.slots,
  })

  if (error) backToPanel(teamId, modality, rpcErrorMessage(error, 'No se pudo guardar la búsqueda. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToPanel(teamId, modality)
}

// Traduce el error de una RPC: P0001 = `raise exception` de la RPC, con un
// mensaje para el usuario; cualquier otro se loguea y se muestra uno genérico.
function rpcErrorMessage(error: { code: string; message: string }, fallback: string): string {
  if (error.code !== 'P0001') console.error(error)
  return error.code === 'P0001' ? `${error.message}.` : fallback
}

// "Proponer partido" en un compatible: la base calcula la parte en común de
// las dos franjas y avisa al capitán rival.
export async function sendProposal(formData: FormData) {
  const teamId = formData.get('team_id')
  const modality = formData.get('modality')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const { error } = await supabase.rpc('send_proposal', {
    p_slot_id: String(formData.get('slot_id') ?? ''),
    p_rival_slot_id: String(formData.get('rival_slot_id') ?? ''),
  })
  if (error) backToPanel(teamId, modality, rpcErrorMessage(error, 'No se pudo mandar la propuesta. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToPanel(teamId, modality)
}

// Rechazar (quien la recibe) o cancelar (quien la mandó) es la misma RPC con
// `p_accept` false: la base sabe de qué lado está cada uno.
export async function declineProposal(formData: FormData) {
  const teamId = formData.get('team_id')
  const modality = formData.get('modality')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const { error } = await supabase.rpc('respond_proposal', {
    p_proposal_id: String(formData.get('proposal_id') ?? ''),
    p_accept: false,
  })
  if (error) backToPanel(teamId, modality, rpcErrorMessage(error, 'No se pudo responder la propuesta. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToPanel(teamId, modality)
}

// "Aceptar" en la tarjeta recibida: nace el partido, se anulan las propuestas
// superpuestas de los dos equipos y los dos planteles reciben el aviso.
export async function acceptProposal(formData: FormData) {
  const teamId = formData.get('team_id')
  const modality = formData.get('modality')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const { error } = await supabase.rpc('respond_proposal', {
    p_proposal_id: String(formData.get('proposal_id') ?? ''),
    p_accept: true,
  })
  if (error) backToPanel(teamId, modality, rpcErrorMessage(error, 'No se pudo aceptar la propuesta. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToPanel(teamId, modality)
}

// Cuando un partido se puede haber cerrado (o se reveló una calificación),
// también cambia el historial público de los dos equipos. La acción solo
// conoce el partido, así que se revalidan todas las páginas de equipo.
function revalidateMatchClosed() {
  revalidatePath('/partidos')
  revalidatePath('/equipos/[id]', 'page')
}

// Vuelve a /partidos con el error de una acción de la fila del partido, que se
// muestra arriba de "Tus partidos" (no en el panel de Buscar rival).
function backToMatches(error?: string): never {
  redirect(error ? `/partidos?${new URLSearchParams({ error_partido: error })}` : '/partidos')
}

// Cargar, corregir o confirmar cancha y hora es la misma RPC: mandar los
// mismos valores que cargó el rival deja el partido Coordinado.
export async function coordinateMatch(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const parsed = parseCoordination(formData)
  if (!parsed.ok) backToMatches(parsed.error)

  const { error } = await supabase.rpc('coordinate_match', {
    p_match_id: parsed.fields.match_id,
    p_venue: parsed.fields.venue,
    p_start_at: parsed.fields.start_at,
  })
  if (error) backToMatches(rpcErrorMessage(error, 'No se pudo guardar la cancha y hora. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToMatches()
}

// "Vamos" en el "¿Van?": sin aviso. Si los dos lo dicen, queda Confirmado.
export async function confirmGoing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const { error } = await supabase.rpc('confirm_going', { p_match_id: String(formData.get('match_id') ?? '') })
  if (error) backToMatches(rpcErrorMessage(error, 'No se pudo confirmar. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToMatches()
}

// Tirar el partido (desde el menú ⋯ o "No vamos"). La base decide si suma
// falta (menos de 24 h para la hora de inicio) y avisa a los dos planteles.
export async function dropMatch(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const parsed = parseDropReason(formData)
  if (!parsed.ok) backToMatches(parsed.error)

  const { error } = await supabase.rpc('drop_match', {
    p_match_id: parsed.fields.match_id,
    p_reason: parsed.fields.reason,
  })
  if (error) backToMatches(rpcErrorMessage(error, 'No se pudo tirar el partido. Probá de nuevo.'))

  revalidateMatchClosed()
  backToMatches()
}

// "Pedir tirarlo de común acuerdo": mismo formulario y motivo que tirarlo, con
// otro botón. El partido sigue en pie hasta que el rival responda.
export async function requestMutualDrop(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const parsed = parseDropReason(formData)
  if (!parsed.ok) backToMatches(parsed.error)

  const { error } = await supabase.rpc('request_mutual_drop', {
    p_match_id: parsed.fields.match_id,
    p_reason: parsed.fields.reason,
  })
  if (error) backToMatches(rpcErrorMessage(error, 'No se pudo pedir. Probá de nuevo.'))

  revalidatePath('/partidos')
  backToMatches()
}

// Aceptar o rechazar el pedido de común acuerdo del rival, en la fila.
export async function answerMutualDrop(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const { error } = await supabase.rpc('answer_mutual_drop', {
    p_match_id: String(formData.get('match_id') ?? ''),
    p_accept: formData.get('accept') === 'true',
  })
  if (error) backToMatches(rpcErrorMessage(error, 'No se pudo responder. Probá de nuevo.'))

  revalidateMatchClosed()
  backToMatches()
}

// Cargar, corregir o confirmar el resultado ("Nosotros / Ellos"). Confirmar es
// mandar el del rival espejado. La base decide si queda Jugado y avisa.
export async function reportResult(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const parsed = parseResult(formData)
  if (!parsed.ok) backToMatches(parsed.error)

  const { error } = await supabase.rpc('report_result', {
    p_match_id: parsed.fields.match_id,
    p_goals_for: parsed.fields.goals_for,
    p_goals_against: parsed.fields.goals_against,
  })
  if (error) backToMatches(rpcErrorMessage(error, 'No se pudo cargar el resultado. Probá de nuevo.'))

  revalidateMatchClosed()
  backToMatches()
}

// "No vinieron": el rival tiene 48 h para responder "fuimos".
export async function reportNoShow(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const { error } = await supabase.rpc('report_no_show', { p_match_id: String(formData.get('match_id') ?? '') })
  if (error) backToMatches(rpcErrorMessage(error, 'No se pudo reportar. Probá de nuevo.'))

  revalidateMatchClosed()
  backToMatches()
}

// "Fuimos": la respuesta a un "no vinieron". El partido queda en conflicto.
export async function replyWent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const { error } = await supabase.rpc('reply_went', { p_match_id: String(formData.get('match_id') ?? '') })
  if (error) backToMatches(rpcErrorMessage(error, 'No se pudo responder. Probá de nuevo.'))

  revalidateMatchClosed()
  backToMatches()
}

// Calificar al rival: una vez, durante 7 días desde que quedó Jugado. La base
// avisa al que calificó primero cuando se revelan las dos.
export async function rateRival(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/partidos')

  const parsed = parseRating(formData)
  if (!parsed.ok) backToMatches(parsed.error)

  const { error } = await supabase.rpc('rate_rival', {
    p_match_id: parsed.fields.match_id,
    p_stars: parsed.fields.stars,
    p_comment: parsed.fields.comment,
  })
  if (error) backToMatches(rpcErrorMessage(error, 'No se pudo calificar. Probá de nuevo.'))

  revalidateMatchClosed()
  backToMatches()
}
