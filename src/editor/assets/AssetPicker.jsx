import { useCallback, useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Film, Upload, X } from 'lucide-react'
import { OverlayPortal } from '../ui/EditorAppearance.jsx'
import { onTabListKeyDown } from '../ui/keyboard.js'
import clsx from 'clsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { es } from '../i18n/es.js'
import { useEditorCapabilities } from '../capabilities.jsx'
import { normalizeAssetList, resolveAsset, uploadAsset } from './assetSource.js'

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
export function AssetPicker({ onPick, onClose, accept = 'image/*', returnFocusRef }) {
  const capabilities = useEditorCapabilities()
  const { assets } = useBuilder()
  const hasAssets  = !!assets
  const canUpload  = !!(assets && typeof assets.upload === 'function')

  const defaultTab = capabilities.manualAssetUrls === false ? 'library' : 'url'
  const [tab, setTab] = useState(defaultTab)

  // ── URL tab ────────────────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState('')
  const urlValid = isSafeUrl(urlInput)

  function confirmUrl() {
    if (!urlValid || capabilities.manualAssetUrls === false) return
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
      setItems(normalizeAssetList(await assets.list()).items)
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
      const asset = await uploadAsset(assets, file)
      if (asset) onPick(await resolveAsset(assets, asset))
    } catch (err) { setUpError(err?.message || String(err))
    } finally { setUploading(false) }
  }

  async function pickListed(asset) {
    try { setLibError(null); onPick(await resolveAsset(assets, asset)) }
    catch (err) { setLibError(err?.message || String(err)) }
  }

  function onDropZone(e) {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  const TABS = [
    ...(capabilities.manualAssetUrls === false ? [] : [{ id: 'url', label: 'URL' }]),
    ...(hasAssets  ? [{ id: 'library', label: 'Biblioteca' }] : []),
    ...(canUpload  ? [{ id: 'upload',  label: 'Subir' }] : []),
  ]

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
      <OverlayPortal portal={Dialog.Portal}>
        <Dialog.Overlay className="atlas-wb-media-backdrop" />
        <Dialog.Content
          className="atlas-wb-media-modal"
          aria-describedby={undefined}
          // The picker is opened programmatically, not by a Dialog.Trigger: return focus to the invoker.
          onCloseAutoFocus={event => { event.preventDefault(); returnFocusRef?.current?.focus() }}
        >
        {/* Header */}
        <div className="atlas-wb-media-modal__header">
          <Dialog.Title className="atlas-wb-media-modal__title">{es.assets.pickerLabel}</Dialog.Title>
          <Dialog.Close className="atlas-wb-icon-btn atlas-wb-media-modal__close" aria-label={es.assets.close}><X /></Dialog.Close>
        </div>

        {/* Tabs */}
        {TABS.length > 1 && (
          <div className="atlas-wb-media-modal__tabs" role="tablist" onKeyDown={onTabListKeyDown} tabIndex={-1}>
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
                        onClick={() => pickListed(a)}
                        title={a.name}
                      >
                        {a.kind === 'image' || !a.kind ? (
                          <img src={a.thumbnailUrl || a.url} alt={a.alt || a.name} loading="lazy" />
                        ) : (
                          <div className="atlas-wb-media-modal__asset-icon"><Film /></div>
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
                <div className="atlas-wb-media-modal__dropzone-icon"><Upload /></div>
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
        </Dialog.Content>
      </OverlayPortal>
    </Dialog.Root>
  )
}
