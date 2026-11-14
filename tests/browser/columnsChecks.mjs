import assert from 'node:assert/strict'

/** Measures every ColumnsBlock inside `scope`. Container width is the layout width of the
 * block (offsetWidth, unscaled), which is what the container query sees. */
export const measureColumns = (page, scope) => page.evaluate(scope => [...document.querySelectorAll(`${scope} .atlas-cols`)].map(wrapper => {
  const grid = wrapper.querySelector(':scope > .atlas-cols__grid'), cols = [...grid.children]
  const stack = wrapper.classList.contains('atlas-cols--stack')
  const outside = (el, box) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1) }
  // Text, images and buttons of every card must be fully inside their column (no clipping).
  const clipped = cols.flatMap(col => { const box = col.getBoundingClientRect(); return [...col.querySelectorAll('img, a, p, h1, h2, h3, h4')].filter(el => outside(el, box) || el.scrollWidth > el.clientWidth + 1).map(el => el.tagName) })
  return { id: wrapper.closest('[data-block-id]')?.dataset.blockId, count: cols.length, columns: new Set(cols.map(c => Math.round(c.getBoundingClientRect().left))).size, stack, width: wrapper.offsetWidth, clipped }
}), scope)

export function assertColumns(list, where, { forceStacked, forceColumns } = {}) {
  assert(list.length > 0, `${where}: no ColumnsBlock found`)
  for (const item of list) {
    const shouldStack = item.stack && (forceStacked ?? (forceColumns ? false : item.width < 640))
    assert.equal(item.columns, shouldStack ? 1 : item.count, `${where} ${item.id}: width ${item.width}, stack=${item.stack}, ${item.columns}/${item.count} columns`)
    if (shouldStack || item.width / item.count >= 150) assert.deepEqual(item.clipped, [], `${where} ${item.id}: clipped card content`)
  }
}

const noHostOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)

export async function checkColumns(browser, url, expect) {
  const summary = []
  for (const width of [320, 390, 768, 1440]) {
    const compact = width <= 1100
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: compact, isMobile: width <= 600 })
    page.setDefaultTimeout(8000)
    try {
      // Public renderer: the page is as wide as the viewport.
      await page.goto(`${url}/?columns&render`)
      await page.locator('.atlas-cols').first().waitFor()
      assertColumns(await measureColumns(page, 'body'), `renderer ${width}`)
      assert(await noHostOverflow(page), `renderer ${width}: horizontal overflow`)
      // Editor canvas: stacking follows the represented device frame, not the window.
      await page.goto(`${url}/?columns`)
      await page.locator('.atlas-wb-canvas__frame .atlas-cols').first().waitFor()
      for (const device of ['mobile', 'tablet', 'desktop']) {
        await page.evaluate(device => window.atlasTest.setDevice(device), device)
        await expect.poll(() => page.locator('.atlas-wb-canvas__frame').evaluate(node => node.offsetWidth)).toBe({ mobile: 390, tablet: 834, desktop: 1280 }[device])
        const list = await measureColumns(page, '.atlas-wb-canvas__frame')
        assertColumns(list, `canvas ${width} ${device}`, device === 'mobile' ? { forceStacked: true } : { forceColumns: true })
      }
      assert(await noHostOverflow(page), `canvas ${width}: horizontal overflow`)
      // Preview: the rendered page spans the editor's preview area.
      await page.getByRole('button', { name: 'Vista previa', exact: true }).click()
      await page.locator('.atlas-wb-preview .atlas-cols').first().waitFor()
      assertColumns(await measureColumns(page, '.atlas-wb-preview'), `preview ${width}`)
      assert(await noHostOverflow(page), `preview ${width}: horizontal overflow`)
      summary.push(width)
    } finally { await page.close() }
  }
  return { widths: summary, surfaces: ['renderer', 'canvas mobile/tablet/desktop', 'preview'], counts: [2, 3, 4], stackOnMobile: [true, false] }
}
