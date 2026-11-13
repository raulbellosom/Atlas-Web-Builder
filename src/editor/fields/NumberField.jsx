import { NumberInput } from '../ui/NumericControls.jsx'

export function NumberField({ value, onChange, label, spec }) {
  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <NumberInput value={value} onChange={onChange} label={label} min={spec?.min} max={spec?.max} step={spec?.step ?? 1} />
    </div>
  )
}
