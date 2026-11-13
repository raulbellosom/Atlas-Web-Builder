import { SegmentedControl, Combobox } from '../ui/ChoiceControls.jsx'
import { useThemeTokens } from '../../theme/ThemeProvider.jsx'

export function SelectField({ value, onChange, label, spec }) {
  const options = Array.isArray(spec?.options) ? spec.options : []
  const tokens = useThemeTokens()
  const selectedColor = /color/i.test(label) ? tokens?.color?.[value] : undefined
  const alignment = options.length > 0 && options.every(item => ['left', 'center', 'right', 'justify'].includes(typeof item === 'object' ? item.value : item))
  if (alignment || spec?.control === 'segmented') return <div className="atlas-wb-field"><span className="atlas-wb-field__label">{label}</span><SegmentedControl label={label} value={value} onChange={onChange} options={options} /></div>
  if (spec?.searchable) return <div className="atlas-wb-field"><span className="atlas-wb-field__label">{label}</span><Combobox label={label} value={value} onChange={onChange} options={options} /></div>
  return (
    <label className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <span className="atlas-wb-select-wrap">
      {selectedColor && <span aria-hidden="true" className="atlas-wb-select-swatch" style={{ background: selectedColor }} />}
      <select
        aria-label={label}
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
      </span>
    </label>
  )
}
