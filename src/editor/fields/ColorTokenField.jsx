import { useThemeTokens } from '../../theme/ThemeProvider.jsx'
import clsx from 'clsx'

/**
 * Picks a color token by name from the active theme. Stores the *token key*
 * (e.g. 'primary') not the raw color, so the page stays portable across themes.
 */
export function ColorTokenField({ value, onChange, label }) {
  const tokens = useThemeTokens()
  const colorTokens = (tokens && tokens.color) || {}
  const keys = Object.keys(colorTokens)
  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <div className="atlas-wb-field__token-options">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            className={clsx(
              'atlas-wb-field__token',
              value === k && 'atlas-wb-field__token--active',
            )}
            onClick={() => onChange(k)}
            aria-pressed={value === k}
            title={k}
          >
            <span
              aria-hidden="true"
              className="atlas-wb-field__token-swatch"
              style={{ background: colorTokens[k] }}
            />
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
