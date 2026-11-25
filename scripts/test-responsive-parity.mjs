import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync, realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const engines = createRequire(process.env.ATLAS_BROWSER_TOOLS || import.meta.url)('playwright')
const browserName = process.env.ATLAS_TEST_BROWSER || 'chromium'
assert.ok(['chromium', 'webkit'].includes(browserName))
const server = await createServer({ configFile: false, root: realpathSync.native(resolve('tests/browser')), plugins: [react()], server: { host: '127.0.0.1', port: 0, fs: { allow: [process.cwd()] } } })
await server.listen()
const browser = await engines[browserName].launch({ headless: true })
async function checkFixture(revision8) {
  const output = resolve('.artifacts/responsive-parity', browserName, revision8 ? 'revision8' : 'synthetic', process.env.ATLAS_RECORD_BASELINE ? 'before' : 'after')
  mkdirSync(output, { recursive: true })
  const results = [], failures = [], errors = []
  const page = await browser.newPage()
  try {
    page.on('pageerror', error => errors.push(error.message))
    for (const width of [320, 390, 768, 1280, 1440]) {
      const modes = {}
      for (const mode of ['edit', 'preview', 'public']) {
        await page.setViewportSize({ width: mode === 'edit' ? width + 640 : width, height: 1100 })
        await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/responsive-parity.html?mode=${mode}&width=${width}${revision8 ? '&revision8' : ''}`)
        await page.locator(`[data-atlas-block="${revision8 ? 'block-17' : 'floating'}"]`).waitFor()
        await page.evaluate(() => document.fonts.ready)
        await page.evaluate(() => Promise.all([...document.images].map(img => img.decode().catch(() => {}))))
        await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))))
        modes[mode] = await page.evaluate(() => {
          const root = document.querySelector('.atlas-wb-canvas__frame,[data-atlas-page]'), origin = root.getBoundingClientRect()
          return Object.fromEntries([...root.querySelectorAll('[data-atlas-block]')].map(node => {
            const r = node.getBoundingClientRect(), css = getComputedStyle(node), geometry = getComputedStyle(node.closest('.atlas-element-item') || node)
            return [node.dataset.atlasBlock, { x: r.x - origin.x, y: r.y - origin.y, width: r.width, height: r.height, background: css.backgroundColor, backgroundImage: css.backgroundImage, minWidth: geometry.minWidth, flex: geometry.flex }]
          }))
        })
        await page.screenshot({ path: resolve(output, `${width}-${mode}.png`), fullPage: true })
      }
      results.push({ width, ...modes })
      for (const mode of ['preview', 'public']) {
        for (const [id, editor] of Object.entries(modes.edit)) {
          for (const key of ['x', 'y', 'width', 'height']) {
            if (Math.abs(editor[key] - modes[mode][id][key]) > 1) failures.push(`${width}/${mode}/${id}/${key}: editor=${editor[key]} render=${modes[mode][id][key]}`)
          }
          if (editor.background !== modes[mode][id].background) failures.push(`${width}/${mode}/${id}: background differs`)
        }
        const rendered = modes[mode]
        if (revision8) {
          if (rendered['block-13'].width < width * .3) failures.push(`${width}/${mode}: collapsed revision 8 description`)
          for (const id of ['block-8', 'block-9', 'block-11', 'block-12', 'block-13', 'block-17']) {
            if (rendered[id].background !== 'rgba(0, 0, 0, 0)' || rendered[id].backgroundImage !== 'none') failures.push(`${width}/${mode}/${id}: leaked section background`)
          }
          continue
        }
        if (rendered.title.width < (width - 48) * (width < 640 ? .9 : .4)) failures.push(`${width}/${mode}: collapsed title`)
        for (const id of ['title', 'eyebrow', 'description', 'arrow', 'product']) {
          if (rendered[id].background !== 'rgba(0, 0, 0, 0)') failures.push(`${width}/${mode}/${id}: leaked background ${rendered[id].background}`)
          if (rendered[id].backgroundImage !== 'none') failures.push(`${width}/${mode}/${id}: leaked background image`)
        }
        const expectedWidth = width < 640 ? width * .8 : width < 1024 ? 200 : 240
        if (Math.abs(rendered.floating.width - expectedWidth) > 1 || Math.abs(rendered.floating.x - (width - expectedWidth) / 2) > 1 || rendered.floating.height !== 80) failures.push(`${width}/${mode}: free geometry`)
        if (rendered.badge.width < 150 || rendered.eyebrow.height > 45) failures.push(`${width}/${mode}: collapsed intrinsic box`)
        if (rendered.hero.background !== (width < 640 ? 'rgb(239, 228, 228)' : width < 1024 ? 'rgb(228, 234, 240)' : 'rgb(239, 236, 228)')) failures.push(`${width}/${mode}: section background`)
        if (Math.abs(rendered.product.width / rendered.product.height - 1.333333) > .01) failures.push(`${width}/${mode}: image ratio`)
        if (rendered.visual.minWidth !== (width >= 640 && width < 1024 ? '120px' : '0px')) failures.push(`${width}/${mode}: minWidth`)
        const columns = width < 640 ? 1 : width < 1024 ? 2 : 3
        if (Math.abs(rendered['grid-a'].width - (width - 16 * (columns - 1)) / columns) > 1) failures.push(`${width}/${mode}: grid columns`)
        const limit = Math.min(width - 32, width < 640 ? 300 : 600)
        if (Math.abs(rendered['limited-text'].width - limit) > 1 || Math.abs(rendered['limited-text'].x - (width - limit) / 2) > 1 || rendered.limited.width !== width) failures.push(`${width}/${mode}: full bleed container`)
      }
    }
    writeFileSync(resolve(output, 'geometry.json'), JSON.stringify({ results, failures, errors }, null, 2))
    console.log(JSON.stringify({ output, failureCount: failures.length, failures: failures.slice(0, 25), errors }, null, 2))
    if (!process.env.ATLAS_RECORD_BASELINE) { assert.deepEqual(errors, []); assert.deepEqual(failures, []) }
  } finally { await page.close() }
}
try {
  for (const revision8 of process.env.ATLAS_REVISION8 === undefined ? [false, true] : [process.env.ATLAS_REVISION8 === '1']) await checkFixture(revision8)
} finally { await browser.close(); await server.close() }
