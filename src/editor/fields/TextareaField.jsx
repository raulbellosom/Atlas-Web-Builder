export function TextareaField({ value, onChange, label, spec }) {
  return (
    <label className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <textarea
        className="atlas-wb-field__textarea"
        value={value ?? ''}
        rows={spec?.rows || 4}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
