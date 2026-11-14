import { useEffect, useRef, useState } from 'react'
import { EditorPortal } from '../ui/EditorAppearance.jsx'

/** Selection tools stay unscaled, unclipped and finger-sized at every canvas zoom. */
export function BlockToolbar({ anchorRef, positionKey, children }) {
  const toolbar = useRef(null), [position, setPosition] = useState({ visibility: 'hidden' })
  useEffect(() => {
    const anchor = anchorRef.current, owner = anchor.ownerDocument, view = owner.defaultView
    const update = () => {
      const rect = anchor.getBoundingClientRect(), canvas = anchor.closest('.atlas-wb-canvas').getBoundingClientRect()
      const width = Math.min(360, canvas.width - 16), height = toolbar.current?.offsetHeight || 44
      setPosition({ width, left: Math.max(canvas.left + 8, Math.min(rect.right - width, canvas.right - width - 8)),
        top: Math.max(canvas.top + 48, Math.min(rect.top - height - 8, canvas.bottom - height - 8)),
        visibility: rect.bottom > canvas.top && rect.top < canvas.bottom ? 'visible' : 'hidden' })
    }
    update()
    const observer = view.ResizeObserver ? new view.ResizeObserver(update) : null
    // The canvas also resizes without a window resize (host layout, visualViewport/keyboard).
    observer?.observe(anchor); observer?.observe(anchor.closest('.atlas-wb-canvas'))
    owner.addEventListener('scroll', update, true); view.addEventListener('resize', update)
    return () => { observer?.disconnect(); owner.removeEventListener('scroll', update, true); view.removeEventListener('resize', update) }
  }, [anchorRef, positionKey])
  return <EditorPortal><div ref={toolbar} className="atlas-wb-block__toolbar" role="toolbar" aria-label="Acciones del bloque" style={position}
    onClick={event => event.stopPropagation()} onKeyDown={event => { if (!event.target.closest('.atlas-wb-drag-handle')) event.stopPropagation() }}>{children}</div></EditorPortal>
}
