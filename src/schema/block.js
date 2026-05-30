/**
 * @file JSDoc typedefs for Block instances stored in a Page document.
 */

/**
 * A block instance stored in `Page.blocks` keyed by id.
 * Slot children are referenced by id arrays under `children[slotName]`.
 *
 * @typedef {Object} BlockInstance
 * @property {string}                          id
 * @property {string}                          type        - Registered block type name.
 * @property {Object<string, unknown>}         props       - Serializable props edited via controlled fields.
 * @property {Object<string, string[]>}        children    - Map of slotName -> ordered block ids.
 */

export {}
