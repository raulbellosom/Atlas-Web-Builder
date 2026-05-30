import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { BlockRenderer } from '../../renderer/BlockRenderer.jsx'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { es } from '../i18n/es.js'

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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: blockId,
    data: { source: 'block', blockId, parentId, slotName, regionName },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const isSelected = selectedId === blockId
  const index = siblings.indexOf(blockId)
  const lastIndex = siblings.length - 1
  const block = blocks[blockId]
  const def = block && registry ? registry.get(block.type) : null
  const blockLabel = def ? (def.label || def.type) : (block ? block.type : blockId)

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      data-block-id={blockId}
      data-atlas-inline-editing={inlineEditingHere ? 'true' : undefined}
      className={clsx(
        'atlas-wb-block',
        isSelected && 'atlas-wb-block--selected',
        isDragging && 'atlas-wb-block--dragging',
        inlineEditingHere && 'atlas-wb-block--editing',
      )}
      onClick={(e) => {
        e.stopPropagation()
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
      onKeyDown={(e) => {
        if (inlineEditingHere) {
          if (e.key === 'Escape') { e.stopPropagation(); stopInlineEdit() }
          return
        }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(blockId) }
      }}
      {...(inlineEditingHere ? {} : attributes)}
      {...(inlineEditingHere ? {} : listeners)}
    >
      {/* Selection toolbar */}
      {isSelected ? (
        <div
          className="atlas-wb-block__toolbar"
          role="toolbar"
          aria-label="Acciones del bloque"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <span className="atlas-wb-block__toolbar-label">{blockLabel}</span>
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
        </div>
      ) : null}

      <BlockRenderer blockId={blockId} blocks={blocks} mode={mode} />
    </div>
  )
}
