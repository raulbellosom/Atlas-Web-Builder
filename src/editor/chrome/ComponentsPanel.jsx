import { useState } from 'react'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { TextField } from '../fields/TextField.jsx'
import { componentFromBlock, componentIdFromName, detachReference, listOverridable, referencesTo, withOverride } from '../../components/actions.js'
import { COMPONENT_LIMITS, COMPONENT_REF_TYPE, overridableFromRegistry } from '../../components/resolve.js'

// Site-level synced components: one definition, many pages. The host provides `syncedComponents`
// ({ definitions, save(nextDefinitions) }); every change goes through `save` so the host owns revisions and permissions.
export function ComponentsPanel({ onInserted }) {
  const { syncedComponents, blocks: registry } = useBuilder()
  const definitions = syncedComponents?.definitions ?? {}
  const page = useEditorStore((state) => state.page)
  const selectedId = useEditorStore((state) => state.selectedId)
  const editing = useEditorStore((state) => state.editingComponent)
  const insertBlock = useEditorStore((state) => state.insertBlock)
  const setPage = useEditorStore((state) => state.setPage)
  const enterComponentEdit = useEditorStore((state) => state.enterComponentEdit)
  const activeRegion = useEditorStore((state) => state.activeRegion)
  const [name, setName] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(null)
  const ids = Object.keys(definitions)
  const selected = selectedId ? page.blocks[selectedId] : null
  const selectedIsReference = selected?.type === COMPONENT_REF_TYPE

  async function run(task) { setBusy(true); setError(''); try { await task() } catch (cause) { setError(cause.message) } finally { setBusy(false) } }

  const convert = () => run(async () => {
    if (!selectedId || selectedIsReference) throw Error('Selecciona el elemento que quieres convertir en componente.')
    if (ids.length >= COMPONENT_LIMITS.components) throw Error(`El sitio admite hasta ${COMPONENT_LIMITS.components} componentes.`)
    const id = componentIdFromName(name, definitions)
    const converted = componentFromBlock(page, selectedId, name)
    converted.page.blocks[selectedId].props = { componentId: id }
    await syncedComponents.save({ ...definitions, [id]: converted.definition })
    setPage(converted.page)
    setName('')
  })

  const insert = (id) => run(async () => {
    const created = insertBlock(COMPONENT_REF_TYPE, registry.get(COMPONENT_REF_TYPE), { regionName: activeRegion || 'main' }, { componentId: id })
    if (!created) throw Error('No se pudo insertar el componente aquí.')
    onInserted?.()
  })

  const detach = () => run(async () => {
    const result = detachReference(page, selectedId, definitions, { overridable: overridableFromRegistry(registry) })
    if (result.errors.length) throw Error(result.errors[0].message)
    setPage(result.page)
  })

  const remove = (id) => run(async () => {
    const { [id]: removed, ...rest } = definitions
    void removed
    await syncedComponents.save(rest)
    setConfirm(null)
  })

  return <section aria-label="Componentes del sitio" className="atlas-wb-palette">
    <h3>Componentes</h3>
    <p>Un componente se define una vez y se reutiliza en varias páginas: al editarlo, todas se actualizan al publicar.</p>
    {editing && <p role="status">Estás editando «{editing.name}». Guarda o cancela antes de convertir o insertar componentes.</p>}
    {!editing && <div role="group" aria-label="Convertir selección en componente">
      <TextField label="Nombre del componente" value={name} onChange={(value) => setName(value.slice(0, 80))} />
      <button className="atlas-wb-btn" type="button" disabled={busy || !selectedId || selectedIsReference || !name.trim()} onClick={convert}>Convertir selección en componente</button>
      {selectedIsReference && <button className="atlas-wb-btn" type="button" disabled={busy} onClick={detach}>Desvincular este componente (copia independiente)</button>}
    </div>}
    {error && <p role="alert">{error}</p>}
    {!ids.length && <p className="atlas-wb-empty">Aún no hay componentes en este sitio.</p>}
    {ids.map((id) => {
      const used = referencesTo(page, id).length
      return <article key={id} className="atlas-wb-palette__item-body" style={{ display: 'grid', gap: 8, padding: 12, borderBottom: '1px solid var(--awb-border, #888)' }}>
        <strong>{definitions[id].name}</strong>
        <small>{used ? `Usado ${used} ${used === 1 ? 'vez' : 'veces'} en esta página` : 'No se usa en esta página'}</small>
        {!editing && <>
          <button className="atlas-wb-btn" type="button" disabled={busy} onClick={() => insert(id)}>Insertar {definitions[id].name}</button>
          <button className="atlas-wb-btn" type="button" disabled={busy} onClick={() => enterComponentEdit(id, definitions[id])}>Editar {definitions[id].name}</button>
          <button className="atlas-wb-btn" type="button" disabled={busy} onClick={() => setConfirm(id)}>Eliminar {definitions[id].name}</button>
        </>}
        {confirm === id && <div role="group" aria-label="Confirmar eliminación">
          <p>Se eliminará la definición. Si alguna página la sigue usando, el servidor lo rechazará y verás el aviso.</p>
          <button className="atlas-wb-btn" type="button" disabled={busy} onClick={() => remove(id)}>Eliminar definitivamente</button>
          <button className="atlas-wb-btn" type="button" onClick={() => setConfirm(null)}>Cancelar</button>
        </div>}
      </article>
    })}
  </section>
}

// Shown over the canvas while a definition is being edited: the page is NOT what is being saved.
export function ComponentEditBanner() {
  const { syncedComponents } = useBuilder()
  const editing = useEditorStore((state) => state.editingComponent)
  const definitions = syncedComponents?.definitions ?? {}
  const exitComponentEdit = useEditorStore((state) => state.exitComponentEdit)
  const currentComponentDefinition = useEditorStore((state) => state.currentComponentDefinition)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  if (!editing) return null
  async function done() {
    setBusy(true); setError('')
    try {
      const result = currentComponentDefinition()
      await syncedComponents.save({ ...definitions, [result.id]: result.definition })
      exitComponentEdit()
    } catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }
  return <div role="region" aria-label="Edición de componente" className="atlas-wb-component-banner" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', background: 'var(--awb-accent, #335dff)', color: '#fff' }}>
    <strong>Editando componente: {editing.name}</strong>
    <span>Los cambios se aplican a todas las páginas que lo usan.</span>
    {error && <span role="alert">{error}</span>}
    <button className="atlas-wb-btn" type="button" disabled={busy} onClick={done}>Guardar componente</button>
    <button className="atlas-wb-btn" type="button" disabled={busy} onClick={() => exitComponentEdit()}>Cancelar</button>
  </div>
}

// Inspector for a selected reference: which component it is, edit/detach, and per-page content overrides.
export function ComponentReferenceInspector({ blockId }) {
  const { syncedComponents, blocks: registry } = useBuilder()
  const block = useEditorStore((state) => state.page.blocks[blockId])
  const updateBlockProps = useEditorStore((state) => state.updateBlockProps)
  const enterComponentEdit = useEditorStore((state) => state.enterComponentEdit)
  const setPage = useEditorStore((state) => state.setPage)
  const page = useEditorStore((state) => state.page)
  const [error, setError] = useState('')
  const definitions = syncedComponents?.definitions ?? {}
  const definition = definitions[block?.props?.componentId]
  if (!definition) return <p role="alert">Este componente ya no existe en el sitio. Desvincula o elimina el bloque.</p>
  const overrides = block.props.overrides ?? {}
  const rows = listOverridable(definition.section, registry)
  function detach() {
    const result = detachReference(page, blockId, definitions, { overridable: overridableFromRegistry(registry) })
    if (result.errors.length) setError(result.errors[0].message); else setPage(result.page)
  }
  return <div className="atlas-wb-props__section-body" role="group" aria-label={`Componente ${definition.name}`}>
    <strong>{definition.name}</strong>
    <p>Los cambios del componente se aplican a todas las páginas que lo usan. Aquí solo puedes cambiar contenido de esta página.</p>
    <button className="atlas-wb-btn" type="button" onClick={() => enterComponentEdit(block.props.componentId, definition)}>Editar componente</button>
    <button className="atlas-wb-btn" type="button" onClick={detach}>Desvincular (copia independiente)</button>
    {error && <p role="alert">{error}</p>}
    {rows.map((row) => <TextField key={`${row.path}:${row.prop}`} label={row.label} value={overrides[row.path]?.[row.prop] ?? row.value}
      onChange={(value) => updateBlockProps(blockId, { overrides: withOverride(overrides, row.path, row.prop, value.slice(0, COMPONENT_LIMITS.valueLength), row.value) })} />)}
    {Object.keys(overrides).length > 0 && <button className="atlas-wb-btn" type="button" onClick={() => updateBlockProps(blockId, { overrides: {} })}>Restablecer contenido del componente</button>}
  </div>
}
