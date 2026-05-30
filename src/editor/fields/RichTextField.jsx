/**
 * Phase-3 rich text field: a controlled textarea that authors HTML directly.
 * The renderer sanitizes via SafeRichText, so unsafe input cannot escape into
 * the page. A WYSIWYG editor with a toolbar is deferred to Phase 11.
 */
export function RichTextField({ value, onChange, label }) {
  return (
    <label className="atlas-wb-field">
      <span className="atlas-wb-field__label">
        {label} <span style={{ color: 'var(--awb-muted)', fontWeight: 400 }}>(HTML)</span>
      </span>
      <textarea
        className="atlas-wb-field__textarea"
        value={value ?? ''}
        rows={6}
        spellCheck="false"
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
