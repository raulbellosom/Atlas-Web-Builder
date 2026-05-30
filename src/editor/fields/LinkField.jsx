/**
 * Phase-3 link field: only allows http(s), mailto:, tel: or internal paths.
 * Route picker arrives in Phase 8.
 */
function isSafeHref(value) {
  if (typeof value !== 'string') return false
  if (value === '') return true
  return /^(https?:|mailto:|tel:|\/)/i.test(value)
}

export function LinkField({ value, onChange, label, spec }) {
  const safe = isSafeHref(value)
  return (
    <label className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <input
        type="text"
        className="atlas-wb-field__input"
        value={value ?? ''}
        placeholder={spec?.placeholder || 'https://... o /ruta'}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!safe}
      />
      {!safe ? (
        <span style={{ color: 'var(--awb-danger)', fontSize: 11 }}>
          Enlace no permitido (usa https://, mailto:, tel: o /ruta).
        </span>
      ) : null}
    </label>
  )
}
