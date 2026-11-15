/**
 * Phase-3 link field: only allows http(s), mailto:, tel: or internal paths.
 * Route picker arrives in Phase 8.
 */
function isSafeHref(value) {
  if (typeof value !== 'string') return false
  if (value === '') return true
  return value.length <= 2048 && /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) && !Array.from(value).some(c => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127)
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
          Enlace no permitido (usa https://, mailto:, tel:, /ruta o #ancla).
        </span>
      ) : null}
    </label>
  )
}
