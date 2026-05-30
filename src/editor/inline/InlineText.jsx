import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'

/**
 * Inline text editor used by base blocks to edit a plain-text prop directly
 * on the canvas. ONLY safe to render when the editor's store provider is in
 * the tree (i.e. `mode === 'edit'`). Blocks should call `ctx.inlineText(...)`
 * which delegates here in edit mode and renders a static element otherwise.
 *
 * @param {{
 *   blockId: string,
 *   propName: string,
 *   value: string,
 *   as?: string,
 *   style?: import('react').CSSProperties,
 *   className?: string,
 *   placeholder?: string,
 *   multiline?: boolean,
 * }} props
 */
export function InlineText({
  blockId,
  propName,
  value,
  as = 'span',
  style,
  className,
  placeholder = '',
  multiline = false,
}) {
  const editingId = useEditorStore((s) => s.inlineEditId)
  const editingProp = useEditorStore((s) => s.inlineEditProp)
  const updateBlockProps = useEditorStore((s) => s.updateBlockProps)
  const stopInlineEdit = useEditorStore((s) => s.stopInlineEdit)
  const ref = useRef(null)
  const isEditing = editingId === blockId && editingProp === propName

  useEffect(() => {
    if (!isEditing) return
    const el = ref.current
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }, [isEditing])

  const Tag = as
  const hasValue = typeof value === 'string' && value.length > 0
  const display = hasValue ? value : placeholder
  const baseStyle = { ...(hasValue ? null : { opacity: 0.5 }), ...style }

  if (!isEditing) {
    return (
      <Tag style={baseStyle} className={className} data-atlas-inline-prop={propName}>
        {display}
      </Tag>
    )
  }

  return (
    <Tag
      ref={ref}
      key={`${blockId}:${propName}:editing`}
      contentEditable
      suppressContentEditableWarning
      style={{
        ...baseStyle,
        outline: '2px solid var(--atlas-color-primary, #0F62FE)',
        outlineOffset: '2px',
        cursor: 'text',
        whiteSpace: multiline ? 'pre-wrap' : 'normal',
        minWidth: '1ch',
      }}
      className={className}
      data-atlas-inline-prop={propName}
      data-atlas-inline-editing="true"
      onPointerDownCapture={(e) => e.stopPropagation()}
      onMouseDownCapture={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
          e.preventDefault()
          stopInlineEdit()
        } else if (e.key === 'Enter' && !multiline && !e.shiftKey) {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      onBlur={(e) => {
        const raw = e.currentTarget.innerText
        const next = multiline ? raw : raw.replace(/\n+/g, ' ')
        updateBlockProps(blockId, { [propName]: next })
        stopInlineEdit()
      }}
    >
      {value}
    </Tag>
  )
}

/**
 * Build a render helper attached to `ctx.inlineText` so blocks don't need
 * to branch on `mode` themselves. In edit mode it returns an `<InlineText>`;
 * in preview/public it returns a static element with the same tag/style.
 *
 * @param {{ mode: string, blockId: string }} ctx
 */
export function createInlineTextHelper(ctx) {
  const editMode = ctx && ctx.mode === 'edit'
  return function inlineText({
    propName,
    value,
    as = 'span',
    style,
    className,
    placeholder,
    multiline = false,
  }) {
    if (editMode) {
      return (
        <InlineText
          blockId={ctx.blockId}
          propName={propName}
          value={value || ''}
          as={as}
          style={style}
          className={className}
          placeholder={placeholder}
          multiline={multiline}
        />
      )
    }
    const Tag = as
    return (
      <Tag style={style} className={className}>
        {value}
      </Tag>
    )
  }
}
