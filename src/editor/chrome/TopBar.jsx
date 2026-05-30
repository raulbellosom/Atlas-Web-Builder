import { useRef } from 'react'
import { useEditorStore, useTemporal } from '../store/EditorStoreProvider.jsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useNotifications } from '../notifications/NotificationsProvider.jsx'
import { listUnknownBlockTypes } from '../../persistence/serializePage.js'
import { es } from '../i18n/es.js'
import clsx from 'clsx'

/** Default badge shown when no brandLogo prop is provided. */
function DefaultBrandIcon() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 24, height: 24,
      background: '#1B35CC',
      borderRadius: 6,
      color: '#fff',
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '-0.03em',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      WB
    </span>
  )
}

const DEVICES = /** @type {const} */ (['desktop', 'tablet', 'mobile'])

const DEVICE_ICONS = {
  desktop: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 16h6M9 13v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  tablet: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="1" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="14" r="1" fill="currentColor" />
    </svg>
  ),
  mobile: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="5" y="1" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="14" r="0.75" fill="currentColor" />
    </svg>
  ),
}

const ICON_LEFT = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="1" y="1" width="6" height="16" rx="2" fill="currentColor" opacity=".15" />
    <line x1="7" y1="1" x2="7" y2="17" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const ICON_RIGHT = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="1" width="6" height="16" rx="2" fill="currentColor" opacity=".15" />
    <line x1="11" y1="1" x2="11" y2="17" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const ICON_PREVIEW = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export function TopBar({ onSaveDraft, onPublish, onTogglePreview, previewActive, onToggleLeft, onToggleRight, leftClosed, rightClosed, brandLogo, brandName }) {
  const page = useEditorStore((s) => s.page)
  const device = useEditorStore((s) => s.device)
  const setDevice = useEditorStore((s) => s.setDevice)
  const exportPage = useEditorStore((s) => s.exportPage)
  const replacePage = useEditorStore((s) => s.replacePage)
  const fileInputRef = useRef(null)
  const { blocks: registry } = useBuilder()
  const { notify } = useNotifications()

  const pastStates = useTemporal((s) => s.pastStates.length)
  const futureStates = useTemporal((s) => s.futureStates.length)
  const undo = useTemporal((s) => s.undo)
  const redo = useTemporal((s) => s.redo)

  function handleExport() {
    const json = exportPage({ pretty: true })
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeSlug = (page.slug || 'pagina').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '')
    a.href = url
    a.download = `${safeSlug || 'pagina'}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    notify('success', es.notifications.exportSuccess)
  }

  function handleImportClick() {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  function handleImportFile(event) {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const next = replacePage(String(reader.result || ''))
        notify('success', es.notifications.importSuccess)
        const knownTypes = new Set((registry.list() || []).map((d) => d.type))
        const unknown = listUnknownBlockTypes(next, knownTypes)
        if (unknown.length) {
          notify('warning', es.notifications.importUnknownTypes.replace('{types}', unknown.join(', ')), 8000)
        }
      } catch (err) {
        notify('error', es.topbar.importError.replace('{message}', (err && err.message) || String(err)), 0)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <header className="atlas-wb-topbar" role="toolbar" aria-label={es.topbar.title}>
      {/* Panel toggle — left */}
      <button
        type="button"
        className={clsx('atlas-wb-btn atlas-wb-btn--ghost atlas-wb-topbar__panel-toggle', !leftClosed && 'atlas-wb-btn--active')}
        onClick={onToggleLeft}
        aria-label={leftClosed ? 'Mostrar panel de bloques' : 'Ocultar panel de bloques'}
        title="Panel izquierdo (bloques)"
      >
        {ICON_LEFT}
      </button>

      <div className="atlas-wb-topbar__brand">
        {brandLogo ?? <DefaultBrandIcon />}
        <span>{brandName ?? es.topbar.title}</span>
      </div>

      {/* History */}
      <div className="atlas-wb-topbar__group" aria-label="Historial">
        <button
          type="button"
          className="atlas-wb-btn atlas-wb-btn--ghost atlas-wb-topbar__icon-btn"
          onClick={() => undo()}
          disabled={pastStates === 0}
          aria-label={es.topbar.undo}
          title={`${es.topbar.undo} (Ctrl+Z)`}
        >
          ↶
        </button>
        <button
          type="button"
          className="atlas-wb-btn atlas-wb-btn--ghost atlas-wb-topbar__icon-btn"
          onClick={() => redo()}
          disabled={futureStates === 0}
          aria-label={es.topbar.redo}
          title={`${es.topbar.redo} (Ctrl+Y)`}
        >
          ↷
        </button>
      </div>

      {/* Device switcher — icons only */}
      <div className="atlas-wb-topbar__group atlas-wb-topbar__devices" role="radiogroup" aria-label="Dispositivo">
        {DEVICES.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={device === d}
            className={clsx('atlas-wb-btn atlas-wb-btn--ghost atlas-wb-topbar__device-btn', device === d && 'atlas-wb-btn--active')}
            onClick={() => setDevice(d)}
            title={es.topbar.device[d]}
            aria-label={es.topbar.device[d]}
          >
            {DEVICE_ICONS[d]}
          </button>
        ))}
      </div>

      <div className="atlas-wb-topbar__spacer" />

      {/* Actions */}
      <div className="atlas-wb-topbar__group atlas-wb-topbar__actions">
        <button
          type="button"
          className={clsx('atlas-wb-btn atlas-wb-topbar__preview-btn', previewActive && 'atlas-wb-btn--active')}
          onClick={onTogglePreview}
          title={es.topbar.preview}
          aria-label={es.topbar.preview}
        >
          {ICON_PREVIEW}
          <span className="atlas-wb-topbar__btn-text">{es.topbar.preview}</span>
        </button>
        <button
          type="button"
          className="atlas-wb-btn atlas-wb-btn--ghost atlas-wb-topbar__text-btn"
          onClick={handleImportClick}
          title={es.topbar.importPage}
        >
          {es.topbar.importPage}
        </button>
        <button
          type="button"
          className="atlas-wb-btn atlas-wb-btn--ghost atlas-wb-topbar__text-btn"
          onClick={handleExport}
          title={es.topbar.exportPage}
        >
          {es.topbar.exportPage}
        </button>
        <button
          type="button"
          className="atlas-wb-btn atlas-wb-topbar__text-btn"
          onClick={() => onSaveDraft && onSaveDraft(page)}
          disabled={!onSaveDraft}
        >
          {es.topbar.saveDraft}
        </button>
        <button
          type="button"
          className="atlas-wb-btn atlas-wb-btn--primary"
          onClick={() => onPublish && onPublish(page)}
          disabled={!onPublish}
        >
          {es.topbar.publish}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Panel toggle — right */}
      <button
        type="button"
        className={clsx('atlas-wb-btn atlas-wb-btn--ghost atlas-wb-topbar__panel-toggle', !rightClosed && 'atlas-wb-btn--active')}
        onClick={onToggleRight}
        aria-label={rightClosed ? 'Mostrar panel de propiedades' : 'Ocultar panel de propiedades'}
        title="Panel derecho (propiedades)"
      >
        {ICON_RIGHT}
      </button>
    </header>
  )
}
