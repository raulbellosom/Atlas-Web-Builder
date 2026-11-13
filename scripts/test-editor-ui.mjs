import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

// An existing browser tool installation can be reused without changing runtime dependencies.
const require = createRequire(process.env.ATLAS_BROWSER_TOOLS || import.meta.url)
const { chromium, webkit, expect } = require('@playwright/test')
const root = process.cwd(), output = resolve('.artifacts/phase-1')
mkdirSync(output, { recursive: true })
const server = await createServer({ configFile: false, root: resolve('tests/browser'), plugins: [react()], server: { host: '127.0.0.1', port: 0, fs: { allow: [root] } } })
await server.listen()
const address = server.httpServer.address(), url = `http://127.0.0.1:${address.port}`
const results = []
try {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    let browser
    try { browser = await engine.launch({ headless: true }) }
    catch (error) { if (name === 'webkit') { results.push({ browser: name, unavailable: error.message }); continue } throw error }
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' })
      const page = await context.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(url)
      await page.locator('[data-block-id="heading"]').click()
      await page.getByLabel('Texto', { exact: true }).fill('Contenido conservado')
      const history = await page.evaluate(() => window.atlasTest.history())
      await page.getByLabel('Apariencia del editor').selectOption('dark')
      await page.locator('.atlas-wb-editor-scope[data-appearance="dark"]').waitFor()
      await expect(page.locator('.atlas-wb-palette__item').first()).toHaveCSS('background-color', 'rgb(25, 31, 43)')
      assert.equal(await page.locator('.atlas-wb-canvas__frame').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)')
      assert.equal(await page.locator('[data-block-id="heading"]').getAttribute('aria-pressed'), 'true')
      assert.equal(await page.evaluate(() => window.atlasTest.history()), history)
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--awb-bg')), '')
      await page.screenshot({ path: resolve(output, `${name}-appearance-dark.png`) })
      await page.getByLabel('Apariencia del editor').selectOption('system')
      await page.emulateMedia({ colorScheme: 'light' })
      await page.locator('.atlas-wb-editor-scope[data-appearance="light"]').waitFor()
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.locator('.atlas-wb-editor-scope[data-appearance="dark"]').waitFor()
      await page.getByRole('button', { name: /Guardar borrador/ }).click()
      assert.equal(await page.evaluate(() => window.atlasTest.saved().blocks.heading.props.text), 'Contenido conservado')
      assert.deepEqual(errors, [])
      results.push({ browser: name, appearance: 'light/dark/system passed', canvasWhite: true, selectionAndHistory: true })
      await context.close()
    } finally { await browser.close() }
  }
} finally { await server.close(); writeFileSync(resolve(output, 'browser-results.json'), JSON.stringify(results, null, 2)) }
console.log(JSON.stringify(results, null, 2))
