/**
 * @file Template definition + application. A template is a pre-built block
 * subtree that can be inserted into any container (region or slot). Templates
 * are pure data: `{ rootIds, blocks }` — no side effects, no host APIs.
 */

/**
 * @typedef {Object} TemplateDefinition
 * @property {string} id
 * @property {string} label
 * @property {string} [description]
 * @property {string} [category]
 * @property {string} [thumbnail]
 * @property {() => { rootIds: string[], blocks: Object<string, any> }} build
 */

/**
 * Define a template. The runtime accepts either a plain object literal or
 * the result of this helper; using `defineTemplate` lets us validate early
 * and stamps a discriminator that makes templates easy to spot in tooling.
 *
 * @param {TemplateDefinition} def
 * @returns {TemplateDefinition & { __atlasTemplate: true }}
 */
export function defineTemplate(def) {
  if (!def || typeof def !== 'object') {
    throw new Error('defineTemplate: definition object is required')
  }
  if (typeof def.id !== 'string' || !def.id) {
    throw new Error('defineTemplate: id is required')
  }
  if (typeof def.label !== 'string' || !def.label) {
    throw new Error('defineTemplate: label is required')
  }
  if (typeof def.build !== 'function') {
    throw new Error(`defineTemplate("${def.id}"): build must be a function`)
  }
  return Object.freeze({
    __atlasTemplate: true,
    category: 'general',
    ...def,
  })
}

/**
 * Build a thin lookup over an array of templates. Hosts pass this to the
 * provider; the editor reads from it to render the templates panel.
 *
 * @param {TemplateDefinition[]} templates
 */
export function createTemplateRegistry(templates = []) {
  const map = new Map()
  for (const t of templates) {
    if (!t || typeof t !== 'object' || typeof t.id !== 'string') continue
    if (map.has(t.id)) {
      throw new Error(`createTemplateRegistry: duplicate template id "${t.id}"`)
    }
    map.set(t.id, t)
  }
  return {
    list: () => Array.from(map.values()),
    get: (id) => map.get(id) || null,
    has: (id) => map.has(id),
    size: () => map.size,
  }
}
