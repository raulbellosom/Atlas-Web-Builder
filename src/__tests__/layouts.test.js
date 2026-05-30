import { describe, it, expect } from 'vitest'
import { produce } from 'immer'
import { defineLayout, createLayoutRegistry, applyLayoutToDraft } from '../layouts/defineLayout.js'
import { createEditorStore } from '../editor/store/createEditorStore.js'

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

let seq = 0
const newId = (prefix) => `${prefix}_${++seq}`

describe('layouts', () => {
  describe('defineLayout', () => {
    it('returns a frozen object with the marker flag', () => {
      const lyt = defineLayout({ id: 'l', label: 'L', regions: [{ name: 'main' }] })
      expect(lyt.__atlasLayout).toBe(true)
      expect(Object.isFrozen(lyt)).toBe(true)
    })

    it('rejects missing id/label/regions', () => {
      expect(() => defineLayout({})).toThrow(/id is required/)
      expect(() => defineLayout({ id: 'l' })).toThrow(/label is required/)
      expect(() => defineLayout({ id: 'l', label: 'L', regions: [] })).toThrow(/at least one/)
    })

    it('rejects duplicate region names', () => {
      expect(() =>
        defineLayout({
          id: 'l',
          label: 'L',
          regions: [{ name: 'main' }, { name: 'main' }],
        }),
      ).toThrow(/duplicate/)
    })

    it('defaults region.label to region.name', () => {
      const lyt = defineLayout({ id: 'l', label: 'L', regions: [{ name: 'main' }] })
      expect(lyt.regions[0].label).toBe('main')
    })
  })

  describe('createLayoutRegistry', () => {
    it('exposes list/get/has/size', () => {
      const a = defineLayout({ id: 'a', label: 'A', regions: [{ name: 'main' }] })
      const b = defineLayout({ id: 'b', label: 'B', regions: [{ name: 'main' }] })
      const reg = createLayoutRegistry([a, b])
      expect(reg.size()).toBe(2)
      expect(reg.has('a')).toBe(true)
      expect(reg.get('b')).toBe(b)
      expect(reg.list()).toHaveLength(2)
    })

    it('rejects duplicate ids', () => {
      const a = defineLayout({ id: 'x', label: 'X', regions: [{ name: 'main' }] })
      expect(() => createLayoutRegistry([a, a])).toThrow(/duplicate layout id/)
    })
  })

  describe('applyLayoutToDraft', () => {
    it('creates missing regions and preserves existing ones', () => {
      const layout = defineLayout({
        id: 'site',
        label: 'Sitio',
        regions: [{ name: 'header' }, { name: 'main' }, { name: 'footer' }],
      })
      const page = blankPage()
      page.regions.main.children = ['existing']
      page.blocks.existing = { id: 'existing', type: 'Heading', props: {}, children: {} }
      const next = produce(page, (draft) => applyLayoutToDraft(draft, layout, newId))
      expect(Object.keys(next.regions).sort()).toEqual(['footer', 'header', 'main'])
      expect(next.regions.main.children).toEqual(['existing'])
      expect(next.layoutId).toBe('site')
    })
  })

  describe('editor store + layout', () => {
    it('setLayout adds regions and setActiveRegion switches focus', () => {
      const store = createEditorStore()
      const layout = defineLayout({
        id: 'two',
        label: 'Dos',
        regions: [{ name: 'main' }, { name: 'footer', label: 'Pie' }],
      })
      store.getState().setLayout(layout)
      const state = store.getState()
      expect(state.page.layoutId).toBe('two')
      expect(state.page.regions.footer).toBeTruthy()
      state.setActiveRegion('footer')
      expect(store.getState().activeRegion).toBe('footer')
    })

    it('insertBlock defaults to the active region', () => {
      const store = createEditorStore()
      const layout = defineLayout({
        id: 'two',
        label: 'Dos',
        regions: [{ name: 'main' }, { name: 'footer' }],
      })
      store.getState().setLayout(layout)
      store.getState().setActiveRegion('footer')
      store.getState().insertBlock('Heading', { defaultProps: { text: 'pie' } })
      const page = store.getState().page
      expect(page.regions.footer.children).toHaveLength(1)
      expect(page.regions.main.children).toHaveLength(0)
    })

    it('setActiveRegion ignores unknown region names', () => {
      const store = createEditorStore()
      store.getState().setActiveRegion('ghost')
      expect(store.getState().activeRegion).toBe('main')
    })
  })
})
