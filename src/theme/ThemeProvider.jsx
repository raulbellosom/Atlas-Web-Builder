import { createContext, useContext, useMemo } from 'react'
import { defaultTheme } from './defaultTheme.js'
import { applyThemeVars } from './applyThemeVars.js'

/** @type {React.Context<import('../schema/theme.js').Theme>} */
const ThemeContext = createContext(defaultTheme)

/**
 * Provide a theme to descendants. Injects CSS custom properties on a wrapper
 * element so blocks can consume `var(--atlas-color-primary)` etc.
 *
 * @param {{
 *   theme?: import('../schema/theme.js').Theme,
 *   as?: keyof JSX.IntrinsicElements,
 *   className?: string,
 *   style?: React.CSSProperties,
 *   children: React.ReactNode,
 * }} props
 */
export function ThemeProvider({
  theme = defaultTheme,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}) {
  const cssVars = useMemo(() => applyThemeVars(theme?.tokens), [theme])
  const mergedStyle = useMemo(() => ({ ...cssVars, ...style }), [cssVars, style])
  return (
    <ThemeContext.Provider value={theme}>
      <Tag className={className} style={mergedStyle} data-atlas-theme={theme?.id || 'default'} {...rest}>
        {children}
      </Tag>
    </ThemeContext.Provider>
  )
}

/**
 * Read the current theme.
 *
 * @returns {import('../schema/theme.js').Theme}
 */
export function useTheme() {
  return useContext(ThemeContext)
}

/**
 * Convenience hook that returns the live theme tokens object.
 *
 * @returns {import('../schema/theme.js').ThemeTokens}
 */
export function useThemeTokens() {
  return useContext(ThemeContext).tokens
}
