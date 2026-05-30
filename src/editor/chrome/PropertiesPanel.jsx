import { useState } from 'react'
import clsx from 'clsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { defaultFields } from '../fields/index.js'
import { BlockIcon } from './BlockIcon.jsx'
import { es } from '../i18n/es.js'

function FieldRow({ propName, spec, value, onChange }) {
  const Field = defaultFields[spec.type]
  if (!Field) {
    return (
      <div className="atlas-wb-field">
        <span className="atlas-wb-field__label">{spec.label || propName}</span>
        <span className="atlas-wb-empty">Tipo desconocido: {spec.type}</span>
      </div>
    )
  }
  return <Field value={value} onChange={onChange} label={spec.label || propName} spec={spec} />
}

/**
 * Partition `allFields` entries into named sections based on `def.groups`.
 *
 * `def.groups` shape (optional):
 *   [ { label: 'Contenido', fields: ['title', 'description', 'ctaLabel'] },
 *     { label: 'Estilo',    fields: ['radius', 'shadow', 'background']   } ]
 *
 * Fields not listed in any group fall into an implicit "Otros" section at the end.
 */
function partitionGroups(entries, groups) {
  if (!Array.isArray(groups) || !groups.length) {
    return [{ label: null, entries }]
  }
  const listed = new Set(groups.flatMap((g) => g.fields || []))
  const sections = groups.map((g) => ({
    label: g.label,
    entries: (g.fields || [])
      .map((name) => entries.find(([k]) => k === name))
      .filter(Boolean),
  }))
  const rest = entries.filter(([k]) => !listed.has(k))
  if (rest.length) sections.push({ label: 'Otros', entries: rest })
  return sections.filter((s) => s.entries.length)
}

function CollapseSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="atlas-wb-props__section">
      <button
        type="button"
        className="atlas-wb-props__section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="atlas-wb-props__section-label">{label}</span>
        <span className={clsx('atlas-wb-props__section-chevron', open && 'atlas-wb-props__section-chevron--open')}>
          ›
        </span>
      </button>
      {open ? <div className="atlas-wb-props__section-body">{children}</div> : null}
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

  if (!entries.length) {
    return <p className="atlas-wb-empty">Este bloque no expone propiedades editables.</p>
  }

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
                onChange={onChange(propName)}
              />
            ))}
          </div>
        ),
      )}
    </div>
  )
}
