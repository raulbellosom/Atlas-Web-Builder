/**
 * @file Pure tree operations on a Page document's flat block dictionary.
 *
 * All helpers operate on an immer draft passed by the caller (they mutate
 * via immer's structural sharing) and return new ids when a block is created.
 */
import { newId } from './id.js'

/**
 * Locate the parent of a block (region or another block + slot name).
 *
 * @param {import('../schema/page.js').Page} page
 * @param {string} blockId
 * @returns {{ kind: 'region', regionName: string, index: number }
 *         | { kind: 'slot', parentBlockId: string, slotName: string, index: number }
 *         | null}
 */
export function findParent(page, blockId) {
  for (const [regionName, region] of Object.entries(page.regions || {})) {
    const idx = (region.children || []).indexOf(blockId)
    if (idx >= 0) return { kind: 'region', regionName, index: idx }
  }
  for (const block of Object.values(page.blocks || {})) {
    for (const [slotName, ids] of Object.entries(block.children || {})) {
      const idx = (ids || []).indexOf(blockId)
      if (idx >= 0) {
        return { kind: 'slot', parentBlockId: block.id, slotName, index: idx }
      }
    }
  }
  return null
}

/**
 * Build the selection ancestry (root → block) for the breadcrumb.
 *
 * @param {import('../schema/page.js').Page} page
 * @param {string} blockId
 * @returns {string[]}
 */
export function ancestorsOf(page, blockId) {
  const chain = []
  let current = blockId
  while (current) {
    chain.unshift(current)
    const parent = findParent(page, current)
    if (!parent || parent.kind === 'region') break
    current = parent.parentBlockId
  }
  return chain
}

/**
 * Insert a new block into a region at a specific index.
 *
 * @param {import('../schema/page.js').Page} draft - immer draft
 * @param {{ type: string, props?: object, defaultProps?: object }} args
 * @param {{ regionName: string, index?: number }} target
 * @returns {string} new block id
 */
export function insertBlockInRegion(draft, { type, props = {}, defaultProps = {} }, target) {
  const id = newId('blk')
  draft.blocks[id] = {
    id,
    type,
    props: { ...defaultProps, ...props },
    children: {},
  }
  const region = draft.regions[target.regionName]
  if (!region) {
    throw new Error(`insertBlockInRegion: unknown region "${target.regionName}"`)
  }
  const idx = target.index == null ? region.children.length : target.index
  region.children.splice(idx, 0, id)
  return id
}

/**
 * Insert a new block into a slot of an existing parent block at a specific index.
 *
 * @param {import('../schema/page.js').Page} draft
 * @param {{ type: string, props?: object, defaultProps?: object }} args
 * @param {{ parentId: string, slotName: string, index?: number }} target
 * @returns {string|null} new block id, or null if parent doesn't exist
 */
export function insertBlockInSlot(draft, { type, props = {}, defaultProps = {} }, target) {
  const parent = draft.blocks[target.parentId]
  if (!parent) return null
  const id = newId('blk')
  draft.blocks[id] = {
    id,
    type,
    props: { ...defaultProps, ...props },
    children: {},
  }
  if (!parent.children) parent.children = {}
  if (!Array.isArray(parent.children[target.slotName])) {
    parent.children[target.slotName] = []
  }
  const arr = parent.children[target.slotName]
  const idx = target.index == null ? arr.length : target.index
  arr.splice(idx, 0, id)
  return id
}

/**
 * Returns true if `candidateId` is `ancestorId` or lives anywhere inside its
 * subtree. Used to prevent dropping a block into one of its own descendants.
 *
 * @param {import('../schema/page.js').Page} page
 * @param {string} ancestorId
 * @param {string} candidateId
 */
export function isDescendant(page, ancestorId, candidateId) {
  if (ancestorId === candidateId) return true
  const stack = [ancestorId]
  while (stack.length) {
    const cur = stack.pop()
    const block = page.blocks[cur]
    if (!block) continue
    for (const ids of Object.values(block.children || {})) {
      for (const cid of ids) {
        if (cid === candidateId) return true
        stack.push(cid)
      }
    }
  }
  return false
}

/**
 * Remove a block by id, including its entire subtree.
 *
 * @param {import('../schema/page.js').Page} draft
 * @param {string} blockId
 */
export function removeBlock(draft, blockId) {
  const parent = findParent(draft, blockId)
  if (parent) {
    if (parent.kind === 'region') {
      draft.regions[parent.regionName].children.splice(parent.index, 1)
    } else {
      draft.blocks[parent.parentBlockId].children[parent.slotName].splice(parent.index, 1)
    }
  }
  // Collect subtree ids
  const toDelete = []
  const stack = [blockId]
  while (stack.length) {
    const cur = stack.pop()
    if (!cur || !draft.blocks[cur]) continue
    toDelete.push(cur)
    for (const slot of Object.values(draft.blocks[cur].children || {})) {
      for (const child of slot) stack.push(child)
    }
  }
  for (const id of toDelete) delete draft.blocks[id]
}

/**
 * Move a block within its current container (region or slot) to a new index.
 *
 * @param {import('../schema/page.js').Page} draft
 * @param {string} blockId
 * @param {number} toIndex
 */
export function moveBlockInRegion(draft, blockId, toIndex) {
  const parent = findParent(draft, blockId)
  if (!parent) return
  const arr =
    parent.kind === 'region'
      ? draft.regions[parent.regionName].children
      : draft.blocks[parent.parentBlockId].children[parent.slotName]
  arr.splice(parent.index, 1)
  const clampedIndex = Math.max(0, Math.min(toIndex, arr.length))
  arr.splice(clampedIndex, 0, blockId)
}

/**
 * Move a block to a different container (region or slot of another block).
 * Prevents cycles (cannot drop a block into its own descendant).
 *
 * @param {import('../schema/page.js').Page} draft
 * @param {string} blockId
 * @param {{ regionName?: string, parentId?: string, slotName?: string, index?: number }} target
 * @returns {boolean} true if moved
 */
export function moveBlockToTarget(draft, blockId, target) {
  if (!draft.blocks[blockId]) return false
  // Cycle guard: can't drop a block into itself or its subtree
  if (target.parentId && isDescendant(draft, blockId, target.parentId)) return false

  const currentParent = findParent(draft, blockId)
  if (!currentParent) return false

  // Resolve destination container array
  let destArr
  if (target.regionName) {
    const region = draft.regions[target.regionName]
    if (!region) return false
    destArr = region.children
  } else if (target.parentId && target.slotName) {
    const parent = draft.blocks[target.parentId]
    if (!parent) return false
    if (!parent.children) parent.children = {}
    if (!Array.isArray(parent.children[target.slotName])) {
      parent.children[target.slotName] = []
    }
    destArr = parent.children[target.slotName]
  } else {
    return false
  }

  // Source array
  const srcArr =
    currentParent.kind === 'region'
      ? draft.regions[currentParent.regionName].children
      : draft.blocks[currentParent.parentBlockId].children[currentParent.slotName]

  // Determine destination index BEFORE removing so the caller's index makes
  // sense; if moving within the same array and target is after the current
  // position, shift down by 1 after the splice.
  const sameContainer = srcArr === destArr
  const desiredIndex = target.index == null ? destArr.length : target.index

  srcArr.splice(currentParent.index, 1)

  let finalIndex = desiredIndex
  if (sameContainer && desiredIndex > currentParent.index) finalIndex = desiredIndex - 1
  finalIndex = Math.max(0, Math.min(finalIndex, destArr.length))

  destArr.splice(finalIndex, 0, blockId)
  return true
}

/**
 * Duplicate a block (including subtree) with fresh ids, inserted right after
 * the original within the same container (region or slot).
 *
 * @param {import('../schema/page.js').Page} draft
 * @param {string} blockId
 * @returns {string|null} new id, or null if not found
 */
export function duplicateBlock(draft, blockId) {
  const src = draft.blocks[blockId]
  if (!src) return null
  const parent = findParent(draft, blockId)
  if (!parent) return null

  const newRootId = cloneSubtree(draft, blockId)
  if (parent.kind === 'region') {
    draft.regions[parent.regionName].children.splice(parent.index + 1, 0, newRootId)
  } else {
    draft.blocks[parent.parentBlockId].children[parent.slotName].splice(
      parent.index + 1,
      0,
      newRootId,
    )
  }
  return newRootId
}

function cloneSubtree(draft, blockId) {
  const src = draft.blocks[blockId]
  const id = newId('blk')
  const childrenCopy = {}
  for (const [slot, ids] of Object.entries(src.children || {})) {
    childrenCopy[slot] = (ids || []).map((cid) => cloneSubtree(draft, cid))
  }
  // JSON-clone is safe here because block props are JSON-only by contract
  // (schema rule). structuredClone fails on immer drafts.
  draft.blocks[id] = {
    id,
    type: src.type,
    props: JSON.parse(JSON.stringify(src.props || {})),
    children: childrenCopy,
  }
  return id
}
