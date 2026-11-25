import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { baseBlocks } from '../blocks/index.js'
import { geometryStyle } from '../blocks/elements/geometry.js'
import { kyntraHero } from '../../tests/browser/kyntra-hero.js'
import revision8 from '../../tests/browser/kyntra-revision-8.json'

describe('element geometry stays outside presentation effects', () => {
  for (const mode of ['preview', 'public']) it(`${mode} keeps revision 8 percentages on the row's direct items`, () => {
    const root = document.createElement('div')
    root.innerHTML = renderToStaticMarkup(<AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={revision8} mode={mode} /></AtlasWebBuilderProvider>)
    const copy = root.querySelector('[data-atlas-block="block-7"]')
    const frame = copy.closest('.atlas-element-frame')
    expect(frame.style.getPropertyValue('--ae-desktop-width')).toBe('47%')
    expect(frame.style.getPropertyValue('--ae-tablet-width')).toBe('100%')
    expect(frame.parentElement.className).toBe('atlas-element-layout')
    expect(frame.querySelector('.atlas-wb-effects-wrap')).not.toBeNull()
    expect(copy.classList.contains('atlas-element-item')).toBe(false)
    expect(copy.style.width).toBe('100%')
    expect(root.querySelector('[data-atlas-block="block-13"]').style.backgroundImage).toBe('')
    expect(root.querySelector('[data-atlas-block="block-6"]').style.backgroundImage).toContain('/fixture-background.svg')
  })

  it('keeps anchored responsive geometry outside animated layers and preserves grid fill behavior', () => {
    const root = document.createElement('div')
    root.innerHTML = renderToStaticMarkup(<AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={kyntraHero} /></AtlasWebBuilderProvider>)
    const floating = root.querySelector('[data-atlas-block="floating"]').closest('.atlas-element-frame')
    expect(floating.style.getPropertyValue('--ae-desktop-position')).toBe('absolute')
    expect(floating.style.getPropertyValue('--ae-mobile-width')).toBe('80%')
    expect(floating.style.getPropertyValue('--ae-desktop-left')).toBe('calc(50% + 0px)')
    expect(root.querySelector('[data-atlas-block="hero"]').style.getPropertyValue('--ae-desktop-fill-flex')).toBe('1 1 0%')
    expect(root.querySelector('[data-atlas-block="hero"]').style.getPropertyValue('--ae-mobile-fill-flex')).toBe('0 1 auto')
    expect(root.querySelector('[data-atlas-block="grid"]').style.getPropertyValue('--ae-desktop-fill-flex')).toBe('0 1 auto')
    expect(geometryStyle({ widthMode: 'fill' }).flex).toBe('var(--ae-fill-flex, 0 1 auto)')
  })
})
