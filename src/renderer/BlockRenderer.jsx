import { memo } from 'react'
import { useBuilder } from '../provider/BuilderContext.js'
import { useTheme } from '../theme/ThemeProvider.jsx'
import { useEditorRender } from '../editor/dnd/EditorRenderContext.js'
import { createInlineTextHelper } from '../editor/inline/InlineText.jsx'
import { EffectsWrapper } from './EffectsWrapper.jsx'
import { useResource } from './useResource.js'

/**
 * Render a single block instance by id. The block must exist in the page
 * dictionary AND its `type` must be registered. Unknown types render a safe
 * fallback in development and `null` in production.
 *
 * Slot children are rendered through the same component so the renderer stays
 * recursive but bounded by the block dictionary (no cycles unless authored).
 *
 * When mounted inside the editor (via `EditorRenderContext`), block and slot
 * output is wrapped with editor chrome (selection, drag-and-drop). When the
 * context is absent (preview/public), the renderer outputs plain DOM.
 *
 * @param {{
 *   blockId: string,
 *   blocks: Object<string, import('../schema/block.js').BlockInstance>,
 *   mode?: 'edit'|'preview'|'public',
 * }} props
 */
function BlockRendererImpl({ blockId, blocks, mode = 'public' }) {
  const { blocks: registry, resources, mockResources, actions, permissions } = useBuilder()
  const theme = useTheme()
  const editor = useEditorRender()

  const instance = blocks?.[blockId]
  if (!instance) {
    return renderFallback(`Bloque no encontrado: "${blockId}"`)
  }

  const def = registry.get(instance.type)
  if (!def) {
    return renderFallback(`Tipo de bloque no permitido: "${instance.type}"`)
  }

  const props = { ...(def.defaultProps || {}), ...(instance.props || {}) }

  /**
   * Render the children of a named slot. Blocks call `ctx.slot('name')` from
   * their `render` function instead of touching the dictionary directly.
   *
   * @param {string} slotName
   */
  const slot = (slotName) => {
    const ids = (instance.children && instance.children[slotName]) || []
    const children = ids.map((childId) =>
      editor && mode === 'edit' ? (
        editor.renderBlock(childId, blocks, mode)
      ) : (
        <BlockRenderer key={childId} blockId={childId} blocks={blocks} mode={mode} />
      ),
    )
    if (editor && mode === 'edit' && editor.renderSlot) {
      return editor.renderSlot({
        parentId: blockId,
        slotName,
        childIds: ids,
        children,
      })
    }
    return children
  }

  const ctx = {
    mode,
    theme,
    resources: mode === 'edit' ? mockResources || resources : resources,
    actions,
    permissions,
    slot,
    blockId,
  }
  ctx.inlineText = createInlineTextHelper(ctx)
  ctx.resource = (name, params) => useResource(ctx.resources, name, params)

  const Component = def.render
  const rendered = <Component {...props} ctx={ctx} />

  return (
    <EffectsWrapper blockId={blockId} props={props} mode={mode}>
      {rendered}
    </EffectsWrapper>
  )
}

/**
 * In development surface a visible placeholder so authors can see what's
 * wrong. In production fail silently to avoid leaking debug info.
 *
 * @param {string} message
 */
function renderFallback(message) {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return null
  }
  return (
    <div
      role="alert"
      data-atlas-fallback="true"
      style={{
        padding: '12px 16px',
        border: '1px dashed var(--atlas-color-danger, #DC2626)',
        color: 'var(--atlas-color-danger, #DC2626)',
        background: 'rgba(220, 38, 38, 0.04)',
        borderRadius: 'var(--atlas-radius-md, 8px)',
        font: 'var(--atlas-fontSize-sm, 0.875rem) / 1.4 var(--atlas-font-sans, system-ui)',
      }}
    >
      {message}
    </div>
  )
}

export const BlockRenderer = memo(BlockRendererImpl)
BlockRenderer.displayName = 'BlockRenderer'
