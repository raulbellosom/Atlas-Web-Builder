// Synced components, renderer side (same semantics as @runly/studio-interchange `website-components`).
// A component is a portable section tree `{ type, props, children: { slot: [section] } }` defined once per site;
// a page references it with a block of type COMPONENT_REF_TYPE and renders the expanded copy. Pure, never throws.
export const COMPONENT_REF_TYPE = 'ComponentRefBlock'
export const COMPONENT_LIMITS = Object.freeze({ components: 50, overridePaths: 50, overrideProps: 10, valueLength: 2000, blocks: 300, depth: 6 })
export const OVERRIDABLE_FIELD_TYPES = Object.freeze(['text', 'textarea', 'link', 'image'])

const ID = /^[a-z][a-z0-9-]{0,39}$/
const PROP = /^[A-Za-z][A-Za-z0-9]{0,40}$/
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const error = (code, message, path) => ({ code, message, ...(path ? { path } : {}) })

/** Overridable only when the registered field is a content field (never structure or style). */
export const overridableFromRegistry = (registry) => (type, prop) =>
  OVERRIDABLE_FIELD_TYPES.includes(registry?.get?.(type)?.fields?.[prop]?.type)

function walk(section, visit, depth = 1) {
  if (!isObject(section) || depth > COMPONENT_LIMITS.depth + 1 || !visit(section)) return false
  for (const list of isObject(section.children) ? Object.values(section.children) : []) {
    if (!Array.isArray(list)) return false
    for (const child of list) if (!walk(child, visit, depth + 1)) return false
  }
  return true
}

function validDefinition(id, def) {
  if (!ID.test(id) || !isObject(def) || typeof def.name !== 'string' || !def.name.trim() || def.name.length > 80) return false
  let count = 0
  return walk(def.section, (node) => typeof node.type === 'string' && node.type !== COMPONENT_REF_TYPE && ++count <= COMPONENT_LIMITS.blocks)
}

function locate(root, path) {
  if (typeof path !== 'string') return null
  const parts = path.split('/')
  if (parts[0] !== 'root' || parts.length % 2 === 0) return null
  let node = root
  for (let i = 1; i < parts.length; i += 2) {
    const slot = parts[i], index = Number(parts[i + 1])
    if (!isObject(node.children) || !Object.hasOwn(node.children, slot) || !Array.isArray(node.children[slot]) || !Number.isInteger(index) || String(index) !== parts[i + 1]) return null
    node = node.children[slot][index]
    if (!isObject(node)) return null
  }
  return node
}

function applyOverrides(root, overrides, overridable, at, errors) {
  if (overrides === undefined) return
  if (!isObject(overrides) || Object.keys(overrides).length > COMPONENT_LIMITS.overridePaths) { errors.push(error('component_override_invalid', 'overrides no es válido.', at)); return }
  for (const [path, props] of Object.entries(overrides)) {
    const node = locate(root, path), where = `${at}.overrides.${String(path).slice(0, 60)}`
    if (!node || !isObject(props) || Object.keys(props).length > COMPONENT_LIMITS.overrideProps) { errors.push(error('component_override_invalid', 'Ruta o valores de override no válidos.', where)); continue }
    for (const [prop, value] of Object.entries(props)) {
      if (!PROP.test(prop) || typeof value !== 'string' || value.length > COMPONENT_LIMITS.valueLength || !overridable(node.type, prop)) { errors.push(error('component_override_invalid', `No se puede sobrescribir "${String(prop).slice(0, 40)}".`, `${where}.${String(prop).slice(0, 40)}`)); continue }
      node.props = { ...(isObject(node.props) ? node.props : {}), [prop]: value }
    }
  }
}

const sizeOf = (section) => { let n = 0; walk(section, () => { n += 1; return true }); return n }

/**
 * Expands the component references of an Atlas Page (`regions` + flat `blocks` map).
 * Returns `{ page, errors }`; the input is never mutated and an unresolvable reference is dropped, not half-rendered.
 * Pages without references are returned as the same object.
 */
export function resolveComponents(page, components, { overridable = () => false, maxBlocks = COMPONENT_LIMITS.blocks } = {}) {
  const errors = []
  if (!isObject(page) || !isObject(page.blocks) || !isObject(page.regions)) return { page, errors }
  if (!Object.values(page.blocks).some((block) => block?.type === COMPONENT_REF_TYPE)) return { page, errors }
  const defs = isObject(components) ? components : {}
  const blocks = {}
  let total = 0, limited = false

  // Sections of a definition become blocks of this page with ids that cannot collide with authored ones.
  let serial = 0
  function instantiate(section, prefix) {
    const id = `${prefix}~${++serial}`, children = {}
    for (const [slot, list] of Object.entries(isObject(section.children) ? section.children : {})) children[slot] = list.map((child) => instantiate(child, prefix))
    blocks[id] = { id, type: section.type, props: isObject(section.props) ? section.props : {}, ...(Object.keys(children).length ? { children } : {}) }
    return id
  }
  function expandIds(ids, path) {
    const out = []
    for (const [index, id] of (Array.isArray(ids) ? ids : []).entries()) {
      const block = page.blocks[id], at = `${path}[${index}]`
      if (!isObject(block)) { out.push(id); continue }
      if (block.type === COMPONENT_REF_TYPE) {
        const props = isObject(block.props) ? block.props : {}, componentId = props.componentId
        if (typeof componentId !== 'string' || !ID.test(componentId)) { errors.push(error('component_id_invalid', 'Identificador de componente no válido.', at)); continue }
        if (!Object.hasOwn(defs, componentId) || !validDefinition(componentId, defs[componentId])) { errors.push(error('component_missing', `El componente "${componentId}" no existe o no es válido.`, at)); continue }
        const clone = structuredClone(defs[componentId].section), cost = sizeOf(clone)
        if (total + cost > maxBlocks) { if (!limited) errors.push(error('component_limit', `La página supera ${maxBlocks} bloques al expandir componentes.`, at)); limited = true; continue }
        applyOverrides(clone, props.overrides, overridable, at, errors)
        total += cost
        out.push(instantiate(clone, id))
        continue
      }
      total += 1
      const copy = { ...block }
      if (isObject(block.children)) copy.children = Object.fromEntries(Object.entries(block.children).map(([slot, list]) => [slot, expandIds(list, `${at}.children.${slot}`)]))
      blocks[id] = copy
      out.push(id)
    }
    return out
  }

  const regions = Object.fromEntries(Object.entries(page.regions).map(([name, region]) => [name, { ...region, children: expandIds(region?.children, `regions.${name}`) }]))
  return { page: { ...page, regions, blocks }, errors }
}
