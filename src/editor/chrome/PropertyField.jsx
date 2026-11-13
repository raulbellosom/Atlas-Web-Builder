import { defaultFields } from '../fields/index.js'

export function PropertyField({ propName, spec, value, onChange, defaultValue, hasValue }) {
  const Field = defaultFields[spec.type], label = spec.label || propName
  const readOnly = !!spec.readOnly || !Field
  const hasDefault = defaultValue !== undefined
  const modified = hasValue && JSON.stringify(value) !== JSON.stringify(defaultValue)
  const state = readOnly ? 'Sólo lectura' : modified ? 'Modificado' : hasValue ? 'Predeterminado' : 'Heredado · predeterminado'
  return <div className="atlas-wb-property" data-property={propName} data-value-state={readOnly ? 'readonly' : modified ? 'modified' : hasValue ? 'default' : 'inherited'}>
    <div className="atlas-wb-property__meta"><span>{state}</span>
      {modified && hasDefault && !readOnly && spec.resettable !== false && !(spec.type === 'image' && spec.withAssetMeta) && <button type="button" onClick={() => onChange(structuredClone(defaultValue))} aria-label={`Restablecer ${label}`} title={`Restablecer ${label}`}>↺</button>}
    </div>
    {!Field ? <p className="atlas-wb-field__hint">{label}: control no registrado ({spec.type}). El valor se conserva.</p> : <fieldset disabled={readOnly}>
      <Field value={value} onChange={next => { if (!spec.readOnly) onChange(next) }} label={label} spec={spec} />
    </fieldset>}
    {spec.readOnly && <p className="atlas-wb-field__hint" role="note">Sólo lectura: el contrato no permite editar este campo. Su valor se conserva.</p>}
    {spec.description && <p className="atlas-wb-field__hint">{spec.description}</p>}
  </div>
}
