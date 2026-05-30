export function NumberField({ value, onChange, label, spec }) {
  return (
    <label className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <input
        type="number"
        className="atlas-wb-field__input"
        value={value ?? ''}
        min={spec?.min}
        max={spec?.max}
        step={spec?.step || 1}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onChange(undefined)
          const n = Number(raw)
          if (Number.isFinite(n)) onChange(n)
        }}
      />
    </label>
  )
}
