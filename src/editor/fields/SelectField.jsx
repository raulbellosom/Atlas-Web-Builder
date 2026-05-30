export function SelectField({ value, onChange, label, spec }) {
  const options = Array.isArray(spec?.options) ? spec.options : []
  return (
    <label className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <select
        className="atlas-wb-field__select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {spec?.allowEmpty ? <option value="">—</option> : null}
        {options.map((opt) => {
          const optValue = typeof opt === 'object' ? opt.value : opt
          const optLabel = typeof opt === 'object' ? opt.label : String(opt)
          return (
            <option key={String(optValue)} value={optValue}>
              {optLabel}
            </option>
          )
        })}
      </select>
    </label>
  )
}
