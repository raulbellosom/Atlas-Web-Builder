import { describe, it, expect } from 'vitest'
import { produce } from 'immer'
import {
  serializePage,
  parsePage,
  validatePage,
  garbageCollect,
  regenerateIds,
  listUnknownBlockTypes,
  PageValidationError,
} from '../persistence/serializePage.js'
import { insertBlockInRegion, insertBlockInSlot } from '../utils/tree.js'
import { CURRENT_SCHEMA_VERSION } from '../schema/migrate.js'

function blankPage() {
  return {
    schemaVersion: 1,
    id: 'page_1',
    slug: '/',
    title: 'Demo',
    visibility: 'public',
    layoutId: null,
    regions: { main: { id: 'region_main', children: [] } },
    blocks: {},
    seo: {},
    updatedAt: '',
  }
}

describe('persistence', () => {
  it('round-trips a non-trivial page through serialize/parse', () => {
    let sectionId, childId
    const page = produce(blankPage(), (draft) => {
      sectionId = insertBlockInRegion(draft, { type: 'Section' }, { regionName: 'main' })
      childId = insertBlockInSlot(
        draft,
        { type: 'Heading', defaultProps: { text: 'hola' } },
        { parentId: sectionId, slotName: 'children' },
      )
    })
    const json = serializePage(page, { pretty: true })
    const restored = parsePage(json)
    expect(restored.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(restored.regions.main.children).toEqual([sectionId])
    expect(restored.blocks[childId].props.text).toBe('hola')
  })

  it('garbage-collects orphan blocks', () => {
    const page = blankPage()
    page.blocks['orphan_1'] = { id: 'orphan_1', type: 'Heading', props: {}, children: {} }
    const clean = garbageCollect(page)
    expect(clean.blocks.orphan_1).toBeUndefined()
  })

  it('validatePage flags missing region.main and dangling refs', () => {
    expect(validatePage(null)).toContain('page is not an object')
    const broken = blankPage()
    broken.regions = {}
    expect(validatePage(broken)).toContain('regions must contain at least one region')

    const dangling = blankPage()
    dangling.regions.main.children = ['ghost']
    expect(validatePage(dangling).join('\n')).toMatch(/unknown block "ghost"/)
  })

  it('parsePage rejects malformed JSON with PageValidationError', () => {
    expect(() => parsePage('{not json')).toThrow(PageValidationError)
    expect(() => parsePage({ regions: {} })).toThrow(PageValidationError)
  })

  it('regenerateIds rewrites references in slots', () => {
    const subtree = {
      rootIds: ['a'],
      blocks: {
        a: { id: 'a', type: 'Section', props: {}, children: { children: ['b'] } },
        b: { id: 'b', type: 'Heading', props: { text: 'x' }, children: {} },
      },
    }
    const out = regenerateIds(subtree)
    expect(out.rootIds).toHaveLength(1)
    const newRoot = out.rootIds[0]
    expect(newRoot).not.toBe('a')
    const childId = out.blocks[newRoot].children.children[0]
    expect(childId).not.toBe('b')
    expect(out.blocks[childId].type).toBe('Heading')
    expect(out.blocks[childId].id).toBe(childId)
  })

  it('serializePage refuses to emit an invalid page', () => {
    const page = blankPage()
    page.regions.main.children = ['nope']
    expect(() => serializePage(page)).toThrow(PageValidationError)
  })

  describe('listUnknownBlockTypes', () => {
    function pageWithTypes(types) {
      return produce(blankPage(), (draft) => {
        types.forEach((type) => {
          insertBlockInRegion(draft, { type }, { regionName: 'main' })
        })
      })
    }

    it('returns sorted, deduped types not in the known set', () => {
      const page = pageWithTypes(['Hero', 'Section', 'Hero', 'Text'])
      const unknown = listUnknownBlockTypes(page, ['Section'])
      expect(unknown).toEqual(['Hero', 'Text'])
    })

    it('accepts a Set as the known collection', () => {
      const page = pageWithTypes(['Hero', 'Section'])
      expect(listUnknownBlockTypes(page, new Set(['Hero', 'Section']))).toEqual([])
    })

    it('accepts a registry-like object with .has()', () => {
      const page = pageWithTypes(['Hero', 'Mystery'])
      const fakeRegistry = { has: (t) => t === 'Hero' }
      expect(listUnknownBlockTypes(page, fakeRegistry)).toEqual(['Mystery'])
    })

    it('also surfaces orphan blocks (callers should garbageCollect first if undesired)', () => {
      const page = blankPage()
      page.blocks['ghost'] = { id: 'ghost', type: 'Ghost', props: {}, children: {} }
      expect(listUnknownBlockTypes(page, [])).toEqual(['Ghost'])
    })
  })
})
