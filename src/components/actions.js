// Editor-side operations for synced components. Pure functions over Atlas Pages: they never mutate their input,
// so the store (immer + undo history) and the tests use them the same way.
import { COMPONENT_LIMITS, COMPONENT_REF_TYPE, resolveComponents } from './resolve.js'

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const ID = /^[a-z][a-z0-9-]{0,39}$/

/** A readable, unique, valid id from a human name ("Pie de página" -> "pie-de-pagina", "pie-de-pagina-2"...). */
export function componentIdFromName(name, existing = {}) {
  const base = String(name ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^[^a-z]+/, '').slice(0, 36).replace(/-+$/, '') || 'componente'
  let id = base, n = 1
  while (Object.hasOwn(existing, id) || !ID.test(id)) id = `${base}-${++n}`
  return id
}

/** The block subtree below `rootId` as a portable section (`{ type, props, children: { slot: [section] } }`). */
export function pageToSection(page, rootId) {
  const seen = new Set()
  let count = 0
  function visit(id, depth) {
    const block = page?.blocks?.[id]
    if (!isObject(block) || seen.has(id) || depth > COMPONENT_LIMITS.depth || ++count > COMPONENT_LIMITS.blocks) throw new Error('La selección es demasiado grande o tiene una estructura no válida para un componente.')
    if (block.type === COMPONENT_REF_TYPE) throw new Error('Un componente no puede contener otros componentes.')
    seen.add(id)
    const children = {}
    for (const [slot, ids] of Object.entries(isObject(block.children) ? block.children : {})) children[slot] = ids.map((child) => visit(child, depth + 1))
    return { type: block.type, props: structuredClone(block.props ?? {}), ...(Object.keys(children).length ? { children } : {}) }
  }
  return visit(rootId, 1)
}

function removeSubtree(blocks, id) {
  for (const ids of Object.values(blocks[id]?.children ?? {})) for (const child of ids) removeSubtree(blocks, child)
  delete blocks[id]
}

/**
 * Turns the block `blockId` into a component definition and leaves a reference in its place (same id and position,
 * so selection, undo and layout keep working). Returns `{ definition, page }`.
 */
export function componentFromBlock(page, blockId, name) {
  const label = String(name ?? '').trim()
  if (!label || label.length > 80) throw new Error('Escribe un nombre de hasta 80 caracteres para el componente.')
  const section = pageToSection(page, blockId)
  const next = structuredClone(page)
  const reference = { id: blockId, type: COMPONENT_REF_TYPE, props: {} }
  removeSubtree(next.blocks, blockId)
  next.blocks[blockId] = reference
  return { definition: { name: label, section }, page: next, reference }
}

/** An Atlas Page that holds a definition as its only root, to edit it with the regular canvas. */
export function pageFromComponent(id, definition) {
  const blocks = {}
  let serial = 0
  function visit(section) {
    const blockId = `c${++serial}`, children = {}
    for (const [slot, list] of Object.entries(isObject(section.children) ? section.children : {})) children[slot] = list.map(visit)
    blocks[blockId] = { id: blockId, type: section.type, props: structuredClone(section.props ?? {}), ...(Object.keys(children).length ? { children } : {}) }
    return blockId
  }
  const root = visit(definition.section)
  return { schemaVersion: 1, id: `component:${id}`, slug: '/', title: definition.name, visibility: 'public', regions: { main: { id: 'main', children: [root] } }, blocks, seo: {} }
}

/** Back from the editing page to the definition section. A component has exactly one root. */
export function sectionFromComponentPage(page) {
  const roots = page?.regions?.main?.children ?? []
  if (roots.length !== 1) throw new Error('Un componente tiene un único elemento raíz: agrupa el contenido en un contenedor.')
  return pageToSection(page, roots[0])
}

/**
 * Replaces one reference by an independent copy of the component (overrides applied) and removes the link.
 * Returns `{ page, errors }`; on errors the page is unchanged.
 */
export function detachReference(page, refId, definitions, options = {}) {
  const reference = page?.blocks?.[refId]
  if (reference?.type !== COMPONENT_REF_TYPE) return { page, errors: [{ code: 'component_invalid', message: 'El bloque no es una referencia a un componente.' }] }
  const isolated = { ...page, regions: { main: { id: 'main', children: [refId] } }, blocks: { [refId]: reference } }
  const resolved = resolveComponents(isolated, definitions, options)
  if (resolved.errors.length || !resolved.page.regions.main.children.length) return { page, errors: resolved.errors.length ? resolved.errors : [{ code: 'component_missing', message: 'El componente no existe.' }] }
  const [root] = resolved.page.regions.main.children
  const next = structuredClone(page)
  delete next.blocks[refId]
  Object.assign(next.blocks, structuredClone(resolved.page.blocks))
  const swap = (ids) => ids.map((id) => (id === refId ? root : id))
  for (const region of Object.values(next.regions)) region.children = swap(region.children)
  for (const block of Object.values(next.blocks)) if (isObject(block.children)) for (const slot of Object.keys(block.children)) block.children[slot] = swap(block.children[slot])
  return { page: next, errors: [] }
}

/** Ids of the references to `componentId` in a page (to warn before deleting a definition). */
export const referencesTo = (page, componentId) =>
  Object.values(page?.blocks ?? {}).filter((block) => block?.type === COMPONENT_REF_TYPE && block.props?.componentId === componentId).map((block) => block.id)

/**
 * Content props of a definition a page may override, with their path: `[{ path, type, prop, label, value }]`.
 * Only text, textarea, link and image fields qualify (never structure or style).
 */
export function listOverridable(section, registry) {
  const out = []
  function visit(node, path) {
    const definition = registry?.get?.(node.type)
    for (const [prop, spec] of Object.entries(definition?.fields ?? {})) {
      if (!['text', 'textarea', 'link', 'image'].includes(spec?.type)) continue
      const value = node.props?.[prop] ?? definition.defaultProps?.[prop]
      if (typeof value === 'string') out.push({ path, type: node.type, prop, label: `${definition.label ?? node.type} · ${spec.label ?? prop}`, field: spec, value })
    }
    for (const [slot, list] of Object.entries(isObject(node.children) ? node.children : {})) list.forEach((child, index) => visit(child, `${path}/${slot}/${index}`))
  }
  visit(section, 'root')
  return out.slice(0, 60)
}

/** New `overrides` map with one prop set (or cleared when it equals the definition value / is empty). */
export function withOverride(overrides, path, prop, value, original) {
  const next = structuredClone(isObject(overrides) ? overrides : {})
  const props = { ...(next[path] ?? {}) }
  if (value === original) delete props[prop]; else props[prop] = value
  if (Object.keys(props).length) next[path] = props; else delete next[path]
  return next
}
