import { useRef } from 'react'
import { useEditorStore, useTemporal } from '../store/EditorStoreProvider.jsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useNotifications } from '../notifications/NotificationsProvider.jsx'
import { listUnknownBlockTypes } from '../../persistence/serializePage.js'
import { es } from '../i18n/es.js'
import clsx from 'clsx'
import { useEditorCapabilities } from '../capabilities.jsx'
import { AppearanceSelect, ToolbarCommands } from './ToolbarCommands.jsx'
import { Eye, EyeOff, Monitor, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Redo2, Smartphone, Tablet, Undo2 } from 'lucide-react'
import { IconButton } from '../ui/OverlayControls.jsx'

/** Default badge shown when no brandLogo prop is provided. */
function DefaultBrandIcon() {
  return <span className="atlas-wb-topbar__badge" aria-hidden="true">WB</span>
}

const DEVICES = /** @type {const} */ (['desktop', 'tablet', 'mobile'])
const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone }

export function TopBar({ onSaveDraft, onPublish, onTogglePreview, previewActive, onToggleLeft, onToggleRight, leftClosed, rightClosed, brandLogo, brandName, compact = false }) {
  const capabilities = useEditorCapabilities()
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
      <div className="atlas-wb-topbar__start">
        <IconButton
          className="atlas-wb-topbar__panel-toggle"
          icon={leftClosed ? PanelLeftOpen : PanelLeftClose}
          active={!leftClosed}
          onClick={onToggleLeft}
          label={leftClosed ? 'Mostrar panel de bloques' : 'Ocultar panel de bloques'}
        />
        <div className="atlas-wb-topbar__brand">
          {brandLogo ?? <DefaultBrandIcon />}
          <span>{brandName ?? es.topbar.title}</span>
        </div>
        <div className="atlas-wb-topbar__group" role="group" aria-label="Historial">
          <IconButton icon={Undo2} onClick={() => undo()} disabled={pastStates === 0} label={es.topbar.undo} />
          <IconButton icon={Redo2} onClick={() => redo()} disabled={futureStates === 0} label={es.topbar.redo} />
        </div>
      </div>

      {/* Device switcher — website preview width, not the editor's own layout */}
      <div className="atlas-wb-segment atlas-wb-topbar__devices" role="radiogroup" aria-label="Dispositivo">
        {DEVICES.map((d) => (
          <IconButton
            key={d}
            role="radio"
            aria-checked={device === d}
            icon={DEVICE_ICONS[d]}
            active={device === d}
            onClick={() => setDevice(d)}
            label={es.topbar.device[d]}
          />
        ))}
      </div>

      <div className="atlas-wb-topbar__end">
        {!compact && <AppearanceSelect />}
        <button
          type="button"
          className={clsx('atlas-wb-btn atlas-wb-btn--ghost atlas-wb-topbar__preview-btn', previewActive && 'atlas-wb-btn--active')}
          onClick={onTogglePreview}
          aria-label={es.topbar.preview}
          aria-pressed={!!previewActive}
        >
          {previewActive ? <EyeOff /> : <Eye />}
          <span className="atlas-wb-topbar__btn-text">{es.topbar.preview}</span>
        </button>
        <ToolbarCommands compact={compact} device={device} setDevice={setDevice}
          onImport={handleImportClick} onExport={handleExport} allowImport={capabilities.jsonImport !== false}
          onSave={onSaveDraft ? () => onSaveDraft(page) : undefined} onPublish={onPublish ? () => onPublish(page) : undefined} />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
          aria-hidden="true"
          tabIndex={-1}
        />
        <IconButton
          className="atlas-wb-topbar__panel-toggle"
          icon={rightClosed ? PanelRightOpen : PanelRightClose}
          active={!rightClosed}
          onClick={onToggleRight}
          label={rightClosed ? 'Mostrar panel de propiedades' : 'Ocultar panel de propiedades'}
        />
      </div>
    </header>
  )
}
