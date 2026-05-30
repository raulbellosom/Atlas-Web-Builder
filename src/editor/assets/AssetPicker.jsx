import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { es } from '../i18n/es.js'

function isSafeUrl(v) {
  if (typeof v !== 'string' || !v.trim()) return false
  return /^(https?:|\/|data:image\/|data:video\/)/i.test(v)
}

/**
 * AssetPicker — full-screen modal with three tabs:
 *   1. URL     — paste / type any image or video URL (always available)
 *   2. Biblioteca — grid of uploaded assets (requires AssetSource)
 *   3. Subir   — file upload / drag-drop (requires AssetSource.upload)
 *
 * @param {{ onPick: (asset: any) => void, onClose: () => void, accept?: string }} props
 */
export function AssetPicker({ onPick, onClose, accept = 'image/*' }) {
  const { assets } = useBuilder()
  const hasAssets  = !!assets
  const canUpload  = !!(assets && typeof assets.upload === 'function')

  const defaultTab = 'url'
  const [tab, setTab] = useState(defaultTab)

  // ── URL tab ────────────────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState('')
  const urlValid = isSafeUrl(urlInput)

  function confirmUrl() {
    if (!urlValid) return
    onPick({ id: urlInput, url: urlInput, kind: 'image', name: urlInput.split('/').pop() || 'imagen' })
  }

  // ── Biblioteca tab ─────────────────────────────────────────────────────────
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [libError, setLibError] = useState(null)
  const [search, setSearch]   = useState('')

  const loadAssets = useCallback(async () => {
    if (!assets) return
    try { setLoading(true); setLibError(null)
      const list = await assets.list()
      setItems(Array.isArray(list) ? list : [])
    } catch (err) { setLibError(err?.message || String(err))
    } finally { setLoading(false) }
  }, [assets])

  useEffect(() => {
    if (tab === 'library') loadAssets()
  }, [tab, loadAssets])

  const filtered = search.trim()
    ? items.filter((a) => (a.name || '').toLowerCase().includes(search.trim().toLowerCase()))
    : items

  // ── Subir tab ──────────────────────────────────────────────────────────────
  const fileRef     = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [upError, setUpError]     = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  async function handleFile(file) {
    if (!file || !canUpload) return
    try { setUploading(true); setUpError(null)
      const asset = await assets.upload(file)
      if (asset) onPick(asset)
    } catch (err) { setUpError(err?.message || String(err))
    } finally { setUploading(false) }
  }

  function onDropZone(e) {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  // ── Close on Escape or backdrop click ──────────────────────────────────────
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const TABS = [
    { id: 'url',     label: 'URL' },
    ...(hasAssets  ? [{ id: 'library', label: 'Biblioteca' }] : []),
    ...(canUpload  ? [{ id: 'upload',  label: 'Subir' }] : []),
  ]

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="atlas-wb-media-backdrop"
        role="presentation"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="atlas-wb-media-modal"
        role="dialog"
        aria-modal="true"
        aria-label={es.assets.pickerLabel}
      >
        {/* Header */}
        <div className="atlas-wb-media-modal__header">
          <strong className="atlas-wb-media-modal__title">{es.assets.pickerLabel}</strong>
          <button type="button" className="atlas-wb-media-modal__close" onClick={onClose} aria-label={es.assets.close}>✕</button>
        </div>

        {/* Tabs */}
        {TABS.length > 1 && (
          <div className="atlas-wb-media-modal__tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={clsx('atlas-wb-media-modal__tab', tab === t.id && 'atlas-wb-media-modal__tab--active')}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="atlas-wb-media-modal__body">

          {/* ── URL tab ── */}
          {tab === 'url' && (
            <div className="atlas-wb-media-modal__url-tab">
              <p className="atlas-wb-empty" style={{ marginBottom: 12 }}>
                Pega la URL de una imagen o video externo.
              </p>
              <input
                type="url"
                className="atlas-wb-field__input"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmUrl() }}
                /* eslint-disable-next-line jsx-a11y/no-autofocus */
                autoFocus
              />
              {urlInput && !urlValid && (
                <p style={{ color: 'var(--awb-danger)', fontSize: 11, marginTop: 4 }}>
                  {es.assets.invalidUrl}
                </p>
              )}
              {urlInput && urlValid && (
                <div className="atlas-wb-media-modal__url-preview">
                  <img src={urlInput} alt="preview" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
              )}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="atlas-wb-btn atlas-wb-btn--ghost" onClick={onClose}>Cancelar</button>
                <button type="button" className="atlas-wb-btn atlas-wb-btn--primary" onClick={confirmUrl} disabled={!urlValid}>
                  Usar URL
                </button>
              </div>
            </div>
          )}

          {/* ── Biblioteca tab ── */}
          {tab === 'library' && (
            <div className="atlas-wb-media-modal__library-tab">
              <input
                type="search"
                className="atlas-wb-field__input"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              {libError && <p style={{ color: 'var(--awb-danger)', fontSize: 12 }}>{libError}</p>}
              {loading ? (
                <p className="atlas-wb-empty">{es.assets.loading}</p>
              ) : filtered.length === 0 ? (
                <p className="atlas-wb-empty">{items.length === 0 ? es.assets.empty : 'Sin resultados.'}</p>
              ) : (
                <ul className="atlas-wb-media-modal__grid" role="listbox">
                  {filtered.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="atlas-wb-media-modal__asset-item"
                        onClick={() => onPick(a)}
                        title={a.name}
                      >
                        {a.kind === 'image' || !a.kind ? (
                          <img src={a.url} alt={a.alt || a.name} loading="lazy" />
                        ) : (
                          <div className="atlas-wb-media-modal__asset-icon">🎬</div>
                        )}
                        <span className="atlas-wb-media-modal__asset-name">{a.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Subir tab ── */}
          {tab === 'upload' && (
            <div className="atlas-wb-media-modal__upload-tab">
              <div
                className={clsx('atlas-wb-media-modal__dropzone', isDragOver && 'atlas-wb-media-modal__dropzone--over')}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDropZone}
                role="button"
                tabIndex={0}
                aria-label="Zona de carga"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
              >
                <div className="atlas-wb-media-modal__dropzone-icon">⬆</div>
                <p>{uploading ? es.assets.uploading : 'Arrastra un archivo aquí o haz clic para seleccionar'}</p>
                <p style={{ fontSize: 11, opacity: 0.6 }}>PNG, JPG, GIF, WebP, SVG, MP4…</p>
              </div>
              {upError && <p style={{ color: 'var(--awb-danger)', fontSize: 12, marginTop: 8 }}>{upError}</p>}
              <input
                ref={fileRef}
                type="file"
                accept={accept}
                hidden
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
