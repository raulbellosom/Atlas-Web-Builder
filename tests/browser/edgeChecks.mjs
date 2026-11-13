import assert from 'node:assert/strict'

export async function checkEdges(page, url, browser, expect) {
  await page.goto(`${url}/?restricted`)
  await page.locator('[data-block-id="heading"]').click()
  await page.getByRole('button', { name: /^Efectos/ }).click()
  await expect(page.locator('[data-atlas-capability="effects"] input[type="range"]').first()).toBeDisabled()
  await page.getByRole('tab', { name: 'Página', exact: true }).click()
  await expect(page.locator('[data-atlas-capability="seo"] input').first()).toBeDisabled()
  assert.equal(await page.evaluate(() => window.atlasTest.page().seo.title), 'SEO histórico')
  await page.getByRole('tab', { name: 'Propiedades', exact: true }).click()
  await page.getByRole('button', { name: 'Vista previa', exact: true }).click()
  await expect(page.locator('.atlas-wb-preview')).toContainText('Ideas que toman forma.')
  await expect(page.locator('.atlas-wb-preview [data-block-id]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Vista previa', exact: true }).click()
  await page.getByRole('button', { name: 'Insertar Imagen', exact: true }).click()
  await page.getByRole('button', { name: 'Abrir selector de medios' }).click()
  const modal = page.getByRole('dialog', { name: 'Selector de medios' })
  await expect(modal).toBeVisible()
  await page.keyboard.press('Escape')
  let fullscreen = false
  if (browser === 'chromium' && await page.evaluate(() => document.fullscreenEnabled)) {
    await page.locator('.atlas-wb-editor').evaluate(node => node.requestFullscreen())
    await page.getByRole('button', { name: 'Abrir selector de medios' }).click()
    await expect(modal).toBeVisible()
    assert(await modal.evaluate(node => node.ownerDocument.fullscreenElement.contains(node)))
    await page.keyboard.press('Tab')
    assert(await modal.evaluate(node => node.contains(node.ownerDocument.activeElement)))
    await page.keyboard.press('Escape')
    await page.evaluate(() => document.exitFullscreen())
    fullscreen = true
  }
  await page.goto(`${url}/?embed`)
  await expect(page.locator('.atlas-wb-editor')).toHaveAttribute('data-compact', '')
  await expect(page.getByRole('button', { name: 'Bloques', exact: true })).toBeVisible()
  await page.goto(`${url}/iframe.html`)
  const frame = page.frameLocator('iframe')
  await frame.getByLabel('Apariencia del editor').selectOption('dark')
  await expect(frame.locator('.atlas-wb-editor-scope')).toHaveAttribute('data-appearance', 'dark')
  await frame.getByRole('button', { name: 'Insertar Imagen', exact: true }).click()
  await frame.getByRole('button', { name: 'Abrir selector de medios' }).click()
  await expect(frame.getByRole('dialog', { name: 'Selector de medios' })).toBeVisible()
  assert.equal(await page.locator('.atlas-wb-media-modal').count(), 0)
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(238, 238, 238)')
  return { capabilitiesLocked: true, publicPreview: true, narrowEmbed: true, iframePortal: true, fullscreen }
}

export function contrastRatio(first, second) {
  const luminance = hex => {
    const rgb = hex.trim().replace('#', '').match(/.{2}/g).slice(0, 3).map(value => parseInt(value, 16) / 255)
    const linear = rgb.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722
  }
  const a = luminance(first), b = luminance(second)
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}
