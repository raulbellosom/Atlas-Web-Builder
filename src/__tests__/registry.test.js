import { describe, it, expect } from 'vitest'
import { defineBlock, createBlockRegistry } from '../registry/createBlockRegistry.js'

describe('createBlockRegistry', () => {
  const Hero = defineBlock({
    type: 'HeroBlock',
    label: 'Hero',
    render: () => null,
    defaultProps: { title: 'Hola' },
  })

  it('registers and looks up blocks', () => {
    const reg = createBlockRegistry([Hero])
    expect(reg.has('HeroBlock')).toBe(true)
    expect(reg.get('HeroBlock').defaultProps.title).toBe('Hola')
    expect(reg.types()).toEqual(['HeroBlock'])
  })

  it('throws on duplicate registration', () => {
    const reg = createBlockRegistry([Hero])
    expect(() => reg.register(Hero)).toThrow(/already registered/)
  })

  it('rejects definitions without a type or render function', () => {
    expect(() => defineBlock({})).toThrow()
    expect(() => defineBlock({ type: '' })).toThrow()
    expect(() => defineBlock({ type: 'X' })).toThrow(/render/)
  })

  it('returns undefined for unknown types (allowlist semantics)', () => {
    const reg = createBlockRegistry([Hero])
    expect(reg.get('NotRegistered')).toBeUndefined()
    expect(reg.has('NotRegistered')).toBe(false)
  })
})
