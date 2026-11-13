import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { BlockRenderer } from '../../renderer/BlockRenderer.jsx'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { es } from '../i18n/es.js'
import { useCallback, useRef } from 'react'
import { BlockToolbar } from './BlockToolbar.jsx'

/**
 * Wraps a single block instance with editor chrome: selection outline,
 * keyboard selection, drag-and-drop sortable handle, and a contextual
 * toolbar.
 */
export function EditableBlock({
  blockId,
  parentId,
  slotName,
  regionName,
  siblings,
  blocks,
  mode = 'edit',
}) {
  const selectedId = useEditorStore((s) => s.selectedId)
  const select = useEditorStore((s) => s.select)
  const removeBlock = useEditorStore((s) => s.removeBlock)
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock)
  const moveBlock = useEditorStore((s) => s.moveBlock)
  const startInlineEdit = useEditorStore((s) => s.startInlineEdit)
  const stopInlineEdit = useEditorStore((s) => s.stopInlineEdit)
  const inlineEditId = useEditorStore((s) => s.inlineEditId)
  const inlineEditingHere = inlineEditId === blockId
  const { blocks: registry } = useBuilder()
  const block = blocks[blockId]
  const def = block && registry ? registry.get(block.type) : null
  const blockLabel = def ? (def.label || def.type) : (block ? block.type : blockId)

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: blockId,
    data: { source: 'block', blockId, parentId, slotName, regionName, label: blockLabel },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const elementRef = useRef(null)
  const setElement = useCallback(node => { elementRef.current = node; setNodeRef(node) }, [setNodeRef])

  const isSelected = selectedId === blockId
  const index = siblings.indexOf(blockId)
  const lastIndex = siblings.length - 1

  return (
    <div
      ref={setElement}
      style={style}
      role="group"
      aria-label={`Bloque: ${blockLabel}`}
      data-block-id={blockId}
      data-atlas-inline-editing={inlineEditingHere ? 'true' : undefined}
      className={clsx(
        'atlas-wb-block',
        index === 0 && 'atlas-wb-block--first',
        isSelected && 'atlas-wb-block--selected',
        isDragging && 'atlas-wb-block--dragging',
        inlineEditingHere && 'atlas-wb-block--editing',
      )}
      onClickCapture={(e) => {
        if (e.target.closest('[data-block-id]') !== e.currentTarget) return
        if (inlineEditingHere) return
        select(blockId)
      }}
      onDoubleClick={(e) => {
        const target = e.target.closest('[data-atlas-inline-prop]')
        if (target && target.dataset.atlasInlineProp) {
          e.stopPropagation()
          e.preventDefault()
          startInlineEdit(blockId, target.dataset.atlasInlineProp)
        }
      }}
      onKeyDownCapture={(e) => {
        if (inlineEditingHere) {
          if (e.key === 'Escape') { e.stopPropagation(); stopInlineEdit() }
          return
        }
      }}
      data-selected={isSelected ? 'true' : undefined}
    >
      <button type="button" className="atlas-wb-block__select" aria-label={`Seleccionar ${blockLabel}`} aria-pressed={isSelected} onClick={() => select(blockId)}>Seleccionar {blockLabel}</button>
      {/* Selection toolbar */}
      {isSelected ? (
        <BlockToolbar anchorRef={elementRef} positionKey={index}>
          <span className="atlas-wb-block__toolbar-label">{blockLabel}</span>
          <button ref={setActivatorNodeRef} type="button" className="atlas-wb-drag-handle" {...(inlineEditingHere ? {} : attributes)} {...(inlineEditingHere ? {} : listeners)} aria-label={`Arrastrar ${blockLabel}`} title="Arrastrar bloque">⋮⋮</button>
          <div className="atlas-wb-block__toolbar-sep" />
          <button
            type="button"
            onClick={() => moveBlock(blockId, Math.max(0, index - 1))}
            disabled={index <= 0}
            title={es.selection.moveUp}
            aria-label={es.selection.moveUp}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveBlock(blockId, Math.min(lastIndex, index + 1))}
            disabled={index < 0 || index >= lastIndex}
            title={es.selection.moveDown}
            aria-label={es.selection.moveDown}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => duplicateBlock(blockId)}
            title={es.selection.duplicate}
            aria-label={es.selection.duplicate}
          >
            ⧉
          </button>
          <button
            type="button"
            className="atlas-wb-block__toolbar-remove"
            onClick={() => removeBlock(blockId)}
            title={es.selection.remove}
            aria-label={es.selection.remove}
          >
            ✕
          </button>
        </BlockToolbar>
      ) : null}

      <BlockRenderer blockId={blockId} blocks={blocks} mode={mode} />
    </div>
  )
}
