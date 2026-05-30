/**
 * @file Default theme tokens. All values are serializable strings so themes
 * can be persisted and edited safely.
 *
 * @type {import('../schema/theme.js').Theme}
 */
export const defaultTheme = {
  id: 'theme_default',
  name: 'Predeterminado',
  tokens: {
    color: {
      primary: '#0F62FE',
      primaryFg: '#FFFFFF',
      bg: '#FFFFFF',
      fg: '#0B0B0F',
      muted: '#6B7280',
      accent: '#F59E0B',
      danger: '#DC2626',
    },
    font: {
      sans: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: 'JetBrains Mono, Menlo, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.5rem',
      '2xl': '2rem',
      '3xl': '3rem',
    },
    radius: { sm: '4px', md: '8px', lg: '16px', pill: '999px' },
    spacing: {
      0: '0',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
      16: '64px',
    },
    shadow: {
      sm: '0 1px 2px rgba(0,0,0,0.06)',
      md: '0 4px 12px rgba(0,0,0,0.08)',
      lg: '0 12px 32px rgba(0,0,0,0.12)',
    },
    button: { style: 'solid', radius: 'md' },
    card: { radius: 'lg', shadow: 'md', padding: '6' },
  },
}

/**
 * Identity helper for defining custom themes with autocomplete.
 *
 * @param {import('../schema/theme.js').Theme} theme
 * @returns {import('../schema/theme.js').Theme}
 */
export function defineTheme(theme) {
  if (!theme || typeof theme !== 'object' || !theme.tokens) {
    throw new TypeError('defineTheme: expected a theme object with "tokens"')
  }
  return theme
}
