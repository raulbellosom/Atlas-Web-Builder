import { useId } from 'react'

export function ToggleField({ value, onChange, label }) {
  const id = useId()
  return (
    <div className="atlas-wb-field">
      <div className="atlas-wb-field__row">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label htmlFor={id} className="atlas-wb-field__label" style={{ marginBottom: 0 }}>
          {label}
        </label>
      </div>
    </div>
  )
}
