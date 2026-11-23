// Phase 3 browser matrix (Chromium + WebKit): server-rendered visibility, no-JS, reduced motion, CLS, overflow sweep 320-1920,
// touch vs pointer states, fluid type, focal point, Ken Burns clipping and hydration. Runs against the CURRENT source.
// Usage: node scripts/verify-motion-responsive.mjs [--url <page>]   (with --url it only runs the overflow sweep on that page)
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { bundle, inEngines, page as html, root, serve, tools } from './lib/browser.mjs'
import { DEFAULT_WIDTHS, auditOverflow, overflowFailures } from './audit-overflow.mjs'

const src = root.replaceAll('\\', '/')
const { sharp } = tools()

// 1600x800 PNG so cover-cropping is real at every width.
const png = await sharp({ create: { width: 1600, height: 800, channels: 3, background: '#3b5bdb' } }).png().toBuffer()
const dataUrl = `data:image/png;base64,${png.toString('base64')}`

export const fixturePage = () => ({
  schemaVersion: 1, id: 'motion', slug: '/', title: 'Motion', visibility: 'public', seo: {},
  regions: { main: { id: 'main', children: ['headline', 'intro', 'spacer', 'reveal', 'kb', 'photo', 'slide', 'cta'] } },
  blocks: {
    headline: { id: 'headline', type: 'TextElementBlock', props: { text: 'Titular fluido', tag: 'h1', widthMode: 'fill', fluidType: true, fontSizeMin: 20, fontSizeMax: 48, fluidMinViewport: 360, fluidMaxViewport: 1280, _animation: { preset: 'slide-up', distance: 60, duration: 700 } }, children: {} },
    intro: { id: 'intro', type: 'TextElementBlock', props: { text: 'Texto de entrada visible desde el servidor', widthMode: 'fill', _animation: { preset: 'blur-in', blur: 12 }, _scrollReveal: true }, children: {} },
    spacer: { id: 'spacer', type: 'BoxBlock', props: { widthMode: 'fill', minHeight: 1400 }, children: { children: [] } },
    reveal: { id: 'reveal', type: 'TextElementBlock', props: { text: 'Aparece al hacer scroll', widthMode: 'fill', _animation: { preset: 'zoom-in', scaleFrom: 0.8 }, _scrollReveal: true, _parallax: { speed: 0.25 } }, children: {} },
    kb: { id: 'kb', type: 'ImageElementBlock', props: { src: dataUrl, alt: 'Ken Burns', widthMode: 'fill', fit: 'cover', imageHeight: 320, focalX: 20, focalY: 30, mobileFocalX: 60, mobileFocalY: 40, _kenburns: { zoom: 1.2, pan: 'left', duration: 6000 } }, children: {} },
    photo: { id: 'photo', type: 'ImageBlock', props: { src: dataUrl, alt: 'Foto', aspectRatio: '16 / 9', objectFit: 'cover', width: '100%', focalX: 20, focalY: 30, mobileFocalX: 60, mobileFocalY: 40 }, children: {} },
    slide: { id: 'slide', type: 'TextElementBlock', props: { text: 'Entra desde la derecha', widthMode: 'fill', _animation: { preset: 'slide-left', distance: 400 }, _scrollReveal: true }, children: {} },
    cta: { id: 'cta', type: 'ButtonElementBlock', props: { label: 'Comprar', href: '#', _hover: { scale: '1.05', duration: 100 }, _pressed: { scale: 0.95 } }, children: {} },
  },
})

const common = `
import React from 'react'
import { AtlasWebBuilderProvider, AtlasWebRenderer, baseBlocks } from '${src}/src/index.js'
import '${src}/src/styles/elements.css'
import '${src}/src/styles/motion.css'
const page = ${JSON.stringify(fixturePage())}
const View = () => <AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={page} mode="public" /></AtlasWebBuilderProvider>
`
const ssrBundle = await bundle(`${common}
import { renderToString } from 'react-dom/server'
module.exports = { html: () => renderToString(<View />) }`, { platform: 'node', format: 'cjs' })
const clientBundle = await bundle(`${common}
import { hydrateRoot } from 'react-dom/client'
window.__hydrated = false
hydrateRoot(document.getElementById('root'), <View />, { onRecoverableError: (error) => { window.__hydrationErrors = [...(window.__hydrationErrors ?? []), String(error.message)] } })
window.__hydrated = true`)
const module_ = { exports: {} }
new Function('module', 'exports', 'require', ssrBundle.js)(module_, module_.exports, createRequire(`${root}/package.json`))
const serverHtml = module_.exports.html()
const doc = (js = true) => html({ js: js ? clientBundle.js : '', css: clientBundle.css, body: `<div id="root">${serverHtml}</div>` })

const server = await serve({ '/page': { body: doc(true) }, '/nojs': { body: doc(false) } })
const evidence = { generatedAt: new Date().toISOString(), checks: [] }
const check = (engine, name, detail = {}) => evidence.checks.push({ engine, name, ...detail })

try {
  const argUrl = process.argv.includes('--url') ? process.argv[process.argv.indexOf('--url') + 1] : null
  if (argUrl) {
    const results = await inEngines(async (page) => ({ failures: overflowFailures(await auditOverflow(page, { url: argUrl })) }))
    for (const result of results) assert.deepEqual(result.failures, [], `${result.engine}: overflow at ${argUrl}`)
    console.log(JSON.stringify({ ok: true, url: argUrl, engines: results.map((r) => r.engine) }))
    process.exit(0)
  }

  // Criterion 3: the server markup never hides content.
  assert.ok(serverHtml.includes('Texto de entrada visible desde el servidor'))
  assert.ok(!/opacity:\s*0(?![.\d])/.test(serverHtml) && !serverHtml.includes('atlas-reveal--pending') && !/visibility:\s*hidden/.test(serverHtml), 'server HTML hides content')
  check('server', 'ssr-visible')

  const all = await inEngines(async (page, engine, errors) => {
    // JavaScript disabled: everything is visible and in final position.
    const noJs = await page.context().browser().newContext({ javaScriptEnabled: false })
    const bare = await noJs.newPage()
    await bare.goto(`${server.origin}/nojs`)
    await bare.waitForTimeout(1200) // CSS entrances (no script needed) finish well within this
    for (const text of ['Titular fluido', 'Texto de entrada visible desde el servidor', 'Aparece al hacer scroll', 'Entra desde la derecha']) {
      const opacity = await bare.getByText(text).evaluate((node) => { let value = 1; for (let n = node; n; n = n.parentElement) value *= Number(getComputedStyle(n).opacity); return value })
      assert.equal(opacity, 1, `${engine}: "${text}" is fully opaque without JavaScript`)
    }
    await noJs.close(); check(engine, 'no-js-visible')

    // Hydration, CLS and the overflow sweep (criteria 5 and 6).
    await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value }).observe({ type: 'layout-shift', buffered: true }) })
    const sweep = await auditOverflow(page, { url: `${server.origin}/page`, widths: DEFAULT_WIDTHS })
    assert.deepEqual(overflowFailures(sweep), [], `${engine}: horizontal overflow ${JSON.stringify(overflowFailures(sweep))}`)
    check(engine, 'overflow-sweep', { widths: DEFAULT_WIDTHS })
    assert.equal(await page.evaluate(() => window.__hydrated), true)
    assert.equal(await page.evaluate(() => window.__hydrationErrors ?? []).then((e) => e.length), 0, `${engine}: hydration mismatches`)
    if (engine === 'chromium') assert.ok((await page.evaluate(() => window.__cls)) < 0.0001, `${engine}: layout shift ${await page.evaluate(() => window.__cls)}`)
    check(engine, 'hydration-and-cls')

    // Criterion 8: fluid type follows the page width.
    const sizes = {}
    for (const width of [360, 820, 1280]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(`${server.origin}/page`)
      sizes[width] = await page.getByText('Titular fluido').evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
    }
    assert.ok(Math.abs(sizes[360] - 20) < 0.6 && Math.abs(sizes[820] - 34) < 0.8 && Math.abs(sizes[1280] - 48) < 0.6, `${engine}: fluid sizes ${JSON.stringify(sizes)}`)
    check(engine, 'fluid-type', { sizes })

    // Criterion 9: focal points per device.
    const focal = {}
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(`${server.origin}/page`)
      focal[width] = await page.evaluate(() => [document.querySelector('img[alt="Foto"]'), document.querySelector('img[alt="Ken Burns"]')].map((img) => getComputedStyle(img).objectPosition))
    }
    assert.deepEqual(focal[1280], ['20% 30%', '20% 30%'], `${engine}: desktop focal ${focal[1280]}`)
    assert.deepEqual(focal[390], ['60% 40%', '60% 40%'], `${engine}: mobile focal ${focal[390]}`)
    check(engine, 'focal-point', { focal })

    // Criterion 10: Ken Burns keeps the layout box and clips.
    await page.setViewportSize({ width: 1280, height: 900 }); await page.goto(`${server.origin}/page`)
    const frame = await page.locator('.atlas-kenburns').first().evaluate((node) => ({ overflow: getComputedStyle(node).overflowX, box: node.getBoundingClientRect().height, layer: getComputedStyle(node.firstElementChild).animationName, imgBox: node.querySelector('img').getBoundingClientRect().height }))
    assert.equal(frame.overflow, 'clip'); assert.equal(frame.layer, 'atlas-kenburns'); assert.ok(Math.abs(frame.box - 320) < 2, `${engine}: kenburns frame height ${frame.box}`)
    check(engine, 'kenburns-clip', frame)

    // Criterion 7 (pointer half): hover scales, pressing shrinks, and the rules are fenced for touch.
    const cta = page.getByText('Comprar')
    const wrapper = page.locator('[data-eid]').first()
    const scaleOf = () => wrapper.evaluate((node) => { const m = getComputedStyle(node).transform; return m === 'none' ? 1 : Number(m.match(/matrix\(([^,]+)/)[1]) })
    await cta.scrollIntoViewIfNeeded()
    await cta.hover(); await page.waitForTimeout(300)
    assert.ok(Math.abs((await scaleOf()) - 1.05) < 0.01, `${engine}: hover scale ${await scaleOf()}`)
    await page.mouse.down(); await page.waitForTimeout(300)
    assert.ok(Math.abs((await scaleOf()) - 0.95) < 0.01, `${engine}: pressed scale ${await scaleOf()}`)
    await page.mouse.up()
    check(engine, 'pointer-states')
    assert.deepEqual(errors.filter((message) => !/Failed to load resource/.test(message)), [], `${engine}: console errors`)
    return {}
  })
  void all

  // Criterion 7 (touch half): no hover on touch devices, and the media guard is present.
  await inEngines(async (page, engine) => {
    await page.goto(`${server.origin}/page`)
    assert.equal(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches), false, `${engine}: touch emulation`)
    await page.getByText('Comprar').scrollIntoViewIfNeeded()
    await page.getByText('Comprar').tap()
    await page.waitForTimeout(300)
    const transform = await page.locator('[data-eid]').first().evaluate((node) => getComputedStyle(node).transform)
    assert.equal(transform, 'none', `${engine}: hover must not stick after a tap (${transform})`)
    check(engine, 'touch-no-sticky-hover')
    return {}
  }, { context: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } })

  // Criterion 4: reduced motion removes every effect animation and leaves content visible.
  await inEngines(async (page, engine) => {
    await page.goto(`${server.origin}/page`)
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise((done) => setTimeout(done, 30)) } })
    await page.waitForTimeout(500)
    const state = await page.evaluate(() => ({
      running: document.getAnimations().filter((a) => /^atlas-/.test(a.animationName ?? '')).map((a) => a.animationName),
      pending: document.querySelectorAll('.atlas-reveal--pending').length,
      parallax: [...document.querySelectorAll('.atlas-wb-effects-wrap')].some((node) => node.querySelector('[style*="translate3d"]')),
    }))
    assert.deepEqual(state, { running: [], pending: 0, parallax: false }, `${engine}: reduced motion ${JSON.stringify(state)}`)
    check(engine, 'reduced-motion')
    return {}
  }, { context: { reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } } })

  mkdirSync(resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', '.artifacts'), { recursive: true })
  writeFileSync(resolve(root, '.artifacts', 'motion-responsive-evidence.json'), JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify({ ok: true, checks: evidence.checks.length, byEngine: Object.fromEntries(['chromium', 'webkit'].map((e) => [e, evidence.checks.filter((c) => c.engine === e).map((c) => c.name)])) }, null, 1))
} finally { await server.close() }
