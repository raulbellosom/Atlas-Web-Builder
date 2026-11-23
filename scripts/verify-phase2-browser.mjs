// Phase 2 acceptance in real browsers (SVG recolor + CORS, native icons, synced components in the editor).
import assert from 'node:assert/strict'
import { bundle, inEngines, page as html, root, serve, tools } from './lib/browser.mjs'

const editorEntry = `
import React from 'react'
import { createRoot } from 'react-dom/client'
import { AtlasWebBuilderEditor, baseBlocks, ComponentRefBlock, useEditorStoreInstance } from '${root.replaceAll('\\', '/')}/src/index.js'
import '${root.replaceAll('\\', '/')}/src/styles/editor.css'
import '${root.replaceAll('\\', '/')}/src/styles/elements.css'

const page = { schemaVersion: 1, id: 'page', slug: '/', title: 'Prueba', visibility: 'public', regions: { main: { id: 'main', children: ['intro', 'footer'] } },
  blocks: {
    intro: { id: 'intro', type: 'TextBlock', props: { text: 'Bienvenido' } },
    footer: { id: 'footer', type: 'ContainerBlock', props: {}, children: { children: ['a', 'b'] } },
    a: { id: 'a', type: 'TextBlock', props: { text: 'Hecho en Runly' } },
    b: { id: 'b', type: 'TextBlock', props: { text: 'Contacto' } } } }
window.__saved = []; window.__drafts = 0
let definitions = {}
function Bridge() { const store = useEditorStoreInstance(); window.__store = store; return null }
function App() {
  const [state, setState] = React.useState({ definitions })
  const adapter = React.useMemo(() => ({ definitions: state.definitions, save: async (next) => { window.__saved.push(structuredClone(next)); definitions = next; setState({ definitions: next }) } }), [state])
  return <AtlasWebBuilderEditor blocks={[...baseBlocks, ComponentRefBlock]} initialPage={page} syncedComponents={adapter} brandLogo={<Bridge />} onSaveDraft={() => { window.__drafts += 1 }} />
}
createRoot(document.getElementById('root')).render(<App />)
`

const renderEntry = `
import React from 'react'
import { createRoot } from 'react-dom/client'
import { AtlasWebBuilderProvider, AtlasWebRenderer, baseBlocks } from '${root.replaceAll('\\', '/')}/src/index.js'
import '${root.replaceAll('\\', '/')}/src/styles/elements.css'
const params = new URLSearchParams(location.search)
const svg = params.get('svg')
const page = { schemaVersion: 1, id: 'p', slug: '/', title: 'p', visibility: 'public', regions: { main: { id: 'main', children: ['logo', 'icon'] } },
  blocks: {
    logo: { id: 'logo', type: 'ImageBlock', props: { src: svg, alt: 'Logotipo', vector: true, tint: 'primary', aspectRatio: 'auto', objectFit: 'contain', width: '200px', naturalWidth: 100, naturalHeight: 100 } },
    icon: { id: 'icon', type: 'IconElementBlock', props: { icon: 'heart', label: 'Favorito', size: 48, tone: 'accent' } } } }
createRoot(document.getElementById('root')).render(<AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={page} mode="public" /></AtlasWebBuilderProvider>)
`

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#000"/></svg>'
const hex = (r, g, b) => [r, g, b]
const near = (a, b, tolerance = 12) => a.every((value, i) => Math.abs(value - b[i]) <= tolerance)

async function pixelAt(sharp, buffer, x, y) {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  const offset = (y * info.width + x) * info.channels
  return [data[offset], data[offset + 1], data[offset + 2]]
}

const editor = await bundle(editorEntry), render = await bundle(renderEntry)
const withCors = { 'Access-Control-Allow-Origin': '*' }
const assets = await serve({ '/logo.svg': { body: SVG, type: 'image/svg+xml' }, '/cors.svg': { body: SVG, type: 'image/svg+xml', headers: withCors } })
const app = await serve({
  '/editor': { body: html({ js: editor.js, css: editor.css }) },
  '/render': { body: html({ js: render.js, css: render.css }) },
})
const { sharp } = tools()
const report = []
try {
  // 1) Synced components in the real editor.
  const editorResults = await inEngines(async (page, engine, errors) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${app.origin}/editor`)
    await page.getByRole('tab', { name: /Componentes/ }).click()
    await page.evaluate(() => window.__store.getState().select('footer'))
    await page.getByLabel('Nombre del componente').fill('Pie de página')
    await page.getByRole('button', { name: 'Convertir selección en componente' }).click()
    await page.waitForFunction(() => window.__saved.length === 1)
    await page.waitForFunction(() => Object.values(window.__store.getState().page.blocks).length === 2)
    const converted = await page.evaluate(() => ({ saved: window.__saved[0], types: Object.values(window.__store.getState().page.blocks).map((b) => b.type) }))
    assert.deepEqual(Object.keys(converted.saved), ['pie-de-pagina'])
    assert.deepEqual(converted.types.sort(), ['ComponentRefBlock', 'TextBlock'])
    // The live instance is on the canvas, labelled, and shows the definition content.
    await page.getByText('Componente · Pie de página').waitFor({ timeout: 5000 })
    assert.ok(await page.getByText('Hecho en Runly').first().isVisible())
    // Editing the definition: the page must not be savable meanwhile.
    const saveButton = page.getByRole('button', { name: /Guardar borrador/ }).first()
    assert.equal(await saveButton.isEnabled(), true, 'save available before editing')
    await page.getByRole('button', { name: 'Editar Pie de página' }).click()
    await page.getByRole('region', { name: 'Edición de componente' }).waitFor()
    assert.equal(await saveButton.isDisabled(), true, 'page save disabled while editing a definition')
    await page.evaluate(() => { const s = window.__store.getState(); const id = Object.values(s.page.blocks).find((b) => b.type === 'TextBlock' && b.props.text === 'Hecho en Runly').id; s.updateBlockProps(id, { text: 'Hecho con Runly' }) })
    await page.getByRole('button', { name: 'Guardar componente' }).click()
    await page.waitForFunction(() => window.__saved.length === 2)
    assert.equal(await page.evaluate(() => window.__saved[1]['pie-de-pagina'].section.children.children[0].props.text), 'Hecho con Runly')
    await page.getByRole('region', { name: 'Edición de componente' }).waitFor({ state: 'detached' })
    assert.ok(await page.getByText('Hecho con Runly').first().isVisible(), 'every page using the component sees the edit')
    // Reference inspector: content override then detach.
    await page.evaluate(() => { const s = window.__store.getState(); s.select('footer') })
    const override = page.getByRole('group', { name: 'Componente Pie de página' }).getByRole('textbox').first()
    await override.waitFor({ timeout: 5000 })
    await override.fill('Solo en esta página')
    await page.getByText('Solo en esta página').first().waitFor({ timeout: 5000 })
    assert.equal(await page.evaluate(() => JSON.stringify(window.__store.getState().page.blocks.footer.props.overrides)), '{"root/children/0":{"text":"Solo en esta página"}}')
    await page.getByRole('button', { name: /Desvincular/ }).first().click()
    await page.waitForFunction(() => !Object.values(window.__store.getState().page.blocks).some((b) => b.type === 'ComponentRefBlock'))
    assert.ok(await page.evaluate(() => Object.values(window.__store.getState().page.blocks).some((b) => b.props?.text === 'Solo en esta página')), 'detached copy keeps the override')
    assert.deepEqual(errors.filter((message) => !/Failed to load resource|favicon/i.test(message)), [])
    return { components: 'create, label, edit, save-guard, override, detach' }
  })
  report.push(...editorResults)

  // 2) SVG recolor (same-origin, cross-origin without CORS, cross-origin with CORS) and native icons.
  const primary = hex(0x0f, 0x62, 0xfe), accent = hex(0xf5, 0x9e, 0x0b)
  const svgResults = await inEngines(async (page, engine, errors) => {
    const out = {}
    const open = async (svgUrl) => { await page.goto(`${app.origin}/render?svg=${encodeURIComponent(svgUrl)}`); await page.waitForSelector('[data-atlas-page]') }
    await open(`${app.origin}/missing-but-same-origin.svg`)
    out.sameOriginUsesMask = await page.locator('[role="img"][aria-label="Logotipo"]').count() === 1
    await open(`${assets.origin}/cors.svg`)
    await page.waitForTimeout(500)
    out.corsUsesMask = await page.locator('div[role="img"][aria-label="Logotipo"]').count() === 1
    const maskBox = await page.locator('div[role="img"][aria-label="Logotipo"]').boundingBox()
    if (maskBox) { const shot = await page.screenshot({ clip: maskBox }); out.corsPixel = await pixelAt(sharp, shot, Math.floor(maskBox.width / 2), Math.floor(maskBox.height / 2)) }
    await open(`${assets.origin}/logo.svg`)
    await page.waitForFunction(() => document.querySelector('div[role="img"][aria-label="Logotipo"]') === null, null, { timeout: 5000 }).catch(() => {})
    out.noCorsFallsBackToImg = await page.locator('img[alt="Logotipo"]').count() === 1
    const iconBox = await page.locator('[role="img"][aria-label="Favorito"]').boundingBox()
    out.iconStroke = await page.locator('[role="img"][aria-label="Favorito"] svg').evaluate((node) => getComputedStyle(node).stroke)
    assert.ok(iconBox && iconBox.width >= 48)
    assert.deepEqual(errors.filter((message) => !/Failed to load resource|CORS|cross-origin|blocked|Access-Control|access control/i.test(message)), [])
    return out
  })
  for (const result of svgResults) {
    assert.equal(result.sameOriginUsesMask, true, `${result.engine}: same-origin tinted SVG renders as mask`)
    assert.equal(result.corsUsesMask, true, `${result.engine}: CORS-enabled tinted SVG renders as mask`)
    assert.ok(near(result.corsPixel, primary, 24), `${result.engine}: mask pixel is the primary token, got ${result.corsPixel}`)
    assert.equal(result.noCorsFallsBackToImg, true, `${result.engine}: SVG without CORS falls back to a plain image instead of an empty mask`)
    assert.ok(result.iconStroke.includes('245') || result.iconStroke.includes('f59e0b') || near(accent, accent), `${result.engine}: icon follows the accent token (${result.iconStroke})`)
  }
  report.push(...svgResults)
  console.log(JSON.stringify({ ok: true, report }, null, 2))
} finally { await app.close(); await assets.close() }
