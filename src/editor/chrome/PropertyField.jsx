import { defaultFields } from '../fields/index.js'
import { RotateCcw } from 'lucide-react'

export function PropertyField({ propName, spec, value, onChange, defaultValue, hasValue, onReset }) {
  const Field = defaultFields[spec.type], label = `${spec.responsive?'◇ ':''}${spec.label || propName}`
  const readOnly = !!spec.readOnly || !Field
  const hasDefault = defaultValue !== undefined
  const modified = hasValue && JSON.stringify(value) !== JSON.stringify(defaultValue)
  const state = readOnly ? 'Sólo lectura' : modified ? 'Modificado' : hasValue ? 'Predeterminado' : 'Heredado · predeterminado'
  return <div className="atlas-wb-property" data-property={propName} data-value-state={readOnly ? 'readonly' : modified ? 'modified' : hasValue ? 'default' : 'inherited'}>
    {!Field ? <p className="atlas-wb-field__hint">{label}: control no registrado ({spec.type}). El valor se conserva.</p> : <fieldset disabled={readOnly}>
      <Field value={value} onChange={next => { if (!spec.readOnly) onChange(next) }} label={label} spec={spec} />
    </fieldset>}
    <div className="atlas-wb-property__meta"><span>{state}</span>
      {(onReset ? hasValue : modified && hasDefault) && !readOnly && spec.resettable !== false && !(spec.type === 'image' && spec.withAssetMeta) && <button type="button" onClick={() => onReset ? onReset() : onChange(structuredClone(defaultValue))} aria-label={`Restablecer ${label}`} title={`Restablecer ${label}`}><RotateCcw /></button>}
    </div>
    {spec.readOnly && <p className="atlas-wb-field__hint" role="note">Sólo lectura: el contrato no permite editar este campo. Su valor se conserva.</p>}
    {spec.description && <p className="atlas-wb-field__hint">{spec.description}</p>}
  </div>
}
