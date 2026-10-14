import assert from 'node:assert/strict'

// Prueba HTTP real sin credenciales: no registra cuentas ni modifica datos.
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:3000')
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Usar solo un servidor local')
const request = (path, options = {}) => fetch(new URL(path, base), { redirect: 'manual', ...options })
const location = response => new URL(response.headers.get('location'), base)
const report = name => console.log(`OK: ${name}`)

const initial = await request('/')
assert.equal(initial.status, 307)
assert.equal(location(initial).pathname, '/login')
report('primera visita sin sesión -> /login')

const login = await request('/login?next=%2Fmis-equipos')
assert.equal(login.status, 200)
const html = await login.text()
assert.ok(html.includes('Entrar como invitado'))
assert.ok(html.includes('name="next" value="/mis-equipos"'))
assert.doesNotMatch(html, /<header(?:\s|>)/)
assert.doesNotMatch(html, /<footer(?:\s|>)/)
assert.ok(html.includes('href="/admin/login"'))
report('login conserva el destino y ofrece entrar como invitado')

const registration = await request('/login?modo=registro&next=%2Fmis-equipos')
assert.equal(registration.status, 200)
assert.ok((await registration.text()).includes('name="display_name"'))
report('registro accesible sin enviar datos')

const catalog = await request('/torneos')
assert.equal(catalog.status, 200)
report('catálogo accesible sin sesión ni elección previa')

const legacy = await request('/?modality=f5&zona=palermo&zona=belgrano')
assert.equal(legacy.status, 307)
assert.equal(location(legacy).pathname, '/torneos')
assert.deepEqual(location(legacy).searchParams.getAll('zona'), ['palermo', 'belgrano'])
assert.equal(location(legacy).searchParams.get('modality'), 'f5')
report('links anteriores conservan los filtros')

const guestForm = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].find(match => match[0].includes('Entrar como invitado'))?.[0]
assert.ok(guestForm, 'Existe el formulario de invitado')
const actionName = guestForm.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]
assert.ok(actionName, 'Existe la referencia de Server Action sin JavaScript')
const data = new FormData()
data.set(actionName, '')
const guest = await request('/login', { method: 'POST', body: data, headers: { Origin: base.origin } })
assert.equal(guest.status, 303)
assert.equal(location(guest).pathname, '/torneos')
const cookies = guest.headers.getSetCookie()
const preference = cookies.find(value => value.startsWith('torneos-guest=1;'))
assert.ok(preference)
assert.match(preference, /HttpOnly/i)
assert.match(preference, /SameSite=lax/i)
assert.doesNotMatch(preference, /Expires=|Max-Age=/i)
assert.equal(cookies.some(value => value.startsWith('sb-')), false, 'El invitado no crea sesión Supabase')
report('acción de invitado -> cookie de navegación sin sesión Supabase')

const cookie = preference.split(';')[0]
const returning = await request('/', { headers: { Cookie: cookie } })
assert.equal(returning.status, 307)
assert.equal(location(returning).pathname, '/torneos')
report('volver al inicio como invitado no repite el login')

for (const path of ['/mis-equipos', '/mis-torneos', '/perfil', '/admin']) {
  const response = await request(path, { headers: { Cookie: cookie } })
  assert.equal(response.status, 307)
  assert.equal(location(response).pathname, path === '/admin' ? '/admin/login' : '/login')
  assert.equal(location(response).searchParams.get('next'), path)
}
report('la preferencia de invitado no habilita ninguna ruta privada')

const adminLogin = await request('/admin/login?next=%2Fperfil')
assert.equal(adminLogin.status, 200)
const adminHtml = await adminLogin.text()
assert.ok(adminHtml.includes('Ingresar como administrador'))
assert.ok(adminHtml.includes('name="next" value="/admin"'))
assert.doesNotMatch(adminHtml, /<header(?:\s|>)/)
assert.doesNotMatch(adminHtml, /<footer(?:\s|>)/)
assert.ok(!adminHtml.includes('Entrar como invitado'))
report('acceso de administrador diferenciado y sin navbar, registro ni invitado')

for (const path of ['/admin/seguridad?tab=cuenta', '/admin/login/otra']) {
  const response = await request(path)
  assert.equal(response.status, 307)
  assert.equal(location(response).pathname, '/admin/login')
  assert.equal(location(response).searchParams.get('next'), path)
}
report('rutas del backoffice protegidas, incluido un sufijo del login')

const adminAction = adminHtml.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]
assert.ok(adminAction)
const invalidCredentials = new FormData()
invalidCredentials.set(adminAction, '')
invalidCredentials.set('next', '/perfil')
invalidCredentials.set('role', 'administrator')
const invalidAdmin = await request('/admin/login', { method: 'POST', body: invalidCredentials, headers: { Origin: base.origin } })
assert.equal(invalidAdmin.status, 303)
assert.equal(location(invalidAdmin).pathname, '/admin/login')
assert.equal(location(invalidAdmin).searchParams.get('error'), 'credentials')
assert.equal(location(invalidAdmin).searchParams.get('next'), '/admin')
assert.equal(invalidAdmin.headers.getSetCookie().some(value => value.startsWith('sb-')), false)
report('acción de administrador valida datos y no concede sesión ni rol por campos falsos')
