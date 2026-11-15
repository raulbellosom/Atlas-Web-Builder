import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle, Upload } from 'lucide-react'
import clsx from 'clsx'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { ASSET_DRAG_TYPE, normalizeAssetList, uploadAsset } from './assetSource.js'
import { useAssetActions } from './useAssetActions.js'

const message = (error) => error?.message || String(error)

/**
 * "Medios" tab of the left panel: the host's asset library, always at hand.
 * Thumbnails drag onto any block with an image; with such a block selected,
 * a click puts the image there (the keyboard and touch path).
 */
export function MediaTab() {
  const { assets, accepts, apply } = useAssetActions()
  const selectedId = useEditorStore((s) => s.selectedId)
  const target = selectedId && accepts(selectedId) ? selectedId : null
  const canUpload = typeof assets?.upload === 'function'
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [next, setNext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [dropOver, setDropOver] = useState(false)
  const fileRef = useRef(null)
  const request = useRef(0)

  const load = useCallback(async (cursor) => {
    const id = ++request.current
    setLoading(true); setError(null)
    try {
      const page = normalizeAssetList(await assets.list({ query: query.trim(), cursor }))
      if (id !== request.current) return
      setItems((previous) => (cursor ? [...previous, ...page.items] : page.items))
      setNext(page.next)
    } catch (err) { if (id === request.current) setError(message(err)) }
    finally { if (id === request.current) setLoading(false) }
  }, [assets, query])

  useEffect(() => {
    const timer = setTimeout(() => load(), 250)
    return () => clearTimeout(timer)
  }, [load])

  async function run(fn) {
    setBusy(true); setError(null)
    try { await fn() } catch (err) { setError(message(err)) } finally { setBusy(false) }
  }

  function use(asset) {
    if (!target || busy) return
    run(() => apply(target, asset))
  }

  function upload(fileList) {
    const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'))
    if (!files.length || !canUpload) return
    run(async () => {
      let first = null
      for (const file of files) {
        const asset = await uploadAsset(assets, file)
        first ??= asset
      }
      if (target && first) await apply(target, first)
      await load()
    })
  }

  // Hosts that ignore `query` still get a name filter.
  const needle = query.trim().toLowerCase()
  const visible = needle ? items.filter((a) => (a.name || '').toLowerCase().includes(needle)) : items

  return (
    <div className="atlas-wb-media-tab" aria-busy={loading || busy}>
      <input
        type="search"
        className="atlas-wb-field__input"
        placeholder="Buscar imágenes..."
        aria-label="Buscar imágenes"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="atlas-wb-media-tab__hint" role="status">
        {target ? 'Haz clic en una imagen para usarla en el bloque seleccionado, o arrástrala a otro bloque.' : 'Arrastra una imagen sobre un bloque, o selecciona un bloque con imagen y haz clic en ella.'}
      </p>
      {canUpload ? (
        <div
          className={clsx('atlas-wb-media-tab__drop', dropOver && 'atlas-wb-media-tab__drop--over')}
          onDragOver={(e) => { if (Array.from(e.dataTransfer.types).includes('Files')) { e.preventDefault(); setDropOver(true) } }}
          onDragLeave={() => setDropOver(false)}
          onDrop={(e) => { e.preventDefault(); setDropOver(false); upload(e.dataTransfer.files) }}
        >
          <button type="button" className="atlas-wb-btn atlas-wb-btn--ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <LoaderCircle className="atlas-wb-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
            {busy ? 'Procesando...' : 'Subir imágenes'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
        </div>
      ) : null}
      {error ? <p className="atlas-wb-media-tab__error" role="alert">{error}</p> : null}
      {loading && !items.length ? (
        <p className="atlas-wb-empty">Cargando imágenes...</p>
      ) : !visible.length ? (
        <p className="atlas-wb-empty">{needle ? 'Sin resultados.' : 'Todavía no hay imágenes en la biblioteca.'}</p>
      ) : (
        <ul className="atlas-wb-media-tab__grid" aria-label="Imágenes de la biblioteca">
          {visible.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                draggable
                className="atlas-wb-media-tab__item"
                title={asset.name}
                aria-label={target ? `Usar ${asset.name || 'imagen'} en el bloque seleccionado` : `${asset.name || 'Imagen'} (arrastra a un bloque)`}
                aria-disabled={!target || busy}
                onClick={() => use(asset)}
                onDragStart={(e) => {
                  e.dataTransfer.setData(ASSET_DRAG_TYPE, JSON.stringify(asset))
                  e.dataTransfer.effectAllowed = 'copy'
                }}
              >
                <img src={asset.thumbnailUrl || asset.url} alt={asset.alt || ''} loading="lazy" draggable={false} />
                <span>{asset.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {next ? (
        <button type="button" className="atlas-wb-btn atlas-wb-btn--ghost" disabled={loading} onClick={() => load(next)}>
          {loading ? 'Cargando...' : 'Cargar más'}
        </button>
      ) : null}
    </div>
  )
}
