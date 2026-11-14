// Playground landing: ColumnsBlock stacking and overflow in canvas (per device) and preview.
// Local loopback server only. Usage: ATLAS_BROWSER_TOOLS=<playwright package.json> node scripts/verify-playground-columns.mjs
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import { assertColumns, measureColumns } from '../tests/browser/columnsChecks.mjs'

const require = createRequire(process.env.ATLAS_BROWSER_TOOLS || import.meta.url)
const { chromium, webkit, expect } = require('@playwright/test')
const root = realpathSync.native(resolve('examples/playground'))
const server = await createServer({ configFile: resolve(root, 'vite.config.js'), root, logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } })
await server.listen()
const url = `http://127.0.0.1:${server.httpServer.address().port}/`
const DEVICES = { mobile: ['Móvil', 'Teléfono', 390], tablet: ['Tableta', 'Tableta', 834], desktop: ['Escritorio', 'Escritorio', 1280] }
const results = []
try {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch()
    try {
      for (const width of [320, 390, 768, 1440]) {
        const compact = width <= 1100
        const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: compact, isMobile: width <= 600 })
        page.setDefaultTimeout(10000)
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        try {
          await page.goto(url)
          await page.locator('.atlas-wb-canvas__frame .atlas-cols').first().waitFor()
          for (const [device, [desktopLabel, menuLabel, frame]] of Object.entries(DEVICES)) {
            if (compact) { await page.getByRole('button', { name: 'Más acciones', exact: true }).click(); await page.getByRole('menuitemradio', { name: menuLabel, exact: true }).click() }
            else await page.getByRole('radio', { name: desktopLabel, exact: true }).click()
            await expect.poll(() => page.locator('.atlas-wb-canvas__frame').evaluate(node => node.offsetWidth)).toBe(frame)
            assertColumns(await measureColumns(page, '.atlas-wb-canvas__frame'), `${name} playground canvas ${width} ${device}`, device === 'mobile' ? { forceStacked: true } : { forceColumns: true })
          }
          await page.getByRole('button', { name: 'Vista previa', exact: true }).click()
          await page.locator('.atlas-wb-preview .atlas-cols').first().waitFor()
          assertColumns(await measureColumns(page, '.atlas-wb-preview'), `${name} playground preview ${width}`)
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} playground ${width}: horizontal overflow`)
          if (width === 390 && name === 'chromium') {
            await page.locator('.atlas-wb-preview .atlas-cols').nth(1).scrollIntoViewIfNeeded()
            await page.screenshot({ path: resolve('.artifacts/playground-columns-390-preview.png') })
          }
          assert.deepEqual(errors, [])
          results.push(`${name} ${width}`)
        } finally { await page.close() }
      }
    } finally { await browser.close() }
  }
} finally { await server.close() }
console.log(`Playground columns: canvas (mobile/tablet/desktop) and preview passed for ${results.join(', ')}`)
