/**
 * @file Page (de)serialization: stringify, parse, migrate, validate and
 * garbage-collect orphan blocks. All entry points are safe to call on
 * untrusted JSON from disk or the network — they throw a typed error rather
 * than silently producing a malformed document.
 */

import { migrateContent, CURRENT_SCHEMA_VERSION } from '../schema/migrate.js'
import { newId } from '../utils/id.js'

/** Error thrown when a page document fails structural validation. */
export class PageValidationError extends Error {
  /**
   * @param {string} message
   * @param {string[]} [issues]
   */
  constructor(message, issues = []) {
    super(message)
    this.name = 'PageValidationError'
    this.issues = issues
  }
}

/**
 * Validate the structural shape of a page document. Returns the list of
 * issues found; an empty array means the document is well-formed.
 *
 * @param {any} page
 * @returns {string[]}
 */
export function validatePage(page) {
  const issues = []
  if (!page || typeof page !== 'object') {
    return ['page is not an object']
  }
  if (typeof page.id !== 'string' || !page.id) issues.push('missing id')
  if (typeof page.slug !== 'string') issues.push('missing slug')
  if (typeof page.title !== 'string') issues.push('missing title')
  if (page.visibility !== 'public' && page.visibility !== 'private') {
    issues.push('visibility must be "public" or "private"')
  }
  if (!page.regions || typeof page.regions !== 'object') {
    issues.push('missing regions')
  } else {
    const regionKeys = Object.keys(page.regions)
    if (regionKeys.length === 0) {
      issues.push('regions must contain at least one region')
    } else {
      for (const k of regionKeys) {
        const r = page.regions[k]
        if (!r || !Array.isArray(r.children)) {
          issues.push(`region "${k}" must have a children array`)
        }
      }
    }
  }
  if (!page.blocks || typeof page.blocks !== 'object') {
    issues.push('missing blocks dictionary')
  }
  if (issues.length === 0) {
    // Cross-check: every region/slot child id must exist in `blocks`.
    for (const [rname, region] of Object.entries(page.regions)) {
      if (!region || !Array.isArray(region.children)) continue
      for (const childId of region.children) {
        if (!page.blocks[childId])
          issues.push(`region "${rname}" references unknown block "${childId}"`)
      }
    }
    for (const [bid, block] of Object.entries(page.blocks)) {
      if (!block || typeof block !== 'object') {
        issues.push(`block "${bid}" is not an object`)
        continue
      }
      if (typeof block.type !== 'string') issues.push(`block "${bid}" missing type`)
      if (block.children && typeof block.children === 'object') {
        for (const [slotName, ids] of Object.entries(block.children)) {
          if (!Array.isArray(ids)) {
            issues.push(`block "${bid}" slot "${slotName}" is not an array`)
            continue
          }
          for (const cid of ids) {
            if (!page.blocks[cid]) {
              issues.push(`block "${bid}" slot "${slotName}" references unknown block "${cid}"`)
            }
          }
        }
      }
    }
  }
  return issues
}

/**
 * Inspect a page and list block types that are not in the supplied registry
 * (or `Set` of known type names). Useful after `parsePage` to warn the
 * author about content that will render with the fallback at runtime.
 *
 * @param {import('../schema/page.js').Page} page
 * @param {Set<string> | string[] | { has?: (type: string) => boolean }} knownTypes
 * @returns {string[]} unknown type names (deduplicated, sorted)
 */
export function listUnknownBlockTypes(page, knownTypes) {
  const has = makeHasFn(knownTypes)
  const seen = new Set()
  for (const block of Object.values(page?.blocks || {})) {
    if (block && typeof block.type === 'string' && !has(block.type)) {
      seen.add(block.type)
    }
  }
  return Array.from(seen).sort()
}

function makeHasFn(knownTypes) {
  if (!knownTypes) return () => true
  if (typeof knownTypes === 'object' && typeof knownTypes.has === 'function') {
    return (t) => knownTypes.has(t)
  }
  const set = knownTypes instanceof Set ? knownTypes : new Set(knownTypes)
  return (t) => set.has(t)
}

/**
 * Walk the page from every region root and return the set of reachable
 * block ids. Useful to drop orphans that may have been left behind by
 * faulty external mutations.
 *
 * @param {import('../schema/page.js').Page} page
 * @returns {Set<string>}
 */
function reachableBlockIds(page) {
  const reached = new Set()
  const stack = []
  for (const region of Object.values(page.regions || {})) {
    for (const id of region.children || []) stack.push(id)
  }
  while (stack.length) {
    const cur = stack.pop()
    if (!cur || reached.has(cur)) continue
    const block = page.blocks[cur]
    if (!block) continue
    reached.add(cur)
    for (const slot of Object.values(block.children || {})) {
      for (const cid of slot) stack.push(cid)
    }
  }
  return reached
}

/**
 * Remove blocks that are not reachable from any region. Returns a new page
 * object; the input is not mutated.
 *
 * @param {import('../schema/page.js').Page} page
 * @returns {import('../schema/page.js').Page}
 */
export function garbageCollect(page) {
  const reached = reachableBlockIds(page)
  const cleanBlocks = {}
  for (const [id, block] of Object.entries(page.blocks || {})) {
    if (reached.has(id)) cleanBlocks[id] = block
  }
  return { ...page, blocks: cleanBlocks }
}

/**
 * Serialize a page to a JSON string. Always emits the current schema version
 * and refreshes `updatedAt`. Throws `PageValidationError` if the page is
 * structurally invalid.
 *
 * @param {import('../schema/page.js').Page} page
 * @param {{ pretty?: boolean }} [opts]
 * @returns {string}
 */
export function serializePage(page, opts = {}) {
  const issues = validatePage(page)
  if (issues.length) {
    throw new PageValidationError('Cannot serialize invalid page', issues)
  }
  const gc = garbageCollect(page)
  const out = {
    ...gc,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  }
  return JSON.stringify(out, null, opts.pretty ? 2 : 0)
}

/**
 * Parse a page from a JSON string or plain object, run migrations and
 * structural validation. Throws `PageValidationError` on failure.
 *
 * @param {string|object} input
 * @returns {import('../schema/page.js').Page}
 */
export function parsePage(input) {
  let raw
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input)
    } catch (err) {
      throw new PageValidationError('Page JSON is not parseable: ' + err.message)
    }
  } else {
    raw = input
  }
  if (!raw || typeof raw !== 'object') {
    throw new PageValidationError('Page payload must be an object')
  }
  const migrated = migrateContent(raw)
  const issues = validatePage(migrated)
  if (issues.length) {
    throw new PageValidationError('Page failed validation after migration', issues)
  }
  return garbageCollect(migrated)
}

/**
 * Produce fresh ids for every block in a subtree. Used when importing
 * external content or applying templates to avoid id collisions with the
 * current page. Returns `{ blocks, rootIds }` mirroring the input shape.
 *
 * @param {{ blocks: Object<string, any>, rootIds: string[] }} subtree
 * @returns {{ blocks: Object<string, any>, rootIds: string[] }}
 */
export function regenerateIds({ blocks, rootIds }) {
  const map = {}
  for (const oldId of Object.keys(blocks)) map[oldId] = newId('blk')
  const out = {}
  for (const [oldId, block] of Object.entries(blocks)) {
    const nextId = map[oldId]
    const nextChildren = {}
    if (block.children) {
      for (const [slot, ids] of Object.entries(block.children)) {
        nextChildren[slot] = (ids || []).map((cid) => map[cid] || cid)
      }
    }
    out[nextId] = { ...block, id: nextId, children: nextChildren }
  }
  return {
    blocks: out,
    rootIds: rootIds.map((id) => map[id] || id),
  }
}
