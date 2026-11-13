import assert from 'node:assert/strict'

const frame = () => new Promise(resolve => setTimeout(resolve, 20))
const order = page => page.evaluate(() => [...window.atlasTest.page().blocks.section.children.children])

export async function pointerSorting(page, context, browser, touch, expect) {
  const before = await order(page), handle = page.locator('.atlas-wb-block__toolbar .atlas-wb-drag-handle')
  await expect(page.locator('.atlas-wb-drag-overlay')).toHaveCount(0)
  await expect(handle).toBeVisible()
  await handle.hover()
  const start = await handle.boundingBox(), target = await page.locator('[data-block-id="paragraph"]').boundingBox()
  const origin = { x: start.x + start.width / 2, y: start.y + start.height / 2 }
  assert(await page.evaluate(point => !!document.elementFromPoint(point.x, point.y)?.closest('.atlas-wb-drag-handle'), origin), 'Drag handle must be the actual hit target')
  const destination = { x: target.x + target.width / 2, y: target.y + target.height / 2 }
  let session
  if (touch && browser === 'chromium') session = await context.newCDPSession(page)
  async function send(type, point) {
    if (session) return session.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ ...point, id: 1, radiusX: 1, radiusY: 1 }] })
    return page.evaluate(({ type, point }) => {
      const target = type === 'touchStart' ? document.elementFromPoint(point.x, point.y) : window.atlasTouchTarget
      if (type === 'touchStart') window.atlasTouchTarget = target
      // WebKit's automation build exposes Touch as an illegal constructor.
      // This explicitly tests sensor events, not the native OS gesture pipeline.
      const touch = { identifier: 1, target, clientX: point.x, clientY: point.y, pageX: point.x, pageY: point.y }
      let event
      try { event = new TouchEvent(type.toLowerCase(), { bubbles: true, cancelable: true }) }
      catch { event = document.createEvent('TouchEvent'); event.initEvent(type.toLowerCase(), true, true) }
      Object.defineProperties(event, { touches: { value: type === 'touchEnd' ? [] : [touch] }, changedTouches: { value: [touch] }, targetTouches: { value: type === 'touchEnd' ? [] : [touch] } })
      target.dispatchEvent(event)
      if (type === 'touchEnd') delete window.atlasTouchTarget
    }, { type, point })
  }
  try {
    if (touch) await send('touchStart', origin)
    else { await page.mouse.move(origin.x, origin.y); await page.mouse.down(); await page.mouse.move(origin.x + 10, origin.y, { steps: 2 }) }
    await expect(page.locator('.atlas-wb-drag-overlay')).toHaveCount(1)
    for (let step = 1; step <= 8; step++) {
      const point = { x: origin.x + (destination.x - origin.x) * step / 8, y: origin.y + (destination.y - origin.y) * step / 8 }
      if (touch) await send('touchMove', point)
      else await page.mouse.move(point.x, point.y)
      await frame()
    }
    if (touch) await send('touchEnd', destination)
    else await page.mouse.up()
    await expect.poll(async () => (await order(page)).join(',')).not.toBe(before.join(','))
    assert.deepEqual(new Set(await order(page)), new Set(before), 'Pointer drop must preserve the nested container and every block')
    // dnd-kit suppresses compatibility clicks for 50ms after a pointer drop.
    // The next independent button action should follow that protection window.
    await new Promise(resolve => setTimeout(resolve, 80))
    await page.getByRole('button', { name: 'Deshacer', exact: true }).click()
    assert.deepEqual(await order(page), before)
  } finally { await session?.detach() }
}

export async function nativePaletteScroll(page, context, expect) {
  const panel = page.locator('.atlas-wb-panel--left .atlas-wb-panel__body')
  await expect(panel).toBeVisible()
  await panel.evaluate(node => { node.scrollTop = 0 })
  const bounds = await panel.boundingBox(), count = await page.evaluate(() => Object.keys(window.atlasTest.page().blocks).length)
  const session = await context.newCDPSession(page)
  try {
    const x = bounds.x + 70, startY = Math.min(bounds.y + bounds.height - 50, bounds.y + 280), endY = bounds.y + 45
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY, id: 1 }] })
    for (let step = 1; step <= 10; step++) { await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: startY + (endY - startY) * step / 10, id: 1 }] }); await frame() }
    // End with a held finger, so a later tap is not consumed to stop a fling.
    await new Promise(resolve => setTimeout(resolve, 100))
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => panel.evaluate(node => node.scrollTop)).toBeGreaterThan(0)
    assert.equal(await page.evaluate(() => Object.keys(window.atlasTest.page().blocks).length), count, 'Scrolling must not insert a palette block')
  } finally { await session.detach() }
}
