import { mkdir, readFile, writeFile } from 'node:fs/promises'

const names = [
  'Copa Relámpago', 'Liga del Andén', 'Torneo La Cantera', 'Copa Nocturna', 'Desafío de Barrios', 'Liga Horizonte', 'Copa del Puente', 'Torneo La Banda', 'Liga del Parque', 'Copa Metropolitana', 'Desafío del Oeste', 'Torneo Bajo las Luces', 'Liga Costera', 'Copa La Tribuna', 'Torneo Buen Toque', 'Liga de Amigos', 'Copa del Sur', 'Desafío Norteño', 'Torneo La Esquina', 'Liga Central', 'Copa Barrial', 'Torneo Vuelta y Vuelta', 'Liga del Río', 'Desafío del Parque', 'Copa Semillero', 'Torneo Área Chica', 'Liga La Redonda', 'Copa Primer Palo', 'Desafío Amateur', 'Torneo Tiempo Extra', 'Liga de la Ribera', 'Copa Cancha Abierta', 'Torneo El Reencuentro', 'Liga Pura Pasión', 'Copa entre Barrios', 'Desafío de Campeones', 'Torneo La Gambeta', 'Copa Último Minuto',
]
const modalities = ['futbol_5', 'futbol_7', 'futbol_8', 'futbol_11']
const modalityNames = ['FÚTBOL 5', 'FÚTBOL 7', 'FÚTBOL 8', 'FÚTBOL 11']
const zones = [
  { id: 'palermo', label: 'PALERMO', address: 'Jerónimo Salguero 3450, CABA' },
  { id: 'belgrano', label: 'NÚÑEZ', address: 'Av. Crisólogo Larralde 999, CABA' },
  { id: 'vicente-lopez', label: 'VICENTE LÓPEZ', address: 'Juan Zufriategui 1251, Vicente López' },
  { id: 'san-isidro', label: 'SAN ISIDRO', address: 'Av. del Libertador 1081, Vicente López' },
  { id: 'moron', label: 'MORÓN', address: 'Av. Rivadavia 18000, Morón' },
]
const colors = [['#d7ff00', '#17191b'], ['#34d399', '#10221d'], ['#60a5fa', '#101c2d'], ['#fb923c', '#2a1710']]
const escapeSql = value => String(value).replaceAll("'", "''")
const records = names.map((base, index) => {
  const n = index + 1
  const zone = zones[index % zones.length]
  const modality = index % 4
  const statusGroup = index % 3
  const deadline = statusGroup === 0 ? `2027-0${1 + (index % 3)}-10` : statusGroup === 1 ? '2026-11-10' : '2026-10-20'
  const start = statusGroup === 2 ? '2026-11-01' : `2027-0${1 + (index % 3)}-${String(15 + (index % 12)).padStart(2, '0')}`
  const end = statusGroup === 2 ? '2026-12-20' : `2027-0${2 + (index % 3)}-${String(10 + (index % 15)).padStart(2, '0')}`
  const title = `${base} · ${modalityNames[modality]} · Demo ${String(n).padStart(2, '0')}`
  const slug = `demo-${String(n).padStart(2, '0')}`
  return { n, slug, title, zone, modality, deadline, start, end, price: 80000 + index * 7500, capacity: 12 + (index % 5) * 4 }
})

const sqlRows = records.map(r => `      ('${escapeSql(r.title)}', '${modalities[r.modality]}', '${r.zone.id}', '${r.deadline}', '${r.start}', '${r.end}', ${r.price}, ${r.capacity}, 'EVENTO FICTICIO PARA DEMO. Nombre, fechas, precio y cupo inventados.', 'Flyer y datos de demostración. Contactá al equipo del proyecto para esta demo.', '${r.zone.address}', 'torneosfandelfander', '5493434461286', 'demo://${r.slug}')`).join(',\n')
const seedPath = new URL('../supabase/seed.sql', import.meta.url)
let seed = await readFile(seedPath, 'utf8')
const marker = '-- BEGIN generated demo tournaments (38 rows)'
seed = seed.split(marker)[0].trimEnd()
seed += `\n\n${marker}\ndo $$\ndeclare\n  organizer_id uuid;\nbegin\n  select id into organizer_id from auth.users where lower(email) = lower('nicomarichal980@gmail.com');\n  if organizer_id is null then raise exception 'No existe nicomarichal980@gmail.com en auth.users de esta base.'; end if;\n  insert into public.tournaments (name, sport_modality, zone_id, inscription_deadline, start_date, end_date, price, capacity, description, rules, venue_address, contact_instagram, contact_whatsapp, source_url, user_id, verified_at)\n  select v.name, v.modality::public.sport_modality, v.zone_id, v.deadline::date, v.start_date::date, v.end_date::date, v.price, v.capacity, v.description, v.rules, v.address, v.instagram, v.whatsapp, v.source_url, organizer_id, now()\n  from (values\n${sqlRows}\n  ) as v(name, modality, zone_id, deadline, start_date, end_date, price, capacity, description, rules, address, instagram, whatsapp, source_url)\n  where not exists (select 1 from public.tournaments t where t.user_id = organizer_id and t.source_url = v.source_url);\nend;\n$$;\n`
await writeFile(seedPath, seed)

const outputDir = new URL('../public/demo-flyers/', import.meta.url)
await mkdir(outputDir, { recursive: true })
for (const r of records) {
  const [accent, background] = colors[r.modality]
  const safeTitle = r.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="${background}"/><path d="M0 680 800 170v830H0Z" fill="${accent}" opacity=".18"/><circle cx="620" cy="330" r="185" fill="none" stroke="${accent}" stroke-width="5" opacity=".65"/><circle cx="620" cy="330" r="112" fill="none" stroke="${accent}" stroke-width="3" opacity=".45"/><path d="M530 330h180M620 240v180" stroke="${accent}" stroke-width="4" opacity=".5"/><text x="54" y="92" fill="${accent}" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="7">MATCHMAKING · ${r.zone.label}</text><text x="54" y="500" fill="#fff" font-family="Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="5">${modalityNames[r.modality]}</text><text x="54" y="590" fill="#fff" font-family="Arial,sans-serif" font-size="58" font-weight="800">${safeTitle}</text><rect x="54" y="800" width="230" height="74" rx="5" fill="${accent}"/><text x="79" y="850" fill="${background}" font-family="Arial,sans-serif" font-size="36" font-weight="900" letter-spacing="5">DEMO</text><text x="54" y="940" fill="#fff" opacity=".7" font-family="Arial,sans-serif" font-size="20" letter-spacing="3">EVENTO Y DATOS FICTICIOS</text></svg>`
  await writeFile(new URL(`${r.slug}.svg`, outputDir), svg)
}
console.log(`Generados ${records.length} filas y ${records.length} flyers de demo.`)
