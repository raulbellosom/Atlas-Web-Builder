import { describe, it, expect } from 'vitest'
import { createEditorStore } from '../editor/store/createEditorStore.js'

describe('editor store', () => {
  it('inserts a block and selects it', () => {
    const store = createEditorStore()
    const id = store.getState().insertBlock('HeroBlock', { defaultProps: { title: 'Hola' } })
    expect(id).toBeTruthy()
    expect(store.getState().selectedId).toBe(id)
    expect(store.getState().page.regions.main.children).toContain(id)
    expect(store.getState().page.blocks[id].props.title).toBe('Hola')
  })

  it('undo / redo only tracks page mutations, not selection', () => {
    const store = createEditorStore()
    const id = store.getState().insertBlock('HeroBlock', { defaultProps: { title: 'A' } })
    expect(store.getState().page.blocks[id].props.title).toBe('A')

    store.getState().updateBlockProps(id, { title: 'B' })
    expect(store.getState().page.blocks[id].props.title).toBe('B')

    // Switching selection should not be a history entry
    const before = store.temporal.getState().pastStates.length
    store.getState().clearSelection()
    store.getState().select(id)
    const after = store.temporal.getState().pastStates.length
    expect(after).toBe(before)

    store.temporal.getState().undo()
    expect(store.getState().page.blocks[id].props.title).toBe('A')

    store.temporal.getState().redo()
    expect(store.getState().page.blocks[id].props.title).toBe('B')
  })

  it('changes device without polluting history', () => {
    const store = createEditorStore()
    const before = store.temporal.getState().pastStates.length
    store.getState().setDevice('mobile')
    expect(store.getState().device).toBe('mobile')
    const after = store.temporal.getState().pastStates.length
    expect(after).toBe(before)
  })

  it('removes a block and clears selection if it was selected', () => {
    const store = createEditorStore()
    const id = store.getState().insertBlock('A', {})
    expect(store.getState().selectedId).toBe(id)
    store.getState().removeBlock(id)
    expect(store.getState().page.blocks[id]).toBeUndefined()
    expect(store.getState().selectedId).toBeNull()
  })

  it('inserts into a slot via insertBlock target', () => {
    const store = createEditorStore()
    const sectionId = store.getState().insertBlock('Section', {})
    const childId = store.getState().insertBlock(
      'Heading',
      { defaultProps: { text: 'hi' } },
      {
        parentId: sectionId,
        slotName: 'children',
      },
    )
    expect(childId).toBeTruthy()
    expect(store.getState().selectedId).toBe(childId)
    expect(store.getState().page.blocks[sectionId].children.children).toEqual([childId])
  })

  it('moveBlockTo moves a block between region and slot', () => {
    const store = createEditorStore()
    const sectionId = store.getState().insertBlock('Section', {})
    const otherId = store.getState().insertBlock('Text', {})
    const ok = store.getState().moveBlockTo(otherId, {
      parentId: sectionId,
      slotName: 'children',
    })
    expect(ok).toBe(true)
    expect(store.getState().page.regions.main.children).toEqual([sectionId])
    expect(store.getState().page.blocks[sectionId].children.children).toEqual([otherId])
  })

  it('moveBlockTo returns false when target would create a cycle', () => {
    const store = createEditorStore()
    const sectionId = store.getState().insertBlock('Section', {})
    const childId = store
      .getState()
      .insertBlock('Section', {}, { parentId: sectionId, slotName: 'children' })
    const ok = store.getState().moveBlockTo(sectionId, { parentId: childId, slotName: 'children' })
    expect(ok).toBe(false)
    // Tree unchanged
    expect(store.getState().page.regions.main.children).toEqual([sectionId])
    expect(store.getState().page.blocks[sectionId].children.children).toEqual([childId])
  })
})
