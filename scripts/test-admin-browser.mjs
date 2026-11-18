import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createHmac, randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

// Nunca se ejecuta contra la base compartida ni usa sus credenciales.
const api = process.env.ADMIN_TEST_API_URL
if (!api || !['127.0.0.1', 'localhost'].includes(new URL(api).hostname)) throw new Error('Este escenario exige Supabase local')
const localKey = process.env.ADMIN_TEST_SERVICE_KEY
const require = createRequire(`${process.env.ADMIN_E2E_MODULES}/package.json`)
const { chromium } = require('playwright')
const db = createClient(api, localKey, { auth: { persistSession: false, autoRefreshToken: false } })
const password = 'Prueba-Administracion-2026!'
const newPassword = 'Prueba-Administracion-Actualizada-2026!'
const suffix = randomUUID().slice(0, 8)
async function result(promise) { const r = await promise; if (r.error) throw new Error(r.error.message); return r.data }
async function account(name) {
 const email = `${name}-${suffix}@example.org`
 const { user } = await result(db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: `Prueba ${name}` } }))
 return { id: user.id, email }
}
const admin = await account('administrador'), reporter = await account('jugador'), captain = await account('capitan'), rival = await account('rival')
await result(db.from('admins').insert({ user_id: admin.id }))
const teams = await result(db.from('teams').insert([{ name: `Prueba A ${suffix}`, zone_id: 'palermo', modality: 'futbol_5', level: 'recreativo' }, { name: `Prueba B ${suffix}`, zone_id: 'palermo', modality: 'futbol_5', level: 'recreativo' }]).select('id,name'))
await result(db.from('team_members').insert([{ team_id: teams[0].id, user_id: captain.id, is_captain: true }, { team_id: teams[0].id, user_id: reporter.id, is_captain: false }, { team_id: teams[1].id, user_id: rival.id, is_captain: true }]))
const at = (hours) => new Date(Date.now() + hours * 3600000).toISOString()
const [match] = await result(db.from('matches').insert({ range: `[${at(-54)},${at(-52)})` }).select('id'))
await result(db.from('match_sides').insert([{ match_id: match.id, team_id: teams[0].id }, { match_id: match.id, team_id: teams[1].id }]))
function totp(secret) {
 const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
 let bits = ''
 for (const c of secret.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, '0')
 const key = Buffer.from((bits.match(/.{8}/g) ?? []).map(byte => parseInt(byte, 2)))
 const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)))
 const hash = createHmac('sha1', key).update(counter).digest(), offset = hash[hash.length - 1] & 15
 return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0')
}
const base = 'http://127.0.0.1:3000'
for (let i = 0; i < 90; i++) {
 try { if ((await fetch(`${base}/admin/login`)).ok) break } catch {}
 if (i === 89) throw new Error('La aplicación no inició')
 await new Promise(resolve => setTimeout(resolve, 1000))
}
await mkdir('output/admin-browser', { recursive: true })
const browser = await chromium.launch({ headless: true })
const adminContext = await browser.newContext(), userContext = await browser.newContext()
const page = await adminContext.newPage(), userPage = await userContext.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
userPage.on('pageerror', error => errors.push(error.message))
try {
 await page.goto(`${base}/admin/login`)
 await page.locator('[name=email]').fill(admin.email); await page.locator('[name=password]').fill(password)
 await page.getByRole('button', { name: 'Ingresar como administrador' }).click()
 await page.waitForURL('**/admin/verificar*')
 await page.getByRole('button', { name: 'Configurar autenticador' }).click()
 await page.locator('details p').waitFor({ state: 'attached' })
 const secret = (await page.locator('details p').textContent()).trim()
 await page.locator('[name=code]').fill(totp(secret)); await page.getByRole('button', { name: 'Verificar y entrar' }).click()
 await page.waitForURL(`${base}/admin`)
 await page.getByRole('heading', { name: 'Resumen de la plataforma' }).waitFor()
 console.log('OK: contraseña y TOTP permiten entrar al panel')
 await page.goto(`${base}/admin/configuracion`)
 await page.locator('[name=support_email]').fill('soporte@example.org')
 await page.locator('[name=help_title]').fill('Ayuda de prueba')
 await page.locator('[name=help_text]').fill('Contenido de ayuda comprobado en navegador')
 await page.getByRole('button', { name: 'Guardar configuración' }).click()
 await page.getByRole('status').filter({ hasText: 'Configuración guardada' }).waitFor()
 await page.goto(`${base}/ayuda`)
 await page.getByRole('heading', { name: 'Ayuda de prueba' }).waitFor()
 await page.getByText('Contenido de ayuda comprobado en navegador').waitFor()
 console.log('OK: configuración se publica en Ayuda')
 await userPage.goto(`${base}/equipos/${teams[1].id}/reportar`)
 await userPage.waitForURL('**/login*')
 await userPage.locator('[name=email]').fill(reporter.email); await userPage.locator('[name=password]').fill(password)
 await userPage.getByRole('button', { name: 'Ingresar', exact: true }).click()
 await userPage.waitForURL(`**/equipos/${teams[1].id}/reportar`)
 await userPage.locator('[name=reason]').selectOption('violencia'); await userPage.locator('[name=detail]').fill('Hechos nuevos para revisión administrativa de prueba')
 await userPage.getByRole('button', { name: 'Enviar reporte' }).click()
 await userPage.waitForURL('**/mis-reportes*')
 await userPage.getByRole('heading', { name: teams[1].name }).waitFor()
 await page.goto(`${base}/admin/reportes/equipos`)
 await page.getByRole('link', { name: teams[1].name }).click()
 await page.locator('[name=q]').fill(rival.email); await page.getByRole('button', { name: 'Buscar cuenta' }).click()
 await page.locator(`[name=user_id][value="${rival.id}"]`).check()
 await page.locator('[name=reason]').fill('Responsable identificado al revisar los hechos del reporte')
 await page.locator('[name=confirm]').check()
 await page.getByRole('button', { name: 'Suspender y resolver solo este reporte' }).click()
 await page.waitForURL('**/admin/reportes/equipos?ok=1')
 const sanctions = await result(db.from('account_suspensions').select('id').eq('user_id', rival.id).is('lifted_at', null))
 assert.equal(sanctions.length, 1)
 console.log('OK: reporte de Equipo identifica responsable y aplica sanción')
 await page.goto(`${base}/admin/usuarios/${rival.id}`)
 await page.locator('[name=reason]').fill('Revisión administrativa de la sanción de prueba')
 await page.getByRole('button', { name: 'Levantar Suspensión' }).click()
 await page.waitForURL('**?ok=levantada')
 console.log('OK: levantamiento de Suspensión conserva historial')
 await userPage.goto(`${base}/soporte`)
 await userPage.locator('[name=subject]').fill('Consulta de navegador')
 await userPage.locator('[name=body]').fill('Necesito ayuda para usar el panel de equipos')
 await userPage.getByRole('button', { name: /Enviar consulta|Crear consulta/ }).click()
 await userPage.waitForURL('**/soporte/*')
 const threadId = new URL(userPage.url()).pathname.split('/').at(-1)
 await page.goto(`${base}/admin/soporte/${threadId}`)
 await page.locator('[name=body]').fill('Respuesta del Administrador verificada')
 await page.getByRole('button', { name: 'Enviar mensaje' }).click()
 await page.getByText('Respuesta del Administrador verificada', { exact: true }).waitFor()
 await userPage.reload(); await userPage.getByText('Respuesta del Administrador verificada', { exact: true }).waitFor()
 console.log('OK: conversación de soporte y respuesta administrativa')
 for (const [route, name] of [['reportes','Reportes de torneos'],['actividad','Registro de actividad'],['soporte','Soporte'],['avisos','Avisos'],['seguridad','Seguridad y acceso'],['configuracion','Configuración']]) {
  await page.goto(`${base}/admin/${route}`)
  await page.getByRole('heading', { name, exact: true }).waitFor()
  await page.screenshot({ path: `output/admin-browser/${route}.png`, fullPage: true })
 }
 await page.setViewportSize({ width: 390, height: 844 })
 await page.goto(`${base}/admin`); await page.getByRole('button', { name: 'Abrir navegación de administración' }).click()
 await page.screenshot({ path: 'output/admin-browser/navegacion-movil.png', fullPage: true })
 await page.setViewportSize({ width: 1280, height: 900 })
 await page.goto(`${base}/admin/seguridad`)
 await page.locator('[name=current_password]').fill('incorrecta'); await page.locator('[name=password]').fill(newPassword); await page.locator('[name=repeat]').fill(newPassword)
 await page.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click()
 await page.getByRole('alert').filter({ hasText: 'contraseña actual' }).waitFor()
 await page.locator('[name=current_password]').fill(password); await page.locator('[name=password]').fill(newPassword); await page.locator('[name=repeat]').fill(newPassword)
 await page.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click()
 await page.getByRole('status').filter({ hasText: 'Contraseña actualizada' }).waitFor()
 console.log('OK: contraseña actual incorrecta rechazada y cambio válido aplicado')
 await page.locator('form').filter({ has: page.locator('[name=scope][value=global]') }).locator('[name=confirm]').check()
 await page.getByRole('button', { name: 'Cerrar todas las sesiones de mi cuenta' }).click()
 await page.waitForURL('**/admin/login')
 console.log('OK: cierre global solicita un nuevo acceso')
 assert.deepEqual(errors, [])
 console.log('OK: sin errores de JavaScript en los flujos probados')
} catch (error) {
 await page.screenshot({ path: 'output/admin-browser/error-admin.png', fullPage: true }).catch(() => {})
 await userPage.screenshot({ path: 'output/admin-browser/error-usuario.png', fullPage: true }).catch(() => {})
 throw error
} finally { await browser.close() }
