import { FileDown, FileUp, Monitor, MonitorSmartphone, Moon, MoreHorizontal, Save, Send, Smartphone, Sun, Tablet } from 'lucide-react'
import { useEditorAppearance } from '../ui/EditorAppearance.jsx'
import { ActionMenu, MenuItem, MenuRadioGroup, MenuSeparator } from '../ui/Menu.jsx'
import { es } from '../i18n/es.js'

const APPEARANCES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: MonitorSmartphone },
]
const DEVICE_OPTIONS = [
  { value: 'desktop', label: 'Escritorio', icon: Monitor },
  { value: 'tablet', label: 'Tableta', icon: Tablet },
  { value: 'mobile', label: 'Teléfono', icon: Smartphone },
]
const appearanceIcon = mode => APPEARANCES.find(item => item.value === mode)?.icon ?? MonitorSmartphone

function AppearanceItems() {
  const appearance = useEditorAppearance()
  if (!appearance) return null
  return <MenuRadioGroup label="Interfaz del editor" value={appearance.appearance} onValueChange={appearance.setAppearance} options={APPEARANCES} />
}

/** Editor UI appearance (light/dark/system). It never changes Page, Theme or history. */
export function AppearanceSelect() {
  const appearance = useEditorAppearance()
  if (!appearance) return null
  const Icon = appearanceIcon(appearance.appearance)
  return <ActionMenu label="Apariencia del editor" trigger={<button type="button" className="atlas-wb-icon-btn atlas-wb-icon-btn--ghost" aria-label="Apariencia del editor"><Icon /></button>}>
    <AppearanceItems />
  </ActionMenu>
}

export function ToolbarCommands({ compact, device, setDevice, onImport, onExport, onSave, onPublish, allowImport }) {
  const moreTrigger = <button type="button" className="atlas-wb-icon-btn atlas-wb-icon-btn--ghost" aria-label="Más acciones"><MoreHorizontal /></button>
  const fileItems = <>
    <MenuItem icon={FileUp} onSelect={onImport} disabled={!allowImport}>Importar JSON</MenuItem>
    <MenuItem icon={FileDown} onSelect={onExport}>Exportar JSON</MenuItem>
  </>
  if (!compact) return <div className="atlas-wb-toolbar-commands">
    <ActionMenu label="Más acciones" trigger={moreTrigger}>{fileItems}</ActionMenu>
    <button type="button" className="atlas-wb-btn atlas-wb-btn--secondary" onClick={onSave} disabled={!onSave}><Save /><span className="atlas-wb-topbar__btn-text">{es.topbar.saveDraft}</span></button>
    <button type="button" className="atlas-wb-btn atlas-wb-btn--primary" onClick={onPublish} disabled={!onPublish}><Send /><span className="atlas-wb-topbar__btn-text">{es.topbar.publish}</span></button>
  </div>
  return <ActionMenu label="Más acciones" trigger={moreTrigger}>
    <MenuRadioGroup label="Vista del website" value={device} onValueChange={setDevice} options={DEVICE_OPTIONS} />
    <MenuSeparator />
    <AppearanceItems />
    <MenuSeparator />
    {fileItems}
    <MenuSeparator />
    <MenuItem icon={Save} onSelect={onSave} disabled={!onSave}>{es.topbar.saveDraft}</MenuItem>
    <MenuItem icon={Send} tone="accent" onSelect={onPublish} disabled={!onPublish}>{es.topbar.publish}</MenuItem>
  </ActionMenu>
}
