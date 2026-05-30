/**
 * @file Convert a Theme tokens object into a flat map of CSS custom properties.
 * The CSS variable namespace is `--atlas-*` to avoid collisions with the host.
 */

/**
 * @param {import('../schema/theme.js').ThemeTokens} tokens
 * @returns {Object<string, string>}
 */
export function applyThemeVars(tokens) {
  /** @type {Object<string,string>} */
  const out = {}
  if (!tokens || typeof tokens !== 'object') return out

  for (const [group, group_value] of Object.entries(tokens)) {
    if (!group_value || typeof group_value !== 'object') continue
    for (const [key, value] of Object.entries(group_value)) {
      if (value == null) continue
      out[`--atlas-${group}-${key}`] = String(value)
    }
  }
  return out
}
