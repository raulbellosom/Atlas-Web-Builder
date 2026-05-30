/**
 * @file Layout definition + registry. A layout is a *named template for the
 * regions of a page*: it lists which named slots exist at page level (e.g.
 * "header", "main", "footer") so the editor can show them as tabs and so
 * pages can share a consistent skeleton across a site.
 *
 * Layouts are pure data — no React, no host APIs.
 */

/**
 * @typedef {Object} LayoutRegionDescriptor
 * @property {string}   name              - Region key (used as `page.regions[name]`).
 * @property {string}   [label]           - Human label for the tab UI.
 * @property {string}   [description]
 * @property {boolean}  [locked]          - Reserved for future read-only regions.
 */

/**
 * @typedef {Object} LayoutDefinition
 * @property {string}                    id
 * @property {string}                    label
 * @property {string}                    [description]
 * @property {LayoutRegionDescriptor[]}  regions
 */

/**
 * Validate and freeze a layout definition. Hosts can also pass plain
 * objects; `defineLayout` is the recommended entry point because it
 * surfaces mistakes early.
 *
 * @param {LayoutDefinition} def
 * @returns {LayoutDefinition & { __atlasLayout: true }}
 */
export function defineLayout(def) {
  if (!def || typeof def !== 'object') {
    throw new Error('defineLayout: definition object is required')
  }
  if (typeof def.id !== 'string' || !def.id) {
    throw new Error('defineLayout: id is required')
  }
  if (typeof def.label !== 'string' || !def.label) {
    throw new Error('defineLayout: label is required')
  }
  if (!Array.isArray(def.regions) || def.regions.length === 0) {
    throw new Error(`defineLayout("${def.id}"): at least one region is required`)
  }
  const seen = new Set()
  for (const r of def.regions) {
    if (!r || typeof r.name !== 'string' || !r.name) {
      throw new Error(`defineLayout("${def.id}"): every region needs a name`)
    }
    if (seen.has(r.name)) {
      throw new Error(`defineLayout("${def.id}"): duplicate region name "${r.name}"`)
    }
    seen.add(r.name)
  }
  return Object.freeze({
    __atlasLayout: true,
    ...def,
    regions: def.regions.map((r) => Object.freeze({ label: r.name, ...r })),
  })
}

/**
 * Build a lookup over a list of layout definitions.
 *
 * @param {LayoutDefinition[]} layouts
 */
export function createLayoutRegistry(layouts = []) {
  const map = new Map()
  for (const l of layouts) {
    if (!l || typeof l !== 'object' || typeof l.id !== 'string') continue
    if (map.has(l.id)) {
      throw new Error(`createLayoutRegistry: duplicate layout id "${l.id}"`)
    }
    map.set(l.id, l)
  }
  return {
    list: () => Array.from(map.values()),
    get: (id) => map.get(id) || null,
    has: (id) => map.has(id),
    size: () => map.size,
  }
}

/**
 * Ensure every region declared by the layout exists in the page. Existing
 * regions are preserved (children kept intact); missing ones are created
 * empty. Sets `page.layoutId` to the layout id. Mutates the immer draft.
 *
 * @param {import('../schema/page.js').Page} draft
 * @param {LayoutDefinition} layout
 * @param {(prefix: string) => string} newId
 */
export function applyLayoutToDraft(draft, layout, newId) {
  if (!draft || !layout) return
  if (!draft.regions) draft.regions = {}
  for (const r of layout.regions) {
    if (!draft.regions[r.name]) {
      draft.regions[r.name] = { id: newId('region'), children: [] }
    }
  }
  draft.layoutId = layout.id
}
