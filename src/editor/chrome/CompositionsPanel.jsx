import { useCallback, useEffect, useState } from 'react'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { TextField } from '../fields/TextField.jsx'
import { extractComposition } from '../../templates/compositions.js'

export function CompositionsPanel({ onInserted }) {
  const { compositions, blocks: registry } = useBuilder()
  const page = useEditorStore(state => state.page), selectedId = useEditorStore(state => state.selectedId)
  const applyTemplate = useEditorStore(state => state.applyTemplate)
  const activeRegion = useEditorStore(state => state.activeRegion)
  const [items, setItems] = useState([]), [name, setName] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(null)
  const refresh = useCallback(async () => setItems(await compositions.list()), [compositions])
  useEffect(() => { let active = true; compositions.list().then(list => { if (active) setItems(list) }, cause => { if (active) setError(cause.message) }); return () => { active = false } }, [compositions])
  async function action(run) { setBusy(true); setError(''); try { await run() } catch (cause) { setError(cause.message) } finally { setBusy(false) } }
  async function save(item) {
    if (!selectedId) throw Error('Selecciona el contenedor o elemento que quieres guardar.')
    await compositions.save({ ...(item ? { id: item.id, expectedRevision: item.revision } : {}), name: item?.name ?? name.trim(), fragment: extractComposition(page, selectedId) })
    setName(''); setConfirm(null); await refresh()
  }
  async function insert(item) {
    const saved = await compositions.get(item.id)
    for (const block of Object.values(saved.fragment.blocks)) if (!registry.has(block.type)) throw Error(`El catálogo actual no incluye ${block.type}.`)
    applyTemplate({ build: () => saved.fragment }, { regionName: activeRegion || 'main' }); onInserted?.()
  }
  return <section aria-label="Mis bloques reutilizables" className="atlas-wb-palette">
    <h3>Mis bloques</h3>
    <p>Guarda la selección con sus elementos y estilos. Cada inserción crea una copia editable.</p>
    {compositions.save && <div role="group" aria-label="Guardar bloque propio">
      <TextField label="Nombre del bloque" value={name} onChange={value => setName(value.slice(0,100))} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (!busy && selectedId && name.trim()) action(() => save()) } }} />
      <button className="atlas-wb-btn" type="button" disabled={busy || !selectedId || !name.trim()} onClick={() => action(() => save())}>Guardar selección</button>
    </div>}
    {error && <p role="alert">{error}</p>}
    {!items.length && <p className="atlas-wb-empty">Aún no hay bloques guardados.</p>}
    {items.map(item => <article key={item.id} className="atlas-wb-palette__item-body" style={{ display: 'grid', gap: 8, padding: 12, borderBottom: '1px solid var(--awb-border, #888)' }}>
      <strong>{item.name}</strong>
      <button className="atlas-wb-btn" type="button" disabled={busy} onClick={() => action(() => insert(item))}>Insertar {item.name}</button>
      {compositions.save && <button className="atlas-wb-btn" type="button" disabled={busy || !selectedId} onClick={() => setConfirm({ item, action: 'replace' })}>Reemplazar por selección</button>}
      {compositions.remove && <button className="atlas-wb-btn" type="button" disabled={busy} onClick={() => setConfirm({ item, action: 'remove' })}>Eliminar {item.name}</button>}
      {confirm?.item.id === item.id && <div role="group" aria-label="Confirmar cambio del bloque">
        <p>{confirm.action === 'remove' ? 'Se eliminará de la biblioteca. Las copias insertadas se conservan.' : 'Se reemplazará la versión guardada. Las copias insertadas se conservan.'}</p>
        <button className="atlas-wb-btn" type="button" disabled={busy} onClick={() => action(async () => { if (confirm.action === 'replace') await save(item); else { await compositions.remove(item.id, item.revision); setConfirm(null); await refresh() } })}>Confirmar</button>
        <button className="atlas-wb-btn" type="button" onClick={() => setConfirm(null)}>Cancelar</button>
      </div>}
    </article>)}
  </section>
}
