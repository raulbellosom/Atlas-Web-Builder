import { describe, it, expect } from 'vitest'
import { resolveBackground } from '../blocks/_background.js'

describe('resolveBackground', () => {
  it('returns fallback when input is empty', () => {
    expect(resolveBackground(null, 'red')).toEqual({ background: 'red' })
    expect(resolveBackground(undefined, 'red')).toEqual({ background: 'red' })
  })

  it('treats a string as a legacy token key', () => {
    expect(resolveBackground('primary', 'transparent')).toEqual({
      background: 'var(--atlas-color-primary, transparent)',
    })
  })

  it('resolves a color object with token', () => {
    expect(resolveBackground({ kind: 'color', token: 'accent' })).toEqual({
      background: 'var(--atlas-color-accent, transparent)',
    })
  })

  it('resolves a color object with custom value', () => {
    expect(resolveBackground({ kind: 'color', value: '#ff00ff' })).toEqual({
      background: '#ff00ff',
    })
  })

  it('builds a linear-gradient string from hex stops', () => {
    const r = resolveBackground({ kind: 'gradient', from: '#abc', to: '#def', angle: 90 })
    expect(r.background).toBe('linear-gradient(90deg, #abc, #def)')
  })

  it('defaults the gradient angle to 135', () => {
    const r = resolveBackground({ kind: 'gradient', from: '#000', to: '#fff' })
    expect(r.background).toContain('135deg')
  })

  it('rejects unsafe image URLs and returns fallback', () => {
    const r = resolveBackground({ kind: 'image', url: 'javascript:alert(1)' }, '#000')
    expect(r).toEqual({ background: '#000' })
  })

  it('quotes a safe image URL and composes an overlay layer', () => {
    const r = resolveBackground({
      kind: 'image',
      url: 'https://cdn/x.png',
      overlay: 'rgba(0,0,0,0.5)',
      size: 'contain',
    })
    expect(r.backgroundImage).toBe(
      'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://cdn/x.png")',
    )
    expect(r.backgroundSize).toBe('contain')
    expect(r.backgroundRepeat).toBe('no-repeat')
  })
})
