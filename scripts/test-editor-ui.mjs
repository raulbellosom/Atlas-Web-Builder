import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { nativePaletteScroll, pointerSorting } from '../tests/browser/gestures.mjs'
import { checkControls } from '../tests/browser/controlChecks.mjs'
import { checkEdges, contrastRatio } from '../tests/browser/edgeChecks.mjs'

// Optional reuse of an installed test-tool package; no runtime dependency on a host.
const require = createRequire(process.env.ATLAS_BROWSER_TOOLS || import.meta.url)
const { chromium, webkit, expect } = require('@playwright/test')
const root = process.cwd(), output = resolve(process.env.ATLAS_TEST_OUTPUT || `.artifacts/${process.env.ATLAS_TEST_REACT ? 'phase-1-react19' : 'phase-1'}`)
mkdirSync(output, { recursive: true })
const reactTools = process.env.ATLAS_TEST_REACT ? createRequire(process.env.ATLAS_TEST_REACT) : null
const packedTools = process.env.ATLAS_TEST_PACKAGE ? createRequire(resolve(process.env.ATLAS_TEST_PACKAGE)) : null
const packedEntry = packedTools?.resolve('@raulbellosom/atlas-web-builder').replace(/\.cjs$/, '.js')
const peers = packedTools || reactTools
const alias = { ...(peers ? { react: dirname(peers.resolve('react/package.json')), 'react-dom': dirname(peers.resolve('react-dom/package.json')) } : {}),
  ...(packedEntry ? { '../../src/index.js': packedEntry, '../../src/editor/store/EditorStoreProvider.jsx': packedEntry } : {}) }
const packedCss = packedEntry && { name: 'packed-css', transformIndexHtml: () => [{ tag: 'link', attrs: { rel: 'stylesheet', href: `/@fs/${resolve(dirname(packedEntry), 'style.css').replaceAll('\\', '/')}` } }] }
// realpath: a lowercase drive letter in cwd made Vite load one source file under two URLs (two React contexts).
const server = await createServer({ configFile: false, root: realpathSync.native(resolve('tests/browser')), plugins: [react(), packedCss].filter(Boolean), resolve: { alias }, server: { host: '127.0.0.1', port: 0, fs: { allow: [root, ...(reactTools ? [dirname(process.env.ATLAS_TEST_REACT)] : []), ...(packedTools ? [dirname(resolve(process.env.ATLAS_TEST_PACKAGE))] : [])] } } })
await server.listen()
const url = `http://127.0.0.1:${server.httpServer.address().port}`, results = []
const sizes = [[1440, 900], [320, 700], [390, 844], [768, 1024], [1024, 768]].filter(([width]) => !process.env.ATLAS_TEST_WIDTH || process.env.ATLAS_TEST_WIDTH.split(',').map(Number).includes(width))
// Phase 1 captures caught colour transitions mid-way (grey library cards, stale segmented state).
const settle = page => page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))))
async function closePanels(page) {
  for (const [label, attribute] of [['Cerrar inspector', 'data-right-closed'], ['Cerrar biblioteca', 'data-left-closed']]) {
    const button = page.getByRole('button', { name: label })
    const editor = page.locator('.atlas-wb-editor')
    if (!await editor.evaluate((node, name) => node.hasAttribute(name), attribute)) {
      await button.tap(); await expect(editor).toHaveAttribute(attribute, ''); await expect(button).not.toBeVisible()
    }
  }
}
const APPEARANCE_LABELS = { light: 'Claro', dark: 'Oscuro', system: 'Sistema' }
async function setAppearance(page, mode, compact) {
  await page.getByRole('button', { name: compact ? 'Más acciones' : 'Apariencia del editor', exact: true }).click()
  const option = page.getByRole('menuitemradio', { name: APPEARANCE_LABELS[mode], exact: true })
  assert(await option.evaluate(node => !!node.closest('.atlas-wb-editor .atlas-wb-overlay-scope')), 'Radix menu must portal inside the editor scope')
  await option.click()
  await expect(page.getByRole('menu')).toHaveCount(0)
  // Focus returns to the trigger after a pointer choice; that must not leave its tooltip open.
  await expect(page.getByRole('tooltip')).toHaveCount(0)
}
async function openInspector(page, compact) {
  if (compact) {
    await page.getByRole('button', { name: 'Propiedades', exact: true }).tap()
    await expect(page.locator('.atlas-wb-panel--right')).not.toHaveAttribute('inert', '')
    await expect(page.getByRole('button', { name: 'Cerrar inspector' })).toBeVisible()
  }
}
async function save(page, compact) {
  if (compact) { await closePanels(page); await page.getByRole('button', { name: 'Más acciones', exact: true }).click() }
  await page.getByRole(compact ? 'menuitem' : 'button', { name: 'Guardar borrador', exact: true }).click()
  await expect(page.getByRole('menu')).toHaveCount(0)
}
try {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]].filter(([name]) => !process.env.ATLAS_TEST_BROWSER || name === process.env.ATLAS_TEST_BROWSER)) {
    let browser
    try { browser = await engine.launch({ headless: true }) }
    catch (error) { if (name === 'webkit') { results.push({ browser: name, unavailable: error.message }); continue } throw error }
    try {
      for (const [width, height] of sizes) {
        const compact = width <= 1100, phone = width <= 600
        const context = await browser.newContext({ viewport: { width, height }, colorScheme: 'light', hasTouch: compact, isMobile: phone, reducedMotion: width === 390 ? 'reduce' : 'no-preference' })
        const page = await context.newPage(), errors = []
        page.setDefaultTimeout(8000)
        page.on('pageerror', error => errors.push(error.message))
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
        try {
          await page.goto(url)
          if (packedEntry) assert.equal(await page.evaluate(() => window.atlasApiVersion), '0.5.0')
          await page.locator('.atlas-wb-canvas__frame').waitFor()
          if (compact) await page.locator('[data-block-id="heading"]').tap()
          else await page.locator('[data-block-id="heading"]').click()
          await openInspector(page, compact)
          const text = `Contenido conservado ${width}`
          await page.getByLabel('Texto', { exact: true }).fill(text)
          if (compact) await closePanels(page)
          await page.getByRole('button', { name: 'Deshacer', exact: true }).click()
          assert.equal(await page.evaluate(() => window.atlasTest.page().blocks.heading.props.text), 'Ideas que toman forma.')
          await page.getByRole('button', { name: 'Rehacer', exact: true }).click()
          assert.equal(await page.evaluate(() => window.atlasTest.page().blocks.heading.props.text), text)
          const history = await page.evaluate(() => window.atlasTest.history())
          for (const mode of ['light', 'dark', 'system']) {
            await setAppearance(page, mode, compact)
            if (mode === 'system') await page.emulateMedia({ colorScheme: 'dark' })
            const resolved = mode === 'system' ? 'dark' : mode
            await page.locator(`.atlas-wb-editor-scope[data-appearance="${resolved}"]`).waitFor()
            assert.equal(await page.locator('.atlas-wb-canvas__frame').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)')
            const tokens = await page.locator('.atlas-wb-editor').evaluate(node => Object.fromEntries(['panel', 'panel-fg', 'muted', 'accent', 'accent-fg', 'accent-soft', 'focus'].map(key => [key, getComputedStyle(node).getPropertyValue(`--awb-${key}`)])))
            assert(contrastRatio(tokens['panel-fg'], tokens.panel) >= 4.5, 'UI text contrast')
            assert(contrastRatio(tokens.muted, tokens.panel) >= 4.5, 'Muted text contrast')
            assert(contrastRatio(tokens['accent-fg'], tokens.accent) >= 4.5, 'Primary control contrast')
            assert.equal(await page.locator('[data-block-id="heading"]').getAttribute('data-selected'), 'true')
            assert.equal(await page.evaluate(() => window.atlasTest.history()), history)
            if (mode !== 'system') await settle(page)
            if (mode !== 'system') await page.screenshot({ path: resolve(output, `${name}-${width}-${mode}.png`) })
          }
          await page.emulateMedia({ colorScheme: 'light' })
          await page.locator('.atlas-wb-editor-scope[data-appearance="light"]').waitFor()
          assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--awb-bg')), '')
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Host horizontal overflow')
          assert(await page.locator('.atlas-wb-topbar').evaluate(node => node.scrollWidth <= node.clientWidth), 'Toolbar horizontal overflow')
          const handles = await page.locator('.atlas-wb-block__toolbar button').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return [r.width, r.height] }))
          assert(handles.every(([w, h]) => w >= 44 && h >= 44), 'Unscaled touch targets')
          await openInspector(page, compact)
          await page.getByLabel('Nivel', { exact: true }).selectOption('h3')
          await page.getByRole('button', { name: /^Layout/ }).click()
          await page.getByRole('radiogroup', { name: 'Alineación', exact: true }).getByRole('radio').nth(1).click()
          assert.equal(await page.evaluate(() => window.atlasTest.page().blocks.heading.props.align), 'center')
          await page.getByRole('button', { name: 'Restablecer Alineación' }).click()
          assert.equal(await page.evaluate(() => window.atlasTest.page().blocks.heading.props.align), 'left')
          if (compact) {
            await settle(page)
            await page.screenshot({ path: resolve(output, `${name}-${width}-inspector.png`) })
            // Appearance is still "system" here, so the dark inspector needs no extra UI steps.
            await page.emulateMedia({ colorScheme: 'dark' }); await page.locator('.atlas-wb-editor-scope[data-appearance="dark"]').waitFor(); await settle(page)
            await page.screenshot({ path: resolve(output, `${name}-${width}-inspector-dark.png`) })
            await page.emulateMedia({ colorScheme: 'light' }); await page.locator('.atlas-wb-editor-scope[data-appearance="light"]').waitFor()
            await closePanels(page)
            await page.getByRole('button', { name: 'Bloques', exact: true }).click()
            const panel = page.locator('.atlas-wb-panel--left .atlas-wb-panel__body')
            await panel.evaluate(node => { node.scrollTop = node.scrollHeight })
            assert(await panel.evaluate(node => node.scrollTop > 0), 'Palette must scroll')
            if (name === 'chromium' && width === 390) await nativePaletteScroll(page, context, expect)
            await closePanels(page)
            await page.getByRole('button', { name: 'Capas', exact: true }).click()
            const layer = page.locator('[data-layer-id="heading"]').first()
            await expect(layer).toBeVisible(); await layer.focus(); await expect(layer).toBeFocused(); await page.keyboard.press('ArrowDown')
            assert.equal(await page.evaluate(() => document.activeElement.dataset.layerId), 'paragraph')
            await closePanels(page)
          }
          await save(page, compact)
          const saved = await page.evaluate(() => window.atlasTest.saved())
          assert.deepEqual(saved.blocks.heading.props.customHistorical, { preserve: true })
          await page.evaluate(() => window.atlasTest.reopen())
          await expect(page.locator('[data-fixture-session]')).toHaveAttribute('data-fixture-session', '1')
          if (compact) await page.locator('[data-block-id="heading"]').tap()
          else await page.locator('[data-block-id="heading"]').click()
          await openInspector(page, compact)
          await expect(page.getByLabel('Texto', { exact: true })).toHaveValue(text)
          if (compact) await closePanels(page)
          assert.deepEqual(await page.evaluate(() => window.atlasTest.page().blocks.heading.props), saved.blocks.heading.props)
          if (width === 1440 || width === 390) {
            const before = await page.evaluate(() => [...window.atlasTest.page().blocks.section.children.children])
            const handle = page.locator('.atlas-wb-block__toolbar .atlas-wb-drag-handle')
            await expect(handle).toBeVisible(); await handle.focus(); await expect(handle).toBeFocused()
            await page.keyboard.press('Space', { delay: 30 })
            await expect(page.locator('.atlas-wb-drag-overlay')).toHaveCount(1)
            await page.keyboard.press('ArrowDown')
            await expect(page.locator('[aria-live="assertive"]')).toContainText('Destino: Texto.')
            await page.keyboard.press('Space')
            await expect.poll(() => page.evaluate(() => window.atlasTest.page().blocks.section.children.children.join(','))).not.toBe(before.join(','))
            await page.getByRole('button', { name: 'Deshacer', exact: true }).click()
            await pointerSorting(page, context, name, width === 390, expect)
            assert.deepEqual(await page.evaluate(() => window.atlasTest.page().blocks.section.children.children), before)
            await page.getByRole('button', { name: 'Bajar', exact: true }).click()
            assert.notDeepEqual(await page.evaluate(() => window.atlasTest.page().blocks.section.children.children), before)
            await page.getByRole('button', { name: 'Deshacer', exact: true }).click()
          }
          // Site links, including target=_blank, select blocks instead of opening a page.
          await page.getByRole('link', { name: 'Conoce el estudio' }).click()
          assert.equal(context.pages().length, 1)
          assert.equal(page.url(), url + '/')
          if (compact) await page.getByRole('button', { name: 'Bloques', exact: true }).click()
          await page.getByRole('button', { name: 'Insertar Imagen', exact: true }).click()
          await openInspector(page, compact)
          await page.getByRole('button', { name: 'Abrir selector de medios' }).click()
          const modal = page.getByRole('dialog', { name: 'Selector de medios' })
          await modal.waitFor()
          await page.keyboard.press('Tab')
          assert(await modal.evaluate(node => node.contains(node.ownerDocument.activeElement)), 'Media modal focus containment')
          await page.keyboard.press('Escape')
          await expect(modal).toHaveCount(0)
          await expect(page.getByRole('button', { name: 'Abrir selector de medios' })).toBeFocused()
          if (phone) {
            await page.setViewportSize({ width, height: 420 })
            await page.getByLabel('Texto alternativo').focus()
            assert(await page.locator('.atlas-wb-panel--right').evaluate(node => node.getBoundingClientRect().bottom <= innerHeight + 1), 'Keyboard-sized viewport clips inspector')
            assert(await page.evaluate(() => document.querySelector('.atlas-wb-panel--right').getBoundingClientRect().top >= document.querySelector('.atlas-wb-topbar').getBoundingClientRect().bottom - 1), 'Bottom sheet covers the top bar')
            await page.setViewportSize({ width, height })
            // The host shrinks the editor without a window resize: the context bar must follow the canvas.
            await closePanels(page)
            // The floating bar of the previously selected block may cover its neighbour; reselect from the top.
            await page.locator('[data-block-id="heading"]').tap()
            await page.locator('[data-block-id="link"]').tap()
            const host = page.locator('[data-fixture-session]')
            await host.evaluate(node => { node.style.height = '360px' })
            await expect.poll(() => page.evaluate(() => { const node = document.querySelector('.atlas-wb-block__toolbar'), bar = node.getBoundingClientRect(), canvas = document.querySelector('.atlas-wb-canvas').getBoundingClientRect(); return getComputedStyle(node).visibility === 'hidden' || (bar.top >= canvas.top - 1 && bar.bottom <= canvas.bottom + 1) })).toBe(true)
            await host.evaluate(node => { node.style.height = '100dvh' })
          }
          if (width === 390) assert(await page.locator('.atlas-wb-panel--right').evaluate(node => parseFloat(getComputedStyle(node).transitionDuration) < .001), 'Reduced motion')
          assert.deepEqual(errors, [])
          results.push({ browser: name, react: await page.evaluate(() => window.atlasReactVersion), viewport: [width, height], appearances: 3, edits: true, roundtrip: true, undoRedo: true, capabilities: 'preserved', overlays: true, overflow: false, keyboard: true, emulatedTouch: compact, pointerDrag: width === 1440 ? 'mouse' : width === 390 ? name === 'chromium' ? 'CDP touch' : 'synthetic TouchEvents' : undefined })
          console.log(`${name} ${width}x${height}: passed`)
        } catch (error) {
          if (errors.length) console.error('Browser errors:', errors)
          await page.screenshot({ path: resolve(output, `${name}-${width}-failure.png`) }).catch(() => {})
          results.push({ browser: name, viewport: [width, height], failed: error.message })
          throw error
        } finally { await context.close() }
      }
      const controls = await browser.newPage({ viewport: { width: 390, height: 844 } })
      controls.setDefaultTimeout(8000)
      await checkControls(controls, url, expect)
      results.push({ browser: name, controls: 'combobox/units/switch/number/color/popover/tooltip passed' })
      await controls.close()
      const edges = await browser.newPage({ viewport: { width: 1440, height: 900 } })
      edges.setDefaultTimeout(8000)
      results.push({ browser: name, edges: await checkEdges(edges, url, name, expect) })
      await edges.close()
    } finally { await browser.close() }
  }
} finally { await server.close(); writeFileSync(resolve(output, 'browser-results.json'), JSON.stringify(results, null, 2)) }
console.log(JSON.stringify(results, null, 2))
