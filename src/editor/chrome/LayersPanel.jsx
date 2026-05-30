import clsx from 'clsx'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { es } from '../i18n/es.js'

/**
 * Single node of the layers tree. Recurses into every slot of the block so
 * authors can see and select nested children.
 */
function LayerNode({ block, blocks, depth, selectedId, select }) {
  if (!block) return null
  const slots = block.children ? Object.entries(block.children) : []
  return (
    <li role="treeitem" aria-selected={selectedId === block.id}>
      <div
        className={clsx('atlas-wb-layer', selectedId === block.id && 'atlas-wb-layer--selected')}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={(e) => {
          e.stopPropagation()
          select(block.id)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            select(block.id)
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span aria-hidden="true">▦</span>
        <span>{block.type}</span>
      </div>
      {slots.map(([slotName, ids]) => {
        if (!ids || !ids.length) return null
        return (
          <ul key={slotName} className="atlas-wb-layers atlas-wb-layers--nested">
            <li className="atlas-wb-layers__slot-label" aria-hidden="true">
              <span style={{ paddingLeft: 8 + (depth + 1) * 12 }}>↳ {slotName}</span>
            </li>
            {ids.map((childId) => (
              <LayerNode
                key={childId}
                block={blocks[childId]}
                blocks={blocks}
                depth={depth + 1}
                selectedId={selectedId}
                select={select}
              />
            ))}
          </ul>
        )
      })}
    </li>
  )
}

export function LayersPanel() {
  const page = useEditorStore((s) => s.page)
  const selectedId = useEditorStore((s) => s.selectedId)
  const select = useEditorStore((s) => s.select)
  const activeRegion = useEditorStore((s) => s.activeRegion)

  const regionKey = page.regions[activeRegion] ? activeRegion : 'main'
  const region = page.regions[regionKey]
  const ids = region ? region.children : []

  if (!ids.length) {
    return <p className="atlas-wb-empty">{es.layers.empty}</p>
  }

  return (
    <ul className="atlas-wb-layers" role="tree">
      {ids.map((id) => (
        <LayerNode
          key={id}
          block={page.blocks[id]}
          blocks={page.blocks}
          depth={0}
          selectedId={selectedId}
          select={select}
        />
      ))}
    </ul>
  )
}
