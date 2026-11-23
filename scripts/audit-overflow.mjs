// Reusable horizontal-overflow audit (acceptance criterion 6): loads a URL at each width, scrolls the whole page so reveals and
// parallax have run, waits for motion to settle and reports every offender. Exported for the Atlas matrix, the Hub and the ERP tests;
// it also works as a CLI: node scripts/audit-overflow.mjs <url> [widths...]
import { pathToFileURL } from 'node:url'

export const DEFAULT_WIDTHS = Object.freeze([320, 375, 414, 768, 1024, 1280, 1440, 1920])

/** Runs in the page: elements that stick out of the viewport horizontally (excluding fixed/absolute off-screen helpers). */
export const measureOverflow = () => {
  const viewport = document.documentElement.clientWidth
  const offenders = []
  for (const element of document.body.querySelectorAll('*')) {
    const rect = element.getBoundingClientRect()
    if (!rect.width || !rect.height) continue
    const style = getComputedStyle(element)
    if (style.position === 'fixed' || style.visibility === 'hidden' || style.display === 'none') continue
    if (rect.right > viewport + 1 || rect.left < -1) {
      // An element clipped by an ancestor does not scroll the page; only report it when nothing clips it.
      let clipped = false
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const overflow = getComputedStyle(parent).overflowX
        if (['hidden', 'clip', 'auto', 'scroll'].includes(overflow)) { clipped = true; break }
      }
      if (!clipped) offenders.push({ tag: element.tagName.toLowerCase(), className: String(element.className).slice(0, 80), left: Math.round(rect.left), right: Math.round(rect.right) })
    }
  }
  return {
    viewport,
    scrollWidth: document.documentElement.scrollWidth,
    pageScrolls: document.documentElement.scrollWidth > viewport + 1 || document.body.scrollWidth > viewport + 1,
    offenders: offenders.slice(0, 20),
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ url: string, widths?: number[], height?: number, settleMs?: number }} options
 * @returns {Promise<Array<{ width: number, viewport: number, scrollWidth: number, pageScrolls: boolean, offenders: object[] }>>}
 */
export async function auditOverflow(page, { url, widths = DEFAULT_WIDTHS, height = 900, settleMs = 900 }) {
  const results = []
  for (const width of widths) {
    await page.setViewportSize({ width, height })
    await page.goto(url, { waitUntil: 'load' })
    await page.evaluate(async () => {
      const step = Math.max(200, innerHeight / 2)
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((done) => setTimeout(done, 40)) }
      scrollTo(0, document.documentElement.scrollHeight)
    })
    await page.waitForTimeout(settleMs)
    results.push({ width, ...(await page.evaluate(measureOverflow)) })
  }
  return results
}

export const overflowFailures = (results) => results.filter((result) => result.pageScrolls || result.offenders.length)

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { tools } = await import('./lib/browser.mjs')
  const [url, ...widths] = process.argv.slice(2)
  if (!url) { console.error('usage: node scripts/audit-overflow.mjs <url> [widths...]'); process.exit(2) }
  const browser = await tools().playwright.chromium.launch()
  try {
    const results = await auditOverflow(await browser.newPage(), { url, widths: widths.length ? widths.map(Number) : DEFAULT_WIDTHS })
    console.log(JSON.stringify(results, null, 2))
    process.exitCode = overflowFailures(results).length ? 1 : 0
  } finally { await browser.close() }
}
