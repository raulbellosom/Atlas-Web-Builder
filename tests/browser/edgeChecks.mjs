import assert from 'node:assert/strict'

export async function checkEdges(page, url, browser, expect) {
  await page.goto(`${url}/?restricted`)
  // Radix DropdownMenu: keyboard open, arrow navigation, Escape and focus return; host body untouched.
  const more = page.getByRole('button', { name: 'Más acciones', exact: true })
  await more.focus(); await page.keyboard.press('Enter')
  await expect(page.getByRole('menu', { name: 'Más acciones' })).toBeVisible()
  assert.deepEqual(await page.evaluate(() => [document.body.style.pointerEvents, document.body.style.overflow]), ['', ''], 'Non-modal menu must not lock the host body')
  await page.keyboard.press('ArrowDown')
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('role')), 'menuitem')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(more).toBeFocused()
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
  // Desktop WebKit exposes the unprefixed API; iPhone Safari does not (reported as unverifiable).
  if (await page.evaluate(() => document.fullscreenEnabled)) {
    await page.locator('.atlas-wb-editor').evaluate(node => node.requestFullscreen())
    await page.getByRole('button', { name: 'Abrir selector de medios' }).click()
    await expect(modal).toBeVisible()
    assert(await modal.evaluate(node => node.ownerDocument.fullscreenElement.contains(node)))
    await page.keyboard.press('Tab')
    assert(await modal.evaluate(node => node.contains(node.ownerDocument.activeElement)))
    // WebKit consumes Escape to leave fullscreen (platform behaviour); close through the dialog itself.
    await modal.getByRole('button', { name: 'Cerrar', exact: true }).click()
    await expect(modal).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Abrir selector de medios' })).toBeFocused()
    await page.getByRole('button', { name: 'Apariencia del editor', exact: true }).click()
    assert(await page.getByRole('menu').evaluate(node => node.ownerDocument.fullscreenElement.contains(node)), 'Menu must render inside the fullscreen element')
    await page.getByRole('menuitemradio', { name: 'Claro', exact: true }).click()
    await page.evaluate(() => document.exitFullscreen())
    fullscreen = true
  }
  await page.goto(`${url}/?embed`)
  await expect(page.locator('.atlas-wb-editor')).toHaveAttribute('data-compact', '')
  await expect(page.getByRole('button', { name: 'Bloques', exact: true })).toBeVisible()
  await page.goto(`${url}/iframe.html`)
  const frame = page.frameLocator('iframe')
  await frame.getByRole('button', { name: 'Apariencia del editor', exact: true }).click()
  await expect(frame.locator('.atlas-wb-menu')).toHaveCount(1)
  assert.equal(await page.locator('.atlas-wb-menu').count(), 0, 'Open menu must stay in the iframe document')
  await frame.getByRole('menuitemradio', { name: 'Oscuro', exact: true }).click()
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
