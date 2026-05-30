import { describe, it, expect } from 'vitest'
import { produce } from 'immer'
import {
  insertBlockInRegion,
  insertBlockInSlot,
  moveBlockInRegion,
  moveBlockToTarget,
  removeBlock,
  duplicateBlock,
  findParent,
  ancestorsOf,
  isDescendant,
} from '../utils/tree.js'

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

describe('tree utils', () => {
  it('inserts blocks into a region', () => {
    let newId
    const page = produce(blankPage(), (draft) => {
      newId = insertBlockInRegion(
        draft,
        { type: 'A', defaultProps: { x: 1 } },
        { regionName: 'main' },
      )
    })
    expect(page.regions.main.children).toHaveLength(1)
    expect(page.regions.main.children[0]).toBe(newId)
    expect(page.blocks[newId].type).toBe('A')
    expect(page.blocks[newId].props.x).toBe(1)
  })

  it('reorders blocks in a region', () => {
    let id1, id2
    let page = produce(blankPage(), (draft) => {
      id1 = insertBlockInRegion(draft, { type: 'A' }, { regionName: 'main' })
      id2 = insertBlockInRegion(draft, { type: 'B' }, { regionName: 'main' })
    })
    expect(page.regions.main.children).toEqual([id1, id2])
    page = produce(page, (draft) => {
      moveBlockInRegion(draft, id2, 0)
    })
    expect(page.regions.main.children).toEqual([id2, id1])
  })

  it('removes a block and its subtree', () => {
    let id
    let page = produce(blankPage(), (draft) => {
      id = insertBlockInRegion(draft, { type: 'A' }, { regionName: 'main' })
    })
    page = produce(page, (draft) => removeBlock(draft, id))
    expect(page.regions.main.children).toHaveLength(0)
    expect(page.blocks[id]).toBeUndefined()
  })

  it('duplicates with fresh ids next to the original', () => {
    let id, dup
    let page = produce(blankPage(), (draft) => {
      id = insertBlockInRegion(draft, { type: 'A', defaultProps: { x: 7 } }, { regionName: 'main' })
    })
    page = produce(page, (draft) => {
      dup = duplicateBlock(draft, id)
    })
    expect(dup).toBeTruthy()
    expect(dup).not.toBe(id)
    expect(page.regions.main.children).toEqual([id, dup])
    expect(page.blocks[dup].props.x).toBe(7)
  })

  it('findParent + ancestorsOf return the selection chain', () => {
    let id
    const page = produce(blankPage(), (draft) => {
      id = insertBlockInRegion(draft, { type: 'A' }, { regionName: 'main' })
    })
    const parent = findParent(page, id)
    expect(parent?.kind).toBe('region')
    expect(ancestorsOf(page, id)).toEqual([id])
  })
})

describe('tree utils (slots)', () => {
  function makeSection() {
    let sectionId, childId
    const page = produce(blankPage(), (draft) => {
      sectionId = insertBlockInRegion(draft, { type: 'Section' }, { regionName: 'main' })
      childId = insertBlockInSlot(
        draft,
        { type: 'Heading', defaultProps: { text: 'hi' } },
        { parentId: sectionId, slotName: 'children' },
      )
    })
    return { page, sectionId, childId }
  }

  it('inserts blocks into a slot', () => {
    const { page, sectionId, childId } = makeSection()
    expect(page.blocks[sectionId].children.children).toEqual([childId])
    expect(page.blocks[childId].type).toBe('Heading')
    const parent = findParent(page, childId)
    expect(parent).toEqual({
      kind: 'slot',
      parentBlockId: sectionId,
      slotName: 'children',
      index: 0,
    })
  })

  it('ancestorsOf walks the slot chain', () => {
    const { page, sectionId, childId } = makeSection()
    // Order: root → leaf.
    expect(ancestorsOf(page, childId)).toEqual([sectionId, childId])
  })

  it('moves a block from a region into a slot', () => {
    let sectionId, otherId
    let page = produce(blankPage(), (draft) => {
      sectionId = insertBlockInRegion(draft, { type: 'Section' }, { regionName: 'main' })
      otherId = insertBlockInRegion(draft, { type: 'Text' }, { regionName: 'main' })
    })
    page = produce(page, (draft) => {
      const ok = moveBlockToTarget(draft, otherId, { parentId: sectionId, slotName: 'children' })
      expect(ok).toBe(true)
    })
    expect(page.regions.main.children).toEqual([sectionId])
    expect(page.blocks[sectionId].children.children).toEqual([otherId])
  })

  it('moves a block between slots', () => {
    let sectionA, sectionB, childId
    let page = produce(blankPage(), (draft) => {
      sectionA = insertBlockInRegion(draft, { type: 'Section' }, { regionName: 'main' })
      sectionB = insertBlockInRegion(draft, { type: 'Section' }, { regionName: 'main' })
      childId = insertBlockInSlot(
        draft,
        { type: 'Heading' },
        { parentId: sectionA, slotName: 'children' },
      )
    })
    page = produce(page, (draft) => {
      moveBlockToTarget(draft, childId, { parentId: sectionB, slotName: 'children' })
    })
    expect(page.blocks[sectionA].children.children).toEqual([])
    expect(page.blocks[sectionB].children.children).toEqual([childId])
  })

  it('shifts the target index when moving within the same container forward', () => {
    let a, b, c
    let page = produce(blankPage(), (draft) => {
      a = insertBlockInRegion(draft, { type: 'A' }, { regionName: 'main' })
      b = insertBlockInRegion(draft, { type: 'B' }, { regionName: 'main' })
      c = insertBlockInRegion(draft, { type: 'C' }, { regionName: 'main' })
    })
    // Drop semantics: "land before index 2 of the original array". With
    // [a, b, c], dropping `a` before index 2 produces [b, a, c].
    page = produce(page, (draft) => {
      moveBlockToTarget(draft, a, { regionName: 'main', index: 2 })
    })
    expect(page.regions.main.children).toEqual([b, a, c])

    // Appending (no index) sends the block to the end.
    page = produce(page, (draft) => {
      moveBlockToTarget(draft, b, { regionName: 'main' })
    })
    expect(page.regions.main.children).toEqual([a, c, b])
  })

  it('prevents dropping a block into its own descendant', () => {
    const { page: base, sectionId, childId } = makeSection()
    // childId is inside sectionId. Try to move sectionId under childId.
    let moved = true
    const next = produce(base, (draft) => {
      moved = moveBlockToTarget(draft, sectionId, {
        parentId: childId,
        slotName: 'children',
      })
    })
    expect(moved).toBe(false)
    expect(next).toEqual(base)
    expect(isDescendant(base, sectionId, childId)).toBe(true)
    expect(isDescendant(base, childId, sectionId)).toBe(false)
  })

  it('duplicates a block inside a slot next to the original', () => {
    const { page: base, sectionId, childId } = makeSection()
    let dup
    const next = produce(base, (draft) => {
      dup = duplicateBlock(draft, childId)
    })
    expect(dup).toBeTruthy()
    expect(next.blocks[sectionId].children.children).toEqual([childId, dup])
    expect(next.blocks[dup].type).toBe('Heading')
  })

  it('removes a block sitting inside a slot', () => {
    const { page: base, sectionId, childId } = makeSection()
    const next = produce(base, (draft) => {
      removeBlock(draft, childId)
    })
    expect(next.blocks[sectionId].children.children).toEqual([])
    expect(next.blocks[childId]).toBeUndefined()
  })

  it('reorders a block within a slot using moveBlockInRegion', () => {
    let sectionId, a, b
    let page = produce(blankPage(), (draft) => {
      sectionId = insertBlockInRegion(draft, { type: 'Section' }, { regionName: 'main' })
      a = insertBlockInSlot(draft, { type: 'A' }, { parentId: sectionId, slotName: 'children' })
      b = insertBlockInSlot(draft, { type: 'B' }, { parentId: sectionId, slotName: 'children' })
    })
    page = produce(page, (draft) => {
      moveBlockInRegion(draft, b, 0)
    })
    expect(page.blocks[sectionId].children.children).toEqual([b, a])
  })
})
