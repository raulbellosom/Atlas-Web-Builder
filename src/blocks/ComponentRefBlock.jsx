import { useMemo } from 'react'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { useBuilder } from '../provider/BuilderContext.js'
import { BlockRenderer } from '../renderer/BlockRenderer.jsx'
import { EditorRenderContext } from '../editor/dnd/EditorRenderContext.js'
import { COMPONENT_REF_TYPE, overridableFromRegistry, resolveComponents } from '../components/resolve.js'

// Instance of a site-level synced component. Public pages expand references before rendering (see AtlasWebRenderer);
// this block is what the editor shows: the live expanded component, not selectable piece by piece, with a label.
function ComponentInstance({ componentId, overrides, ctx }) {
  const { syncedComponents, blocks: registry } = useBuilder()
  const definitions = syncedComponents?.definitions
  const expanded = useMemo(() => {
    const probe = { schemaVersion: 1, id: 'instance', slug: '/', title: '', visibility: 'public', regions: { main: { id: 'main', children: ['ref'] } }, blocks: { ref: { id: 'ref', type: COMPONENT_REF_TYPE, props: { componentId, overrides } } } }
    return resolveComponents(probe, definitions, { overridable: overridableFromRegistry(registry) })
  }, [componentId, overrides, definitions, registry])
  const editing = ctx?.mode === 'edit'
  const roots = expanded.page.regions.main.children
  if (!roots.length || !expanded.page.blocks[roots[0]]) {
    return editing
      ? <div role="note" style={{ padding: 12, border: '1px dashed var(--awb-danger, #c0392b)', fontFamily: 'var(--atlas-font-sans)' }}>El componente «{String(componentId).slice(0, 40)}» ya no existe. Desvincula o elimina este bloque.</div>
      : null
  }
  const name = definitions?.[componentId]?.name ?? componentId
  return (
    <div data-atlas-component={componentId} style={editing ? { position: 'relative', outline: '1px dashed var(--awb-accent, #335dff)', outlineOffset: 2 } : undefined}>
      {editing && <span style={{ position: 'absolute', top: -10, left: 0, zIndex: 2, padding: '1px 6px', fontSize: 11, lineHeight: 1.4, background: 'var(--awb-accent, #335dff)', color: '#fff', borderRadius: 4, pointerEvents: 'none' }}>Componente · {name}</span>}
      {/* The expansion is read-only content: it must not receive editor chrome (selection, drag, drop zones). */}
      <EditorRenderContext.Provider value={null}>
        {roots.map((id) => <BlockRenderer key={id} blockId={id} blocks={expanded.page.blocks} mode={editing ? 'preview' : ctx?.mode ?? 'public'} eager />)}
      </EditorRenderContext.Provider>
    </div>
  )
}

export const ComponentRefBlock = defineBlock({
  type: COMPONENT_REF_TYPE,
  label: 'Componente',
  category: 'components',
  icon: 'layout',
  hidden: true, // created from a selection, never dragged from the palette
  defaultProps: { componentId: '', overrides: {} },
  fields: { componentId: { type: 'text', label: 'Identificador del componente', readOnly: true } },
  render: (props) => <ComponentInstance {...props} />,
})
