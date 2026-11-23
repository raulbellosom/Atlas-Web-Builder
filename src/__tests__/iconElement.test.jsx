import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { baseBlocks } from '../blocks/index.js'
import { ICONS, ICON_OPTIONS, iconFor } from '../icons/registry.js'

const def = baseBlocks.find((block) => block.type === 'IconElementBlock')
const ctx = { mode: 'public', slot: () => null, inlineText: () => null }
const markup = (props) => renderToStaticMarkup(def.render({ ...def.defaultProps, ...props, ctx }))

describe('native icons', () => {
  it('is a registered free-form element with a selectable icon list matching the registry', () => {
    expect(def).toBeTruthy()
    expect(def.kind).toBe('element')
    expect(def.fields.icon.options).toEqual(ICON_OPTIONS)
    expect(ICON_OPTIONS.length).toBe(Object.keys(ICONS).length)
    expect(new Set(ICON_OPTIONS.map((option) => option.value)).size).toBe(ICON_OPTIONS.length)
    for (const name of Object.keys(ICONS)) expect(iconFor(name)).toBeTypeOf('object')
  })

  it('renders an inline stroke SVG sized by props that follows currentColor', () => {
    const html = markup({ icon: 'heart', size: 48, strokeWidth: 1.5 })
    expect(html).toContain('<svg')
    expect(html).toContain('width="48"')
    expect(html).toContain('stroke-width="1.5"')
    expect(html).toContain('stroke="currentColor"')
    expect(html).not.toContain('<img')
  })

  it('is decorative without a label and an image for assistive technology with one', () => {
    const decorative = markup({ icon: 'star' })
    expect(decorative).toContain('aria-hidden="true"')
    expect(decorative).not.toContain('role="img"')
    const labelled = markup({ icon: 'star', label: 'Favorito' })
    expect(labelled).toContain('role="img"')
    expect(labelled).toContain('aria-label="Favorito"')
    expect(labelled).not.toMatch(/<span[^>]*aria-hidden/)
  })

  it('maps tone tokens to theme variables and ignores anything else', () => {
    expect(markup({ icon: 'star', tone: 'primary' })).toContain('color:var(--atlas-color-primary')
    expect(markup({ icon: 'star', tone: 'url(javascript:1)' })).not.toContain('javascript')
    expect(markup({ icon: 'star', tone: 'inherit' })).not.toContain('--atlas-color')
  })

  it('never throws on unknown icons or hostile numbers and keeps reserved space', () => {
    expect(iconFor('__proto__')).toBeNull()
    expect(iconFor('toString')).toBeNull()
    const html = markup({ icon: 'nope', size: 99999, strokeWidth: -5 })
    expect(html).toContain('width:256px')
    expect(markup({ icon: 'star', size: 'NaN', strokeWidth: Infinity })).toContain('width="32"')
  })
})
