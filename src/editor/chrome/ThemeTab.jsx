import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { es } from '../i18n/es.js'

/**
 * Detect which control to render for a token value. Hex colors get a
 * `<input type="color">` companion; everything else falls back to text.
 */
function isHexColor(v) {
  return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)
}

function TokenRow({ category, name, value, onChange }) {
  const color = isHexColor(value)
  return (
    <div className="atlas-wb-theme__row">
      <label className="atlas-wb-theme__name">
        {category}.{name}
      </label>
      <input
        type="text"
        className="atlas-wb-field__input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
      {color ? (
        <input
          type="color"
          className="atlas-wb-theme__color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${category}.${name}`}
        />
      ) : null}
    </div>
  )
}

export function ThemeTab() {
  const theme = useEditorStore((s) => s.theme)
  const setThemeToken = useEditorStore((s) => s.setThemeToken)
  const resetTheme = useEditorStore((s) => s.resetTheme)
  const tokens = (theme && theme.tokens) || {}

  // Render flat categories only (skip nested non-string values like button/card).
  const categories = Object.entries(tokens).filter(
    ([, val]) =>
      val &&
      typeof val === 'object' &&
      Object.values(val).every((v) => typeof v === 'string' || typeof v === 'number'),
  )

  return (
    <div className="atlas-wb-theme">
      <div className="atlas-wb-theme__toolbar">
        <strong>{theme && theme.name ? theme.name : es.theme.untitled}</strong>
        <button type="button" className="atlas-wb-field__button" onClick={resetTheme}>
          {es.theme.reset}
        </button>
      </div>
      {categories.length === 0 ? (
        <p className="atlas-wb-empty">{es.theme.empty}</p>
      ) : (
        categories.map(([category, group]) => (
          <fieldset key={category} className="atlas-wb-theme__group">
            <legend>{es.theme.categories[category] || category}</legend>
            {Object.entries(group).map(([k, v]) => (
              <TokenRow
                key={k}
                category={category}
                name={k}
                value={v}
                onChange={(next) => setThemeToken(category, k, next)}
              />
            ))}
          </fieldset>
        ))
      )}
    </div>
  )
}
