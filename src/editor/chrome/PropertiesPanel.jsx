import { UniversalEffects } from './UniversalEffects.jsx'
import { useId, useState } from 'react'
import clsx from 'clsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { PropertyField as FieldRow } from './PropertyField.jsx'
import { partitionGroups } from './propertyGroups.js'
import { BlockIcon } from './BlockIcon.jsx'
import { es } from '../i18n/es.js'

function CollapseSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="atlas-wb-props__section">
      <button
        type="button"
        className="atlas-wb-props__section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
      >
        <span className="atlas-wb-props__section-label">{label}</span>
        <span
          className={clsx(
            'atlas-wb-props__section-chevron',
            open && 'atlas-wb-props__section-chevron--open',
          )}
        >
          ›
        </span>
      </button>
      {open ? <div id={id} className="atlas-wb-props__section-body">{children}</div> : null}
    </div>
  )
}

export function PropertiesPanel() {
  const { blocks: registry } = useBuilder()
  const selectedId = useEditorStore((s) => s.selectedId)
  const page = useEditorStore((s) => s.page)
  const updateBlockProps = useEditorStore((s) => s.updateBlockProps)

  if (!selectedId) {
    return (
      <div className="atlas-wb-props__empty">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity=".3">
          <rect x="4" y="4" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2" />
          <rect x="10" y="14" width="20" height="2" rx="1" fill="currentColor" />
          <rect x="10" y="19" width="14" height="2" rx="1" fill="currentColor" />
          <rect x="10" y="24" width="17" height="2" rx="1" fill="currentColor" />
        </svg>
        <p>{es.rightPanel.noSelection}</p>
      </div>
    )
  }

  const block = page.blocks[selectedId]
  if (!block) return <p className="atlas-wb-empty">Bloque no encontrado.</p>

  const def = registry.get(block.type)
  if (!def) return <p className="atlas-wb-empty">Tipo no registrado: {block.type}</p>

  const fields = def.fields || {}
  const merged = { ...(def.defaultProps || {}), ...(block.props || {}) }

  const variantField =
    !fields.variant && Array.isArray(def.variants) && def.variants.length
      ? { variant: { type: 'select', label: 'Variante', options: def.variants } }
      : {}

  const allFields = { ...variantField, ...fields }
  const entries = Object.entries(allFields)


  const sections = partitionGroups(entries, def.groups)
  const onChange = (propName) => (next) => updateBlockProps(selectedId, { [propName]: next })



  return (
    <div className="atlas-wb-props">
      {/* Block header */}
      <div className="atlas-wb-props__header">
        <span className="atlas-wb-props__header-icon">
          <BlockIcon def={def} size={18} />
        </span>
        <span className="atlas-wb-props__header-label">{def.label || def.type}</span>
        <span className="atlas-wb-props__header-type">{def.type}</span>
      </div>

      {/* Field sections */}
      {sections.map((section, i) =>
        section.label ? (
          <CollapseSection key={section.label} label={section.label} defaultOpen={i === 0}>
            {section.entries.map(([propName, spec]) => (
              <FieldRow
                key={propName}
                propName={propName}
                spec={spec}
                value={merged[propName]}
                defaultValue={def.defaultProps?.[propName]}
                hasValue={Object.prototype.hasOwnProperty.call(block.props || {}, propName)}
                onChange={onChange(propName)}
              />
            ))}
          </CollapseSection>
        ) : (
          <div key={i} className="atlas-wb-props__ungrouped">
            {section.entries.map(([propName, spec]) => (
              <FieldRow
                key={propName}
                propName={propName}
                spec={spec}
                value={merged[propName]}
                defaultValue={def.defaultProps?.[propName]}
                hasValue={Object.prototype.hasOwnProperty.call(block.props || {}, propName)}
                onChange={onChange(propName)}
              />
            ))}
          </div>
        ),
      )}

      {Object.keys(block.props || {}).some(key => !(key in allFields) && !key.startsWith('_')) && <CollapseSection label="Avanzado" defaultOpen={false}>
        <p className="atlas-wb-field__hint">Datos adicionales de sólo lectura. Se conservan al guardar.</p>
        <pre className="atlas-wb-property__raw">{JSON.stringify(Object.fromEntries(Object.entries(block.props || {}).filter(([key]) => !(key in allFields) && !key.startsWith('_'))), null, 2)}</pre>
      </CollapseSection>}

      {/* ── Universal effects ── */}
      <div className="atlas-wb-props__effects">
        <CollapseSection label="Efectos" defaultOpen={false}>
          <UniversalEffects merged={merged} def={def} selectedId={selectedId} />
        </CollapseSection>
      </div>
    </div>
  )
}
