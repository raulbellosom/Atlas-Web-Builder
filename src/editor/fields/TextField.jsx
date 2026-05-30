export function TextField({ value, onChange, label, spec }) {
  return (
    <label className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <input
        type="text"
        className="atlas-wb-field__input"
        value={value ?? ''}
        placeholder={spec?.placeholder || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
