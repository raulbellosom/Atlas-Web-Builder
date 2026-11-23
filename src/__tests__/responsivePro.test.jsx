import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { fluidFontSize, fluidToken, hasDeviceFontSize } from '../blocks/elements/fluidType.js'
import { focalVars, hasFocal } from '../blocks/elements/focalPoint.js'
import { applyThemeVars } from '../theme/applyThemeVars.js'
import { baseBlocks } from '../blocks/index.js'

const element = (type) => baseBlocks.find((block) => block.type === type)
const ctx = { mode: 'public', slot: () => null, inlineText: () => null }
const style = (type, props) => {
  const markup = renderToStaticMarkup(element(type).render({ ...element(type).defaultProps, ...props, ctx }))
  return markup.match(/style="([^"]*)"/)?.[1].replaceAll('&quot;', '"') ?? ''
}

describe('fluid typography', () => {
  it('is off unless enabled and reports invalid configurations instead of guessing', () => {
    expect(fluidFontSize({})).toEqual({})
    expect(fluidFontSize({ fluidType: false, fontSizeMin: 10, fontSizeMax: 20 })).toEqual({})
    for (const bad of [{ fontSizeMin: 30, fontSizeMax: 20 }, { fontSizeMin: 7, fontSizeMax: 20 }, { fontSizeMin: 10 }, { fontSizeMin: 10, fontSizeMax: 20, fluidMinViewport: 1000, fluidMaxViewport: 800 }, { fontSizeMin: 10, fontSizeMax: 20, fluidMinViewport: 100 }, { fontSizeMin: '10', fontSizeMax: 20 }]) {
      expect(fluidFontSize({ fluidType: true, ...bad }), JSON.stringify(bad)).toEqual({ error: 'fluid_invalid' })
    }
  })

  it('produces a clamp() that hits the minimum at the start width and the maximum at the end width', () => {
    const { value } = fluidFontSize({ fluidType: true, fontSizeMin: 20, fontSizeMax: 48, fluidMinViewport: 360, fluidMaxViewport: 1280 })
    expect(value).toMatch(/^clamp\(20px, calc\(.+px \+ .+ \* var\(--atlas-page-cqw, 1vw\)\), 48px\)$/)
    const [, intercept, slope] = value.match(/calc\((-?[\d.]+)px \+ ([\d.]+) \*/)
    const at = (width) => Number(intercept) + (Number(slope) / 100) * width
    expect(at(360)).toBeCloseTo(20, 2)
    expect(at(1280)).toBeCloseTo(48, 2)
    expect(at(820)).toBeCloseTo(34, 2)
    expect(fluidFontSize({ fluidType: true, fontSizeMin: 24, fontSizeMax: 24 }).value).toBe('24px')
  })

  it('a device size always wins over fluid sizing on that device (and on smaller ones that inherit it)', () => {
    expect(hasDeviceFontSize({ tabletFontSize: 30 }, 'desktop')).toBe(false)
    expect(hasDeviceFontSize({ tabletFontSize: 30 }, 'tablet')).toBe(true)
    expect(hasDeviceFontSize({ tabletFontSize: 30 }, 'mobile')).toBe(true)
    expect(hasDeviceFontSize({ mobileFontSize: 18 }, 'tablet')).toBe(false)
    expect(hasDeviceFontSize({ mobileFontSize: 18 }, 'mobile')).toBe(true)
    expect(hasDeviceFontSize({ tabletFontSize: 30, tabletFontSizeInherit: true }, 'tablet')).toBe(false)
  })

  it('elements render the clamp, per-device overrides keep their pixel size', () => {
    const fluid = { fluidType: true, fontSizeMin: 20, fontSizeMax: 48, text: 'Hola' }
    expect(style('TextElementBlock', fluid)).toContain('font-size:clamp(20px')
    const overridden = style('TextElementBlock', { ...fluid, mobileFontSize: 18 })
    expect(overridden).toContain('--ar-desktop-fontSize:clamp(20px')
    expect(overridden).toContain('--ar-tablet-fontSize:clamp(20px')
    expect(overridden).toContain('--ar-mobile-fontSize:18px')
    expect(style('TextElementBlock', { text: 'Hola', fontSize: 30 })).toContain('font-size:30px')
    expect(style('TextElementBlock', { ...fluid, fluidMaxViewport: 100 })).not.toContain('clamp')
  })

  it('theme tokens scale only the large sizes and keep the token as the maximum', () => {
    expect(fluidToken('3rem')).toMatch(/^clamp\(34px,.*48px\)$/)
    expect(fluidToken('1rem')).toBe('1rem')
    expect(fluidToken('0.875rem')).toBe('0.875rem')
    expect(fluidToken('garbage')).toBe('garbage')
    const tokens = { fontSize: { md: '1rem', '3xl': '3rem' }, color: { primary: '#000' }, fluid: { enabled: true } }
    const vars = applyThemeVars(tokens)
    expect(vars['--atlas-fontSize-md']).toBe('1rem')
    expect(vars['--atlas-fontSize-3xl']).toMatch(/^clamp\(/)
    expect(vars['--atlas-color-primary']).toBe('#000')
    expect(Object.keys(vars).some((key) => key.includes('fluid'))).toBe(false)
    expect(applyThemeVars({ ...tokens, fluid: { enabled: false } })['--atlas-fontSize-3xl']).toBe('3rem')
    expect(applyThemeVars({ fontSize: tokens.fontSize })['--atlas-fontSize-3xl']).toBe('3rem')
  })
})

describe('image focal point', () => {
  it('only defines variables for devices that set a point and ignores invalid values', () => {
    expect(focalVars({})).toEqual({})
    expect(hasFocal({})).toBe(false)
    expect(focalVars({ focalX: 20, focalY: 30, mobileFocalX: 60 })).toEqual({ '--atlas-focal-desktop': '20% 30%', '--atlas-focal-mobile': '60% 50%' })
    expect(focalVars({ focalX: 101, focalY: -1, tabletFocalX: NaN, mobileFocalY: '40' })).toEqual({})
  })

  it('ImageBlock exposes the class and per-device variables', () => {
    const block = element('ImageBlock')
    const html = renderToStaticMarkup(block.render({ ...block.defaultProps, src: '/a.png', alt: 'x', focalX: 20, focalY: 30, mobileFocalX: 60, mobileFocalY: 40, ctx }))
    expect(html).toContain('class="atlas-focal"')
    expect(html).toContain('--atlas-focal-desktop:20% 30%')
    expect(html).toContain('--atlas-focal-mobile:60% 40%')
    expect(renderToStaticMarkup(block.render({ ...block.defaultProps, src: '/a.png', alt: 'x', ctx }))).not.toContain('atlas-focal')
    expect(block.fields.focalX).toMatchObject({ type: 'number', min: 0, max: 100, responsive: true })
    expect(block.fields.mobileFocalY).toMatchObject({ responsiveBase: 'focalY' })
  })

  it('image elements resolve focal point per device through the shared pipeline', () => {
    const image = style('ImageElementBlock', { src: '/a.png', alt: 'x', focalX: 20, focalY: 30, mobileFocalX: 60, mobileFocalY: 40 })
    expect(image).toContain('object-position:var(--ar-objectPosition)')
    expect(image).toContain('--ar-desktop-objectPosition:20% 30%')
    expect(image).toContain('--ar-mobile-objectPosition:60% 40%')
    expect(style('ImageElementBlock', { src: '/a.png', alt: 'x', focalX: 20, focalY: 30 })).toContain('object-position:20% 30%')
  })
})
