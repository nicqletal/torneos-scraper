// Genera los PDF de docs/diagramas-de-clase/ a partir de sus .md.
//
// Uso:  node scripts/generar-diagramas-pdf.mjs [archivo.md ...]
//
// Cómo funciona:
//   1. Descarga (una sola vez, a una carpeta temporal) marked y mermaid.
//   2. Arma un HTML por cada .md: marked convierte el Markdown y mermaid
//      dibuja los bloques ```mermaid.
//   3. Abre ese HTML con Edge o Chrome en modo headless: primero vuelca el DOM
//      para detectar diagramas con errores y después imprime el PDF.
//
// No agrega dependencias al proyecto. Necesita internet la primera vez y un
// navegador Chromium instalado (o la variable de entorno BROWSER con su ruta).

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsDir = path.join(root, 'docs', 'diagramas-de-clase')
const cacheDir = path.join(tmpdir(), 'torneos-diagramas-pdf')

const libs = {
  'marked.min.js': 'https://cdn.jsdelivr.net/npm/marked@15/marked.min.js',
  'mermaid.min.js': 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
}

const browserCandidates = [
  process.env.BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

async function ensureLibs() {
  await mkdir(cacheDir, { recursive: true })
  for (const [name, url] of Object.entries(libs)) {
    const target = path.join(cacheDir, name)
    if (existsSync(target)) continue
    console.log(`Descargando ${url}`)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`No se pudo descargar ${url} (${response.status})`)
    await writeFile(target, await response.text(), 'utf8')
  }
}

const styles = `
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10.5pt;
         line-height: 1.45; color: #1b1b1b; margin: 0; }
  h1 { font-size: 22pt; border-bottom: 3px solid #9bd31d; padding-bottom: 6px; margin: 0 0 12px; }
  h2 { font-size: 15pt; margin: 22px 0 8px; padding: 6px 10px; background: #f1f5e6;
       border-left: 5px solid #9bd31d; break-after: avoid; }
  h2.break { break-before: page; }
  h3 { font-size: 12pt; margin: 14px 0 6px; break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0 12px; font-size: 9.5pt; break-inside: avoid; }
  th, td { border: 1px solid #cfd6c4; padding: 4px 7px; vertical-align: top; text-align: left; }
  th { background: #eef2e6; }
  code { font-family: Consolas, 'Courier New', monospace; font-size: 9pt; background: #f3f3f3;
         padding: 0 3px; border-radius: 3px; }
  pre { background: #f6f6f6; padding: 8px; border-radius: 4px; overflow: hidden; white-space: pre-wrap; }
  blockquote { margin: 8px 0; padding: 6px 12px; border-left: 4px solid #e0b300; background: #fff9e6; }
  .mermaid { text-align: center; margin: 10px 0 14px; break-inside: avoid; background: #fff; }
  .mermaid svg { height: auto; max-height: 240mm; }
  .error { color: #b00020; font-weight: bold; }
`

function buildHtml(title, markdown) {
  const payload = JSON.stringify(markdown).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${title}</title>
<style>${styles}</style>
<script src="marked.min.js"></script>
<script src="mermaid.min.js"></script>
</head><body>
<main id="content"></main>
<script id="md" type="application/json">${payload}</script>
<script>
  const md = JSON.parse(document.getElementById('md').textContent)
  const main = document.getElementById('content')
  main.innerHTML = marked.parse(md, { gfm: true })
  // Cada sección principal (h2) o caso de uso (h3) arranca en una página nueva, salvo el primero.
  main.querySelectorAll('h2, h3').forEach((h, i) => { if (i > 0) h.classList.add('break') })
  main.querySelectorAll('pre > code.language-mermaid').forEach(code => {
    const div = document.createElement('div')
    div.className = 'mermaid'
    div.textContent = code.textContent
    code.parentElement.replaceWith(div)
  })
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose',
                       flowchart: { useMaxWidth: true }, class: { useMaxWidth: true } })
  mermaid.run({ querySelector: '.mermaid', suppressErrors: true }).catch(() => {}).then(() => {
    document.querySelectorAll('.mermaid').forEach((el, idx) => {
      const svg = el.querySelector('svg')
      if (!svg || /Syntax error|Parse error/i.test(el.textContent)) {
        el.setAttribute('data-error', 'true')
        el.setAttribute('data-error-index', String(idx))
      }
    })
    document.body.setAttribute('data-rendered', 'true')
  })
</script>
</body></html>`
}

function runBrowser(browser, args) {
  const result = spawnSync(browser, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files', '--virtual-time-budget=30000', ...args,
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (result.error) throw result.error
  return result
}

async function main() {
  const browser = browserCandidates.find(candidate => existsSync(candidate))
  if (!browser) throw new Error('No encontré Edge ni Chrome. Indicá la ruta con la variable BROWSER.')

  const requested = process.argv.slice(2)
  const files = requested.length
    ? requested.map(file => path.resolve(file))
    : (await readdir(docsDir)).filter(f => f.endsWith('.md') && f !== 'README.md').map(f => path.join(docsDir, f))

  await ensureLibs()
  let failures = 0

  for (const file of files) {
    const name = path.basename(file, '.md')
    const markdown = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '')
    const title = (markdown.match(/^#\s+(.+)$/m)?.[1] ?? name).trim()
    const htmlPath = path.join(cacheDir, `${name}.html`)
    const pdfPath = path.join(path.dirname(file), `${name}.pdf`)
    await writeFile(htmlPath, buildHtml(title, markdown), 'utf8')
    const url = pathToFileURL(htmlPath).href

    const dom = runBrowser(browser, ['--dump-dom', url]).stdout
    if (!dom.includes('data-rendered="true"')) {
      console.error(`ERROR ${name}: el navegador no terminó de dibujar los diagramas`)
      failures++
      continue
    }
    const broken = (dom.match(/data-error="true"/g) ?? []).length
    if (broken) {
      console.error(`ERROR ${name}: ${broken} diagrama(s) con errores de sintaxis`)
      failures++
      continue
    }

    runBrowser(browser, ['--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, url])
    if (!existsSync(pdfPath)) {
      console.error(`ERROR ${name}: no se generó el PDF`)
      failures++
      continue
    }
    console.log(`OK ${path.relative(root, pdfPath)}`)
  }

  if (failures) process.exit(1)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
