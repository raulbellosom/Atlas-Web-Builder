/* global window, document */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Installs the tarball in independent npm consumers. No sibling package aliases.
const root = process.cwd(), tarball = resolve(process.argv[2])
const sha = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex')
const source = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const report = { source, tarballSha256: sha(readFileSync(tarball)), consumers: [] }
const listing = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split(/\r?\n/)
assert(listing.every(p => /^package\/(dist\/|docs\/|package.json$|README.md$|CHANGELOG.md$|LICENSE$)/.test(p)))
assert(!listing.some(p => /(?:node_modules|\.env|\.npmrc|\.artifacts|tests)\//.test(p)))
const hubRequire = createRequire(resolve('../runly-developer-hub/package.json'))
const { build } = createRequire(createRequire(resolve('package.json')).resolve('vite/package.json'))('esbuild')
const { chromium, webkit } = hubRequire('@playwright/test')
const page = { schemaVersion: 1, id: 'packed', slug: '/', title: 'Packed', visibility: 'public',
  regions: { main: { children: ['legacy', 'text', 'collapsed', 'hidden', 'icon', 'button', 'ref', 'override'] } }, seo: { title: 'SEO preserved' }, blocks: {
    legacy: { id: 'legacy', type: 'HeadingBlock', props: { text: 'Historical heading', customHistorical: 'preserved' } },
    text: { id: 'text', type: 'TextElementBlock', props: { text: 'Responsive release', fontSize: 64, tabletFontSize: 40, mobileFontSize: 28, mobilePaddingLeft: 0 } },
    collapsed: { id: 'collapsed', type: 'TextElementBlock', props: { text: 'Collapsed', mobileVisibility: 'collapsed' } },
    hidden: { id: 'hidden', type: 'TextElementBlock', props: { text: 'Hidden', mobileVisibility: 'hidden' } },
    icon: { id: 'icon', type: 'IconElementBlock', props: { icon: 'heart', label: 'Favorito', size: 48, strokeWidth: 1.5, tone: 'primary' } },
    button: { id: 'button', type: 'ButtonElementBlock', props: { label: 'Acción', href: '#accion' } },
    ref: { id: 'ref', type: 'ComponentRefBlock', props: { componentId: 'footer' } },
    override: { id: 'override', type: 'ComponentRefBlock', props: { componentId: 'footer', overrides: { root: { text: 'Local override' } } } },
  } }
const components = { footer: { name: 'Pie compartido', section: { type: 'TextBlock', props: { text: 'Shared footer' } } } }
for (const react of ['18.3.1', '19.3.0']) {
  const dir = mkdtempSync(join(tmpdir(), 'atlas-responsive-consumer-'))
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'packed-consumer', private: true, type: 'module' }))
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball, `react@${react}`, `react-dom@${react}`], { cwd: dir, stdio: 'pipe', shell: process.platform === 'win32' })
  const require = createRequire(join(dir, 'package.json')), pkg = require.resolve('@raulbellosom/atlas-web-builder/package.json')
  const atlas = require('@raulbellosom/atlas-web-builder')
  const esm = await import(pathToFileURL(join(pkg, '../dist/atlas-web-builder.js')))
  const expectedVersion = JSON.parse(readFileSync('package.json')).version
  assert.equal(atlas.version, expectedVersion); assert.equal(atlas.getVersion(), expectedVersion)
  assert.deepEqual(Object.keys(atlas).sort(), Object.keys(esm).sort())
  assert.equal(typeof atlas.inspectOverflowDetails, 'function')
  assert.equal(typeof atlas.iconFor, 'function'); assert(atlas.ICONS.heart)
  assert.equal(typeof atlas.resolveComponents, 'function'); assert(atlas.ComponentRefBlock)
  assert(!atlas.baseBlocks.some(block => block.type === 'ComponentRefBlock'))
  const legacy = createRequire(resolve('../runly-developer-hub/package.json'))('@raulbellosom/atlas-web-builder')
  assert(Object.keys(legacy).every(key => key in atlas))
  const map = JSON.parse(readFileSync(join(pkg, '../dist/atlas-web-builder.js.map')))
  let verifiedSources = 0
  for (const [i, name] of map.sources.entries()) {
    if (!name.includes('/src/')) continue
    const file = `src/${name.split('/src/')[1]}`
    const expected = execFileSync('git', ['show', `${source}:${file}`], { cwd: root, encoding: 'utf8' })
    assert.equal(map.sourcesContent[i].replaceAll('\r\n', '\n'), expected.replaceAll('\r\n', '\n'), file)
    verifiedSources++
  }
  assert(verifiedSources > 100)
  const { updatedAt, ...reopened } = atlas.parsePage(atlas.serializePage(page))
  assert.equal(typeof updatedAt, 'string'); assert.deepEqual(reopened, page)
  const React = require('react'), { renderToString } = require('react-dom/server')
  const html = renderToString(React.createElement(atlas.AtlasWebBuilderProvider, { blocks: atlas.baseBlocks }, React.createElement(atlas.AtlasWebRenderer, { page, components })))
  assert(html.includes('Historical heading')); assert(html.includes('--ar-mobile-fontSize:28px'))
  assert(html.includes('Shared footer')); assert(html.includes('Local override'))
  const entry = join(dir, 'entry.js')
  writeFileSync(entry, `import React from 'react'; import {hydrateRoot,createRoot} from 'react-dom/client'; import {AtlasWebBuilderProvider,AtlasWebRenderer,AtlasWebBuilderEditor,ComponentRefBlock,baseBlocks} from '@raulbellosom/atlas-web-builder'; import '@raulbellosom/atlas-web-builder/styles'; const page=${JSON.stringify(page)},components=${JSON.stringify(components)}; hydrateRoot(document.getElementById('root'),React.createElement(AtlasWebBuilderProvider,{blocks:baseBlocks},React.createElement(AtlasWebRenderer,{page,components}))); window.openEditor=()=>{const node=document.createElement('div');node.id='editor';node.style.cssText='position:fixed;inset:0;height:100vh;z-index:99;background:white';document.body.appendChild(node);createRoot(node).render(React.createElement(AtlasWebBuilderEditor,{initialPage:page,blocks:[...baseBlocks,ComponentRefBlock],syncedComponents:{definitions:components,save:async next=>{window.savedComponents=next}}}));};window.ready=true;`)
  const bundled = await build({ entryPoints: [entry], bundle: true, write: false, outfile: join(dir, 'app.js'), format: 'esm', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent' })
  const js = bundled.outputFiles.find(f => f.path.endsWith('.js')).text, css = bundled.outputFiles.find(f => f.path.endsWith('.css')).text
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/app.js' ? 'text/javascript' : req.url === '/app.css' ? 'text/css' : 'text/html; charset=utf-8')
    res.end(req.url === '/app.js' ? js : req.url === '/app.css' ? css : `<html><head><link rel="stylesheet" href="/app.css"></head><body style="margin:0"><div id="canvas" style="width:390px"><div id="root">${html}</div></div><script type="module" src="/app.js"></script></body></html>`)
  })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const browserCases = []
  try {
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
      const browser = await engine.launch()
      try {
        const tab = await browser.newPage({ viewport: { width: 1920, height: 1000 } }), errors = []
        tab.on('pageerror', e => errors.push(e.message)); tab.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
        await tab.goto(`http://127.0.0.1:${server.address().port}`); await tab.waitForFunction(() => window.ready)
        assert.equal(await tab.getByRole('img', { name: 'Favorito' }).locator('svg').getAttribute('width'), '48')
        assert.equal(await tab.getByText('Shared footer', { exact: true }).count(), 1)
        assert.equal(await tab.getByText('Local override', { exact: true }).count(), 1)
        const button = tab.locator('[data-atlas-block="button"]')
        await button.hover()
        await tab.waitForFunction(() => getComputedStyle(document.querySelector('[data-atlas-block="button"]')).filter === 'brightness(0.94)')
        await tab.mouse.down()
        await tab.waitForFunction(() => getComputedStyle(document.querySelector('[data-atlas-block="button"]')).filter === 'brightness(0.86)')
        await tab.mouse.move(0, 0); await tab.mouse.up()
        await tab.emulateMedia({ reducedMotion: 'reduce' })
        assert.equal(await button.evaluate(node => getComputedStyle(node).transitionDuration), '0s')
        for (const [width, font] of [[390, '28px'], [820, '40px'], [1440, '64px']]) {
          await tab.locator('#canvas').evaluate((node, width) => { node.style.width = `${width}px` }, width)
          await tab.waitForFunction(font => getComputedStyle(document.querySelector('[data-atlas-block="text"]')).fontSize === font, font)
          assert.equal(await tab.locator('[data-atlas-block="collapsed"]').evaluate(n => getComputedStyle(n).display === 'none'), width < 640)
          assert.equal(await tab.locator('[data-atlas-block="hidden"]').evaluate(n => getComputedStyle(n).visibility), width < 640 ? 'hidden' : 'visible')
          browserCases.push({ browser: name, width, font, ssrHydration: true })
        }
        await tab.evaluate(() => window.openEditor())
        await tab.getByRole('tab', { name: 'Componentes', exact: true }).click()
        await tab.getByRole('button', { name: 'Editar Pie compartido', exact: true }).click()
        await tab.getByRole('region', { name: 'Edición de componente', exact: true }).waitFor()
        await tab.getByRole('button', { name: 'Guardar componente', exact: true }).click()
        await tab.waitForFunction(() => window.savedComponents?.footer?.section?.props?.text === 'Shared footer')
        assert.deepEqual(errors, [])
      } finally { await browser.close() }
    }
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
  report.consumers.push({ react, verifiedSources, exports: Object.keys(atlas).length, browserCases, roundtrip: true })
}
const output = `.artifacts/responsive-${JSON.parse(readFileSync('package.json')).version}`
mkdirSync(output, { recursive: true })
writeFileSync(`${output}/verification.json`, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report))
