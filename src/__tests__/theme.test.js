import { describe, it, expect } from 'vitest'
import { applyThemeVars } from '../theme/applyThemeVars.js'
import { defaultTheme } from '../theme/defaultTheme.js'

describe('applyThemeVars', () => {
  it('flattens tokens into --atlas-{group}-{key} variables', () => {
    const vars = applyThemeVars(defaultTheme.tokens)
    expect(vars['--atlas-color-primary']).toBe('#0F62FE')
    expect(vars['--atlas-radius-md']).toBe('8px')
    expect(vars['--atlas-spacing-4']).toBe('16px')
    expect(vars['--atlas-font-sans']).toMatch(/Inter/)
  })

  it('returns an empty object for falsy input', () => {
    expect(applyThemeVars(null)).toEqual({})
    expect(applyThemeVars(undefined)).toEqual({})
  })
})
