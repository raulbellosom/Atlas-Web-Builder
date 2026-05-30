/**
 * @file Apply a template subtree into a page draft. Always regenerates ids
 * so a template can be inserted multiple times without collisions.
 */

import { regenerateIds } from '../persistence/serializePage.js'

/**
 * Insert a template into the given draft at the requested target. Mutates
 * the immer draft in place. Returns the list of root ids that were inserted
 * (already remapped), or an empty array if the template is invalid.
 *
 * @param {import('../schema/page.js').Page} draft
 * @param {import('./defineTemplate.js').TemplateDefinition} template
 * @param {{ regionName?: string, parentId?: string, slotName?: string, index?: number }} [target]
 * @returns {string[]} root ids inserted
 */
export function applyTemplate(draft, template, target = { regionName: 'main' }) {
  if (!template || typeof template.build !== 'function') return []
  const built = template.build()
  if (!built || !Array.isArray(built.rootIds) || !built.blocks) return []

  const { blocks, rootIds } = regenerateIds({
    blocks: built.blocks,
    rootIds: built.rootIds,
  })

  // Register every block first so slot/region inserts can resolve children.
  for (const [id, block] of Object.entries(blocks)) {
    draft.blocks[id] = block
  }

  // Resolve destination array
  let destArr
  if (target && target.parentId && target.slotName) {
    const parent = draft.blocks[target.parentId]
    if (!parent) return []
    if (!parent.children) parent.children = {}
    if (!Array.isArray(parent.children[target.slotName])) {
      parent.children[target.slotName] = []
    }
    destArr = parent.children[target.slotName]
  } else {
    const regionName = (target && target.regionName) || 'main'
    const region = draft.regions[regionName]
    if (!region) return []
    destArr = region.children
  }

  const idx = target && target.index != null ? target.index : destArr.length
  destArr.splice(idx, 0, ...rootIds)
  return rootIds
}
