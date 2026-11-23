import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { baseBlocks } from '../blocks/index.js'
import { createBlockRegistry } from '../registry/createBlockRegistry.js'
import { COMPONENT_LIMITS, COMPONENT_REF_TYPE, overridableFromRegistry, resolveComponents } from '../components/resolve.js'

const registry = createBlockRegistry(baseBlocks)
const overridable = overridableFromRegistry(registry)
const footer = { name: 'Pie', section: { type: 'ContainerBlock', props: {}, children: { children: [
  { type: 'TextBlock', props: { text: 'Hecho en Runly' } },
  { type: 'TextBlock', props: { text: 'Contacto' } },
] } } }
const ref = (id, props) => ({ id, type: COMPONENT_REF_TYPE, props })
const page = (blocks, children = Object.keys(blocks)) => ({ schemaVersion: 1, id: 'p', slug: '/', title: 'p', visibility: 'public', regions: { main: { id: 'main', children } }, blocks })
const text = (id, value) => ({ id, type: 'TextBlock', props: { text: value } })

describe('synced components (Atlas Page)', () => {
  it('pages without references are returned untouched', () => {
    const p = page({ a: text('a', 'hola') })
    expect(resolveComponents(p, { footer }).page).toBe(p)
  })

  it('expands a reference in place with unique ids and keeps the input immutable', () => {
    const p = page({ a: text('a', 'Antes'), r: ref('r', { componentId: 'footer' }), z: text('z', 'Después') }, ['a', 'r', 'z'])
    const snapshot = JSON.stringify(p)
    const { page: out, errors } = resolveComponents(p, { footer }, { overridable })
    expect(errors).toEqual([])
    expect(JSON.stringify(p)).toBe(snapshot)
    const [first, mid, last] = out.regions.main.children
    expect([first, last]).toEqual(['a', 'z'])
    expect(out.blocks[mid].type).toBe('ContainerBlock')
    expect(out.blocks.r).toBeUndefined()
    const kids = out.blocks[mid].children.children
    expect(kids.map((id) => out.blocks[id].props.text)).toEqual(['Hecho en Runly', 'Contacto'])
    expect(new Set(Object.keys(out.blocks)).size).toBe(Object.keys(out.blocks).length)
  })

  it('two references to one definition get distinct ids; editing the definition changes both', () => {
    const p = page({ r1: ref('r1', { componentId: 'footer' }), r2: ref('r2', { componentId: 'footer' }) })
    const edited = { footer: { ...footer, section: { ...footer.section, children: { children: [{ type: 'TextBlock', props: { text: 'Nuevo pie' } }] } } } }
    const out = resolveComponents(p, edited).page
    const roots = out.regions.main.children
    expect(new Set(roots).size).toBe(2)
    for (const root of roots) expect(out.blocks[out.blocks[root].children.children[0]].props.text).toBe('Nuevo pie')
  })

  it('expands references nested inside slots of other blocks', () => {
    const p = page({ box: { id: 'box', type: 'ContainerBlock', props: {}, children: { children: ['r'] } }, r: ref('r', { componentId: 'footer' }) }, ['box'])
    const out = resolveComponents(p, { footer }).page
    const inner = out.blocks[out.blocks.box.children.children[0]]
    expect(inner.type).toBe('ContainerBlock')
  })

  it('applies content overrides by path and rejects structural ones', () => {
    const good = resolveComponents(page({ r: ref('r', { componentId: 'footer', overrides: { 'root/children/0': { text: 'Otro' } } }) }), { footer }, { overridable })
    expect(good.errors).toEqual([])
    const root = good.page.blocks[good.page.regions.main.children[0]]
    expect(good.page.blocks[root.children.children[0]].props.text).toBe('Otro')
    expect(footer.section.children.children[0].props.text).toBe('Hecho en Runly')
    for (const overrides of [{ 'root/children/0': { align: 'right' } }, { 'root/children/7': { text: 'x' } }, { '../x': { text: 'x' } }, { 'root/children/0': { text: 9 } }]) {
      const bad = resolveComponents(page({ r: ref('r', { componentId: 'footer', overrides }) }), { footer }, { overridable })
      expect(bad.errors.map((e) => e.code)).toEqual(['component_override_invalid'])
    }
    expect(resolveComponents(page({ r: ref('r', { componentId: 'footer', overrides: { 'root/children/0': { text: 'x' } } }) }), { footer }).errors).toHaveLength(1)
  })

  it('drops unknown or hostile references and never expands invalid definitions', () => {
    for (const [componentId, code] of [['missing', 'component_missing'], ['__proto__', 'component_id_invalid'], ['constructor', 'component_missing'], [7, 'component_id_invalid']]) {
      const { page: out, errors } = resolveComponents(page({ keep: text('keep', 'x'), r: ref('r', { componentId }) }, ['keep', 'r']), { footer })
      expect(errors[0].code).toBe(code)
      expect(out.regions.main.children).toEqual(['keep'])
    }
    const self = { a: { name: 'a', section: { type: 'ContainerBlock', children: { c: [{ type: COMPONENT_REF_TYPE, props: { componentId: 'a' } }] } } } }
    expect(resolveComponents(page({ r: ref('r', { componentId: 'a' }) }), self).errors[0].code).toBe('component_missing')
    expect(() => resolveComponents(page({ r: ref('r', { componentId: 'a' }) }), null)).not.toThrow()
  })

  it('cannot amplify a page beyond the block limit', () => {
    const big = { name: 'Grande', section: { type: 'ContainerBlock', children: { c: Array.from({ length: 100 }, () => ({ type: 'TextBlock', props: { text: 'x' } })) } } }
    const refs = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`r${i}`, ref(`r${i}`, { componentId: 'big' })]))
    const { page: out, errors } = resolveComponents(page(refs), { big })
    expect(out.regions.main.children).toHaveLength(2)
    expect(errors.map((e) => e.code)).toEqual(['component_limit'])
    expect(Object.keys(out.blocks).length).toBeLessThanOrEqual(COMPONENT_LIMITS.blocks)
  })
})

describe('synced components (renderer)', () => {
  const html = (p, components) => render(
    <AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={p} mode="public" components={components} /></AtlasWebBuilderProvider>,
  ).container.innerHTML

  it('renders the expanded component and nothing for a broken reference', () => {
    const p = page({ r: ref('r', { componentId: 'footer' }), x: ref('x', { componentId: 'gone' }) })
    const out = html(p, { footer })
    expect(out).toContain('Hecho en Runly')
    expect(out).not.toContain('ComponentRefBlock')
  })

  it('without a components map a reference is not rendered (unregistered block stays an allowlist miss)', () => {
    const out = html(page({ r: ref('r', { componentId: 'footer' }), t: text('t', 'visible') }))
    expect(out).toContain('visible')
    expect(out).not.toContain('Hecho en Runly')
  })
})
