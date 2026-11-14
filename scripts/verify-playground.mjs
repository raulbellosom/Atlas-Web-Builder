import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const url = process.argv[2]
assert(url && /^http:\/\/(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url), 'Pass the private LAN URL printed by playground:lan')
const require = createRequire(process.env.ATLAS_BROWSER_TOOLS || import.meta.url)
const { chromium, expect } = require('@playwright/test')
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const errors = [], external = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (!request.url().startsWith(new URL(url).origin) && /^https?:/.test(request.url())) external.push(new URL(request.url()).origin) })
  await page.goto(url)
  await page.getByRole('button', { name: 'Reabrir guardado' }).tap()
  await expect(page.getByRole('status', { name: 'Estado del playground' })).toContainText('No hay borrador')
  await page.locator('[data-block-id="blk_heading"]').tap()
  await page.getByRole('button', { name: 'Propiedades', exact: true }).tap()
  await page.getByLabel('Texto', { exact: true }).fill('Guardado desde la prueba LAN')
  await page.getByRole('button', { name: 'Cerrar inspector' }).tap()
  await page.getByRole('button', { name: 'Más acciones', exact: true }).tap()
  await page.getByRole('menuitem', { name: 'Guardar borrador', exact: true }).tap()
  await expect(page.getByRole('status', { name: 'Estado del playground' })).toContainText('Borrador guardado')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('atlas-playground-0.5.0-page')))
  assert.equal(saved.blocks.blk_heading.props.text, 'Guardado desde la prueba LAN')
  assert.deepEqual(saved.blocks.blk_nested.props.customHistorical, { keep: true })
  assert.equal(saved.blocks.blk_image.props.src, '/mobile-sample.svg')
  await page.reload()
  await page.getByRole('button', { name: 'Reabrir guardado' }).tap()
  await expect(page.locator('[data-block-id="blk_heading"]')).toContainText('Guardado desde la prueba LAN')
  await page.evaluate(() => localStorage.setItem('atlas-playground-0.5.0-page', '{invalid'))
  await page.getByRole('button', { name: 'Reabrir guardado' }).tap()
  await expect(page.getByRole('status', { name: 'Estado del playground' })).toContainText('No se pudo reabrir')
  await expect(page.locator('[data-block-id="blk_heading"]')).toContainText('Guardado desde la prueba LAN')
  assert.equal(await page.evaluate(() => localStorage.getItem('atlas-playground-0.5.0-page')), '{invalid')
  assert.equal(await page.locator('body').evaluate(node => node.scrollWidth > innerWidth), false)
  // The test bench footer follows the editor appearance (it stayed white in dark mode before 1.2).
  await page.getByRole('button', { name: 'Más acciones', exact: true }).tap()
  await page.getByRole('menuitemradio', { name: 'Oscuro', exact: true }).tap()
  await expect(page.locator('.pg-shell')).toHaveAttribute('data-theme', 'dark')
  assert.equal(await page.locator('.pg-bench').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(11, 12, 16)')
  assert.deepEqual(errors, [])
  assert.deepEqual(external, [])
  for (const path of ['.env', '.git/HEAD', '.artifacts/releases/0.5.0/pack.json']) {
    const request = await fetch(`${new URL(url).origin}/@fs/${resolve(path).replaceAll('\\', '/')}`)
    assert.equal(request.status, 403, `Sensitive path must be denied: ${path}`)
  }
  console.log('LAN playground: edit, save, reload, reopen, historical data, local image, no external requests, no horizontal overflow and denied sensitive paths passed. Emulated Chromium only.')
} finally { await browser.close() }
