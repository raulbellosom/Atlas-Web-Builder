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
            title={k}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                marginRight: 6,
                verticalAlign: 'middle',
                background: colorTokens[k],
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
