import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(process.env.ATLAS_BROWSER_TOOLS || import.meta.url)
const { chromium, webkit, expect } = require('@playwright/test')
const baseline = !!process.env.ATLAS_BOUNDARY_BASELINE
const output = resolve(`.artifacts/block-boundaries/${baseline ? 'before' : 'after'}`)
mkdirSync(output, { recursive: true })
const server = await createServer({ configFile: false, root: realpathSync.native(resolve('tests/browser')), plugins: [react()], server: { host: '127.0.0.1', port: 0, fs: { allow: [process.cwd()] } } })
await server.listen()
const url = `http://127.0.0.1:${server.httpServer.address().port}`, results = []
const settle = page => page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))))
const geometry = page => page.locator('.atlas-wb-canvas__frame [data-block-id], .atlas-wb-canvas__frame [data-block-id] > :last-child').evaluateAll(nodes => nodes.map(node => {
  const r = node.getBoundingClientRect(), frame = node.closest('.atlas-wb-canvas__frame').getBoundingClientRect()
  return [r.x - frame.x, r.y - frame.y, r.width, r.height]
}))
try {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch()
    try {
      for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: true, colorScheme: width === 390 ? 'dark' : 'light', reducedMotion: 'reduce' })
        const errors = []; page.on('pageerror', error => errors.push(error.message))
        await page.goto(url)
        const section = page.locator('[data-block-id="section"]'), heading = page.locator('[data-block-id="heading"]')
        await expect(section).toBeVisible()
        for (const zoom of ['fit', '1', '0.25', '1.5']) {
          await page.evaluate(() => window.atlasTest.clearSelection())
          await page.getByRole('combobox', { name: 'Zoom del lienzo', exact: true }).selectOption(zoom)
          await section.scrollIntoViewIfNeeded()
          const before = await geometry(page)
          await section.getByRole('button', { name: 'Seleccionar Sección', exact: true }).focus()
          await page.keyboard.press('Enter')
          await expect(section).toHaveAttribute('data-selected', 'true')
          await page.getByRole('combobox', { name: 'Zoom del lienzo', exact: true }).focus()
          await settle(page)
          const painted = await section.evaluate(el => {
            const s = getComputedStyle(el, '::after')
            const scale = new DOMMatrix(getComputedStyle(el.closest('.atlas-wb-canvas__frame')).transform).a
            return { content: s.content, position: s.position, events: s.pointerEvents, shadow: s.boxShadow, thickness: parseFloat(s.boxShadow.match(/[\d.]+px/g)?.at(-1)), z: s.zIndex, scale }
          })
          if (!baseline) {
            assert.equal(painted.position, 'absolute')
            assert.equal(painted.events, 'none')
            assert(!painted.shadow.includes('rgba(0, 0, 0, 0)'), 'Selected boundary must be visible')
            assert(Math.abs(painted.thickness * painted.scale - 2) < .03, 'Outline stays 2 screen pixels at every zoom')
            assert(Number(painted.z) > 0, 'Outline paints above opaque block content')
          }
          assert.deepEqual(await geometry(page), before, 'Selecting a block must not move or resize content')
          if (zoom === 'fit') await page.screenshot({ path: resolve(output, `${name}-${width}-section.png`) })
          // Clear the floating toolbar (it can cover a tiny block at 25%); test decoration hit testing separately.
          await page.evaluate(() => window.atlasTest.clearSelection())
          await heading.tap()
          await expect(heading).toHaveAttribute('data-selected', 'true')
          await settle(page)
          if (!baseline) {
            const colors = await heading.evaluate(el => {
              const style = getComputedStyle(el)
              return [style.getPropertyValue('--awb-block-outline').trim(), style.getPropertyValue(el.classList.contains('atlas-wb-block--editing') ? '--awb-selection' : '--awb-ring').trim()]
            })
            assert.equal(colors[0], colors[1], 'Hover must not dim selected or inline-editing boundaries')
          }
          assert.deepEqual(await geometry(page), before, 'Selecting a nested block must not change the layout')
          if (zoom === 'fit') await page.screenshot({ path: resolve(output, `${name}-${width}-nested.png`) })
          results.push({ browser: name, width, zoom, painted, layoutUnchanged: true })
        }
        assert.deepEqual(errors, [])
        await page.close()
      }
    } finally { await browser.close() }
  }
} finally {
  await server.close()
  writeFileSync(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
}
console.log(`Block boundaries: ${results.length} cases passed (${baseline ? 'baseline capture' : 'visibility, zoom, geometry and touch'}).`)
