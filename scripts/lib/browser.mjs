// Shared tooling for the real-browser checks (Phase 2 acceptance, Motion/Responsive matrix).
// It bundles the CURRENT source with esbuild (so the checks run against the code being released), serves it from a
// local HTTP server and drives Chromium/WebKit through Playwright. Playwright is not an Atlas dependency: it is
// resolved from ATLAS_BROWSER_TOOLS or from the sibling Developer Hub checkout, whose browsers are already installed.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function requireFrom(candidates, name) {
  for (const candidate of candidates.filter(Boolean)) {
    if (!existsSync(candidate)) continue
    try { return createRequire(candidate)(name) } catch { /* try the next checkout */ }
  }
  throw new Error(`${name} not found: set ATLAS_BROWSER_TOOLS to a package.json that can resolve it.`)
}
const sibling = (...parts) => resolve(root, '..', ...parts, 'package.json')
export const tools = () => ({
  playwright: requireFrom([process.env.ATLAS_BROWSER_TOOLS, sibling('runly-developer-hub')], '@playwright/test'),
  sharp: requireFrom([process.env.ATLAS_BROWSER_TOOLS, sibling('runly', 'packages', 'studio-interchange'), sibling('runly-developer-hub')], 'sharp'),
})

/** Bundle `source` (JSX allowed, resolves imports from `resolveDir`) into { js, css } strings. */
export async function bundle(source, { resolveDir = root, mode = 'development', platform = 'browser', format = 'iife' } = {}) {
  const require = createRequire(resolve(root, 'package.json'))
  const esbuild = createRequire(require.resolve('vite/package.json'))('esbuild')
  const result = await esbuild.build({
    stdin: { contents: source, resolveDir, loader: 'jsx', sourcefile: 'harness.jsx' },
    bundle: true, write: false, format, platform, jsx: 'automatic', logLevel: 'silent', outdir: 'out',
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    loader: { '.svg': 'dataurl', '.png': 'dataurl' },
  })
  const text = (suffix) => result.outputFiles.find((file) => file.path.endsWith(suffix))?.text ?? ''
  return { js: text('.js'), css: text('.css') }
}

export const page = ({ js, css = '', head = '', body = '<div id="root"></div>' }) =>
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}<style>${css}</style></head><body style="margin:0">${body}<script>${js}</script></body></html>`

/** Tiny static server: routes is { '/path': { body, type?, headers? } }. Returns { origin, close }. */
export async function serve(routes) {
  const server = createServer((request, response) => {
    const route = routes[new URL(request.url, 'http://x').pathname]
    if (!route) { response.writeHead(404); response.end('not found'); return }
    response.writeHead(200, { 'Content-Type': route.type ?? 'text/html; charset=utf-8', ...(route.headers ?? {}) })
    response.end(route.body)
  })
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((done) => server.close(done)) }
}

/** Opens the same page in Chromium and WebKit, runs `check(page, engine)` and aggregates results. */
export async function inEngines(check, { engines = ['chromium', 'webkit'], context = {} } = {}) {
  const { playwright } = tools()
  const results = []
  for (const name of engines) {
    const browser = await playwright[name].launch()
    try {
      const browserContext = await browser.newContext(context)
      const page = await browserContext.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
      results.push({ engine: name, ...(await check(page, name, errors)) })
    } finally { await browser.close() }
  }
  return results
}
