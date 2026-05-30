import { useThemeTokens } from '../../theme/ThemeProvider.jsx'
import clsx from 'clsx'

/**
 * Picks a spacing stop from the theme's spacing scale ('0','1','2','3'...).
 * Stores the stop key so the page remains portable across themes.
 */
export function SpacingField({ value, onChange, label }) {
  const tokens = useThemeTokens()
  const spacing = (tokens && tokens.spacing) || {}
  const keys = Object.keys(spacing)
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
            title={`${k} (${spacing[k]})`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
