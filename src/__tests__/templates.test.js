import { describe, it, expect } from 'vitest'
import { produce } from 'immer'
import { defineTemplate, createTemplateRegistry } from '../templates/defineTemplate.js'
import { applyTemplate } from '../templates/applyTemplate.js'
import { insertBlockInRegion } from '../utils/tree.js'

function blankPage() {
  return {
    schemaVersion: 1,
    id: 'page_1',
    slug: '/',
    title: 't',
    visibility: 'public',
    layoutId: null,
    regions: { main: { id: 'region_main', children: [] } },
    blocks: {},
    seo: {},
    updatedAt: '',
  }
}

const hero = defineTemplate({
  id: 'hero-cta',
  label: 'Hero con CTA',
  description: 'Sección destacada con título y botón',
  category: 'landing',
  build() {
    return {
      rootIds: ['root'],
      blocks: {
        root: {
          id: 'root',
          type: 'Section',
          props: {},
          children: { children: ['h', 'b'] },
        },
        h: { id: 'h', type: 'Heading', props: { text: 'Hola' }, children: {} },
        b: { id: 'b', type: 'Button', props: { label: 'Ir', href: '#' }, children: {} },
      },
    }
  },
})

describe('templates', () => {
  it('defineTemplate validates required fields', () => {
    expect(() => defineTemplate({ label: 'x', build: () => ({}) })).toThrow()
    expect(() => defineTemplate({ id: 'x', build: () => ({}) })).toThrow()
    expect(() => defineTemplate({ id: 'x', label: 'l' })).toThrow()
  })

  it('createTemplateRegistry rejects duplicate ids', () => {
    expect(() => createTemplateRegistry([hero, hero])).toThrow(/duplicate/)
  })

  it('applyTemplate inserts into a region with fresh ids', () => {
    const next = produce(blankPage(), (draft) => {
      const inserted = applyTemplate(draft, hero, { regionName: 'main' })
      expect(inserted).toHaveLength(1)
    })
    const rootIds = next.regions.main.children
    expect(rootIds).toHaveLength(1)
    const sectionId = rootIds[0]
    expect(sectionId).not.toBe('root')
    const section = next.blocks[sectionId]
    expect(section.type).toBe('Section')
    expect(section.children.children).toHaveLength(2)
    const [hId, bId] = section.children.children
    expect(hId).not.toBe('h')
    expect(bId).not.toBe('b')
    expect(next.blocks[hId].props.text).toBe('Hola')
  })

  it('applyTemplate can target a slot', () => {
    let sectionId
    const base = produce(blankPage(), (draft) => {
      sectionId = insertBlockInRegion(draft, { type: 'Section' }, { regionName: 'main' })
    })
    const next = produce(base, (draft) => {
      applyTemplate(draft, hero, { parentId: sectionId, slotName: 'children' })
    })
    expect(next.blocks[sectionId].children.children).toHaveLength(1)
    const childRoot = next.blocks[sectionId].children.children[0]
    expect(next.blocks[childRoot].type).toBe('Section')
  })

  it('applying the same template twice produces distinct ids', () => {
    const next = produce(blankPage(), (draft) => {
      applyTemplate(draft, hero, { regionName: 'main' })
      applyTemplate(draft, hero, { regionName: 'main' })
    })
    const [a, b] = next.regions.main.children
    expect(a).not.toBe(b)
    expect(Object.keys(next.blocks)).toHaveLength(6)
  })
})
