import { createContext, useContext } from 'react'

// This versions the editor API, independently of Page schema and npm version.
export const editorCapabilitiesVersion = 1
export const EditorCapabilitiesContext = createContext({})
export const useEditorCapabilities = () => useContext(EditorCapabilitiesContext)

export function assertEditorCapabilities(capabilities) {
  if (capabilities && capabilities.schemaVersion !== editorCapabilitiesVersion) {
    throw new TypeError('Unsupported editor capabilities schemaVersion')
  }
}

export function CapabilityBoundary({ name, children }) {
  const capabilities = useEditorCapabilities()
  const disabled = capabilities[name] === false
  return (
    <fieldset disabled={disabled} data-atlas-capability={name}
      style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      {disabled && <p role="note">Sólo lectura: {capabilities.reason || 'el contrato de guardado no admite este ajuste'}. Los valores existentes se conservan.</p>}
      {children}
    </fieldset>
  )
}
