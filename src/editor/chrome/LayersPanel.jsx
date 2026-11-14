import { useState } from 'react'
import { Box, ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react'
import clsx from 'clsx'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { es } from '../i18n/es.js'

/**
 * Single node of the layers tree. Recurses into every slot of the block so
 * authors can see and select nested children.
 */
function LayerNode({ block, blocks, depth, selectedId, select }) {
  const [expanded, setExpanded] = useState(true)
  if (!block) return null
  const slots = block.children ? Object.entries(block.children) : []
  const hasChildren = slots.some(([, ids]) => ids.length)
  return (
    <li role="treeitem" aria-selected={selectedId === block.id} aria-expanded={hasChildren ? expanded : undefined}>
      <div
        className={clsx('atlas-wb-layer', selectedId === block.id && 'atlas-wb-layer--selected')}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {hasChildren && <button type="button" className="atlas-wb-layer__fold" tabIndex={-1} aria-label={`${expanded ? 'Contraer' : 'Expandir'} ${block.type}`} onClick={() => setExpanded(value => !value)}>{expanded ? <ChevronDown /> : <ChevronRight />}</button>}
        <button type="button" className="atlas-wb-layer__select" data-layer-id={block.id}
          onClick={() => select(block.id)}
          onKeyDown={event => {
            const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
            if (!keys.includes(event.key)) return
            event.preventDefault(); event.stopPropagation()
            if (event.key === 'ArrowLeft') { setExpanded(false); return }
            if (event.key === 'ArrowRight') { setExpanded(true); return }
            const nodes = [...event.currentTarget.closest('[role="tree"]').querySelectorAll('[data-layer-id]')]
            const index = nodes.indexOf(event.currentTarget)
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? nodes.length - 1 : Math.max(0, Math.min(nodes.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))
            nodes[next]?.focus()
          }}><Box aria-hidden="true" /><span>{block.type}</span></button>
      </div>
      {expanded && slots.map(([slotName, ids]) => {
        if (!ids || !ids.length) return null
        return (
          <ul key={slotName} className="atlas-wb-layers atlas-wb-layers--nested">
            <li className="atlas-wb-layers__slot-label" aria-hidden="true">
              <span style={{ paddingLeft: 8 + (depth + 1) * 12 }}><CornerDownRight aria-hidden="true" />{slotName}</span>
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
