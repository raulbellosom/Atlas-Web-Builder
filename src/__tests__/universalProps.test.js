import { describe, it, expect } from 'vitest'
import { UNIVERSAL_PROPS, UNIVERSAL_CAPABILITIES, validateUniversalProp } from '../renderer/universalProps.js'
import { EFFECT_SHAPES, sanitizeAnimation, sanitizeKenBurns, sanitizePressed } from '../renderer/effects.js'

describe('universal props contract', () => {
  it('is plain JSON so it can travel inside the Builder catalog', () => {
    expect(JSON.parse(JSON.stringify(UNIVERSAL_PROPS))).toEqual(UNIVERSAL_PROPS)
    expect(UNIVERSAL_CAPABILITIES).toEqual({ motion: 1, responsive: 1 })
    expect(Object.keys(UNIVERSAL_PROPS).every((name) => name.startsWith('_'))).toBe(true)
  })

  it('accepts every shape the Inspector writes', () => {
    const valid = {
      _animation: { preset: 'slide-up', duration: 600, delay: 100, easing: 'ease-out', distance: 40, scaleFrom: 0.9, blur: 10, once: false },
      _scrollReveal: true,
      _kenburns: { zoom: 1.2, direction: 'in', pan: 'left', duration: 12000, easing: 'ease-in-out' },
      _pressed: { scale: 0.96, brightness: 90 },
      _stagger: 120,
      _parallax: { speed: -0.2 },
      _hover: { scale: '1.05', shadow: 'md', brightness: 110, duration: 200, easing: 'ease' },
      _transform: { rotate: 12, skewX: 0, skewY: -3 },
      _filter: { blur: 2, brightness: 100, contrast: 120, grayscale: 0, sepia: 10 },
      _opacity: 0.5, _cursor: 'pointer', _zIndex: 3, _sticky: true, _lazy: true, _lazyMinHeight: 320,
    }
    for (const [name, value] of Object.entries(valid)) expect(validateUniversalProp(name, value), name).toEqual({ ok: true, errors: [] })
    expect(validateUniversalProp('_hover', { scale: '' }).ok).toBe(true)
  })

  it('rejects out-of-range, wrongly typed and unknown values with an exact path', () => {
    const cases = [
      ['_animation', { preset: 'explode' }, '_animation.preset'],
      ['_animation', { preset: 'fade-in', duration: 99999 }, '_animation.duration'],
      ['_animation', { preset: 'fade-in', distance: -1 }, '_animation.distance'],
      ['_animation', { preset: 'fade-in', extra: 1 }, '_animation.extra'],
      ['_animation', 'fade-in', '_animation'],
      ['_kenburns', { zoom: 2 }, '_kenburns.zoom'],
      ['_kenburns', { pan: 'diagonal' }, '_kenburns.pan'],
      ['_pressed', { scale: 0.5 }, '_pressed.scale'],
      ['_hover', { scale: 'javascript:1' }, '_hover.scale'],
      ['_hover', { shadow: 'xl' }, '_hover.shadow'],
      ['_opacity', 2, '_opacity'], ['_opacity', '0.5', '_opacity'], ['_opacity', NaN, '_opacity'],
      ['_zIndex', 1.5, '_zIndex'], ['_stagger', 1001, '_stagger'], ['_cursor', 'url(x)', '_cursor'], ['_sticky', 'yes', '_sticky'],
    ]
    for (const [name, value, path] of cases) {
      const result = validateUniversalProp(name, value)
      expect(result.ok, `${name} ${JSON.stringify(value)}`).toBe(false)
      expect(result.errors[0]).toMatchObject({ code: 'effect_invalid', path })
    }
    expect(validateUniversalProp('_nope', 1)).toMatchObject({ ok: false, errors: [{ code: 'effect_unknown', path: '_nope' }] })
    expect(validateUniversalProp('__proto__', {})).toMatchObject({ ok: false, errors: [{ code: 'effect_unknown' }] })
    expect(validateUniversalProp('constructor', {})).toMatchObject({ ok: false })
  })

  it('render-time sanitizers clamp to the same ranges the contract validates', () => {
    expect(sanitizeAnimation({ preset: 'slide-up', distance: 9999, scaleFrom: 9, blur: 999 })).toMatchObject({ distance: 400, scaleFrom: 1.5, blur: 40 })
    expect(sanitizeAnimation({ preset: 'slide-up' })).not.toHaveProperty('distance')
    expect(sanitizeAnimation({ preset: 'fade-in', once: false }).once).toBe(false)
    expect(sanitizeKenBurns({ zoom: 9, duration: 1, pan: 'evil' })).toEqual({ zoom: 1.5, direction: 'in', pan: 'none', duration: 3000, easing: 'ease-in-out' })
    expect(sanitizeKenBurns({ zoom: 1 })).toBeUndefined()
    expect(sanitizeKenBurns(null)).toBeUndefined()
    expect(sanitizePressed({ scale: 0.1, brightness: 999 })).toEqual({ scale: 0.9, brightness: 150 })
    expect(sanitizePressed({ scale: 1, brightness: 100 })).toBeUndefined()
    const spec = UNIVERSAL_PROPS._animation.keys
    expect([EFFECT_SHAPES.animation.duration, EFFECT_SHAPES.animation.distance, EFFECT_SHAPES.animation.scaleFrom, EFFECT_SHAPES.animation.blur])
      .toEqual([[spec.duration.min, spec.duration.max], [spec.distance.min, spec.distance.max], [spec.scaleFrom.min, spec.scaleFrom.max], [spec.blur.min, spec.blur.max]])
    expect(EFFECT_SHAPES.animation.preset).toEqual(spec.preset.values)
    expect(EFFECT_SHAPES.kenburns.pan).toEqual(UNIVERSAL_PROPS._kenburns.keys.pan.values)
  })
})
