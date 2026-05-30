import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import clsx from 'clsx'
import { es } from '../i18n/es.js'

/**
 * Droppable + sortable area for a single slot of a block (or for a region of
 * the page). Renders its children inside a `<SortableContext>` so siblings
 * can be reordered with drag-and-drop.
 *
 * @param {{
 *   parentId: string | null,
 *   slotName: string | null,
 *   regionName: string | null,
 *   childIds: string[],
 *   children: any,
 *   minimal?: boolean,            // skip the empty placeholder
 * }} props
 */
export function EditorSlot({
  parentId,
  slotName,
  regionName,
  childIds,
  children,
  minimal = false,
}) {
  const isRegion = !parentId && regionName
  const droppableId = isRegion ? `region:${regionName}` : `slot:${parentId}:${slotName}`

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: isRegion ? { source: 'region', regionName } : { source: 'slot', parentId, slotName },
  })

  const isEmpty = !childIds || childIds.length === 0

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'atlas-wb-dropzone',
        !isRegion && 'atlas-wb-dropzone--slot',
        isOver && 'atlas-wb-dropzone--over',
        isEmpty && 'atlas-wb-dropzone--empty',
      )}
      data-slot={slotName || undefined}
      data-region={regionName || undefined}
      data-parent={parentId || undefined}
    >
      {isEmpty ? (
        minimal ? null : isRegion ? (
          <div className="atlas-wb-canvas__empty">
            <svg className="atlas-wb-canvas__empty-icon" width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect x="4" y="4" width="48" height="48" rx="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3" />
              <path d="M28 18v20M18 28h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h3>Lienzo vacío</h3>
            <p>{es.canvas.empty}</p>
          </div>
        ) : (
          <div className="atlas-wb-canvas__empty" style={{ padding: '24px 16px' }}>
            <p style={{ fontSize: 12, margin: 0 }}>{es.canvas.dropHere}</p>
          </div>
        )
      ) : (
        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      )}
    </div>
  )
}
