/**
 * @file Block registry helpers.
 *
 * Blocks are registered through `defineBlock()` and grouped via
 * `createBlockRegistry()`. The renderer uses the registry as an allowlist:
 * unknown block types are not rendered.
 */

/**
 * @typedef {Object} BlockFieldSpec
 * @property {string} type   - Field type id (e.g. 'text','select','toggle').
 * @property {unknown} [defaultValue]
 * @property {unknown} [options]
 */

/**
 * @typedef {Object} BlockDefinition
 * @property {string}   type           - Unique block type id (PascalCase).
 * @property {string}   [label]        - Human label (Spanish recommended).
 * @property {string}   [category]     - Category id for the editor palette.
 * @property {string[]} [variants]     - Allowed values for the 'variant' prop.
 * @property {Object<string, unknown>} [defaultProps]
 * @property {Object<string, BlockFieldSpec>} [fields]
 * @property {Object<string, { allow?: string[] }>} [slots]
 * @property {string[]} [resources]    - Resource ids the block can read.
 * @property {Function} render         - React component receiving (props, ctx).
 * @property {Function} [preview]      - Optional static preview component.
 */

/**
 * Validate and freeze a block definition. Throws on bad shape so misregistration
 * is caught at host bootstrap rather than at render time.
 *
 * @param {BlockDefinition} def
 * @returns {BlockDefinition}
 */
export function defineBlock(def) {
  if (!def || typeof def !== 'object') {
    throw new TypeError('defineBlock: definition must be an object')
  }
  if (typeof def.type !== 'string' || def.type.length === 0) {
    throw new TypeError('defineBlock: "type" must be a non-empty string')
  }
  if (typeof def.render !== 'function') {
    throw new TypeError(`defineBlock("${def.type}"): "render" must be a function`)
  }
  return Object.freeze({
    label: def.type,
    category: 'general',
    variants: [],
    defaultProps: {},
    fields: {},
    slots: {},
    resources: [],
    ...def,
  })
}

/**
 * Create a block registry. The returned object is plain JS so it can be
 * memoized by the host and passed through React context cheaply.
 *
 * @param {BlockDefinition[]} [definitions]
 * @returns {{
 *   register: (def: BlockDefinition) => void,
 *   get:      (type: string) => BlockDefinition | undefined,
 *   has:      (type: string) => boolean,
 *   list:     () => BlockDefinition[],
 *   types:    () => string[],
 * }}
 */
export function createBlockRegistry(definitions = []) {
  /** @type {Map<string, BlockDefinition>} */
  const map = new Map()

  function register(def) {
    const validated = defineBlock(def)
    if (map.has(validated.type)) {
      throw new Error(`createBlockRegistry: block type "${validated.type}" already registered`)
    }
    map.set(validated.type, validated)
  }

  for (const d of definitions) register(d)

  return {
    register,
    get: (type) => map.get(type),
    has: (type) => map.has(type),
    list: () => Array.from(map.values()),
    types: () => Array.from(map.keys()),
  }
}
