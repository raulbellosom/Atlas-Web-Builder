import { Popover } from '../ui/OverlayControls.jsx'
import { useEditorAppearance } from '../ui/EditorAppearance.jsx'

export function AppearanceSelect() {
  const appearance = useEditorAppearance()
  if (!appearance) return null
  return <label className="atlas-wb-appearance-control"><span className="atlas-wb-sr-only">Apariencia del editor</span>
    <select aria-label="Apariencia del editor" value={appearance.appearance} onChange={event => appearance.setAppearance(event.target.value)}>
      <option value="light">Claro</option><option value="dark">Oscuro</option><option value="system">Sistema</option>
    </select></label>
}

export function ToolbarCommands({ compact, device, setDevice, onImport, onExport, onSave, onPublish, allowImport }) {
  const actions = <div className="atlas-wb-toolbar-commands">
    <button type="button" className="atlas-wb-btn atlas-wb-btn--ghost" onClick={onImport} disabled={!allowImport}>Importar JSON</button>
    <button type="button" className="atlas-wb-btn atlas-wb-btn--ghost" onClick={onExport}>Exportar JSON</button>
    <button type="button" className="atlas-wb-btn" onClick={onSave} disabled={!onSave}>Guardar borrador</button>
    <button type="button" className="atlas-wb-btn atlas-wb-btn--primary" onClick={onPublish} disabled={!onPublish}>Publicar</button>
  </div>
  if (!compact) return actions
  return <Popover label="Más acciones" trigger={<span aria-hidden="true">⋯</span>}>
    <label className="atlas-wb-field"><span className="atlas-wb-field__label">Vista del website</span><select className="atlas-wb-field__select" aria-label="Dispositivo" value={device} onChange={event => setDevice(event.target.value)}>
      <option value="desktop">Escritorio</option><option value="tablet">Tableta</option><option value="mobile">Teléfono</option>
    </select></label>
    <div className="atlas-wb-field"><span className="atlas-wb-field__label">Interfaz del editor</span><AppearanceSelect /></div>
    {actions}
  </Popover>
}
