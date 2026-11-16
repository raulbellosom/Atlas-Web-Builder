/** Extract one reusable subtree without changing its source page. */
export function extractComposition(page, rootId) {
  const blocks = {}, visiting = new Set()
  function visit(id) {
    if (visiting.has(id) || blocks[id]) throw Error('La composición contiene referencias repetidas o circulares.')
    const block = page.blocks[id]
    if (!block) throw Error('Falta un elemento de la composición.')
    visiting.add(id)
    blocks[id] = structuredClone(block)
    for (const children of Object.values(block.children ?? {})) for (const child of children) visit(child)
    visiting.delete(id)
  }
  visit(rootId)
  return { rootIds: [rootId], blocks }
}
