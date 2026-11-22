import { devices, responsiveKey, resolveResponsive } from '../../blocks/elements/responsive.js'
import { UniversalEffects } from './UniversalEffects.jsx'
import { useId, useState } from 'react'
import clsx from 'clsx'
import { ChevronRight, MousePointerClick } from 'lucide-react'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { PropertyField as FieldRow } from './PropertyField.jsx'
import { partitionGroups } from './propertyGroups.js'
import { BlockIcon } from './BlockIcon.jsx'
import { es } from '../i18n/es.js'
import {ResponsiveGeometry} from './ResponsiveGeometry.jsx'
import {geometryKeys,geometryKey} from '../../blocks/elements/geometry.js'

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
        <ChevronRight
          aria-hidden="true"
          className={clsx(
            'atlas-wb-props__section-chevron',
            open && 'atlas-wb-props__section-chevron--open',
          )}
        />
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
  const resetBlockProps = useEditorStore(s=>s.resetBlockProps)
  const device=useEditorStore(s=>s.device),setDevice=useEditorStore(s=>s.setDevice)

  if (!selectedId) {
    return (
      <div className="atlas-wb-props__empty">
        <MousePointerClick aria-hidden="true" className="atlas-wb-props__empty-icon" />
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
  const responsive=def.kind==='element'&&!!fields.mobilePosition
  const geometryFields=new Set(responsive?['desktop','tablet','mobile'].flatMap(device=>geometryKeys.map(key=>geometryKey(key,device))):[])
  const entries = Object.entries(allFields).filter(([key])=>!geometryFields.has(key)&&!allFields[key].responsiveBase)


  const sections = partitionGroups(entries, def.groups)
  const resolved=resolveResponsive(merged,device)
  const inherited=resolveResponsive(merged,device==='mobile'?'tablet':'desktop')
  const responsiveKeys=Object.keys(allFields).filter(key=>allFields[key].responsive&&!geometryFields.has(key))
  const fieldRow=(propName,spec)=>{
    const active=spec.responsive?responsiveKey(propName,device):propName
    const isResponsive=spec.responsive&&device!=='desktop'&&allFields[active]
    return <FieldRow key={active} propName={active} spec={spec}
      value={isResponsive?resolved[propName]:merged[propName]}
      defaultValue={isResponsive?inherited[propName]:def.defaultProps?.[propName]}
      hasValue={Object.hasOwn(block.props||{},active)}
      onChange={next=>updateBlockProps(selectedId,{[active]:next})}
      onReset={isResponsive?()=>resetBlockProps(selectedId,[active]):undefined}/>
  }



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

      {responsiveKeys.length>0&&<div className="atlas-wb-responsive-controls">
        <div role="group" aria-label="Pantalla de propiedades">
          {devices.map(value=><button key={value} type="button" className="atlas-wb-btn atlas-wb-btn--secondary" aria-pressed={device===value} onClick={()=>setDevice(value)}>{value==='desktop'?'Escritorio':value==='tablet'?'Tableta':'Teléfono'}</button>)}
        </div>
        <p className="atlas-wb-field__hint">Los campos con ◇ admiten ajustes por pantalla. Restablecer recupera la herencia.</p>
        {device!=='desktop'&&<button type="button" className="atlas-wb-btn atlas-wb-btn--secondary" onClick={()=>updateBlockProps(selectedId,Object.fromEntries(responsiveKeys.filter(key=>inherited[key]!==undefined).map(key=>[responsiveKey(key,device),inherited[key]])))}>Copiar estilos de {device==='mobile'?'tableta':'escritorio'}</button>}
      </div>}

      {responsive&&<CollapseSection label="Posición y tamaño por pantalla" defaultOpen={false}><ResponsiveGeometry block={block} definition={def}/></CollapseSection>}

      {/* Field sections */}
      {sections.map((section, i) =>
        section.label ? (
          <CollapseSection key={section.label} label={section.label} defaultOpen={i === 0}>
            {section.entries.map(([propName,spec])=>fieldRow(propName,spec))}
          </CollapseSection>
        ) : (
          <div key={i} className="atlas-wb-props__ungrouped">
            {section.entries.map(([propName,spec])=>fieldRow(propName,spec))}
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
