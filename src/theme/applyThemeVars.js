/**
 * @file Convert a Theme tokens object into a flat map of CSS custom properties.
 * The CSS variable namespace is `--atlas-*` to avoid collisions with the host.
 */
import { fluidToken } from '../blocks/elements/fluidType.js'

/**
 * @param {import('../schema/theme.js').ThemeTokens} tokens
 * @returns {Object<string, string>}
 */
export function applyThemeVars(tokens) {
  /** @type {Object<string,string>} */
  const out = {}
  if (!tokens || typeof tokens !== 'object') return out

  // `fluid: { enabled, minViewport, maxViewport }` turns the large font-size tokens into viewport-scaled sizes (see fluidType.js).
  const fluid = tokens.fluid && tokens.fluid.enabled === true ? tokens.fluid : null
  for (const [group, group_value] of Object.entries(tokens)) {
    if (!group_value || typeof group_value !== 'object' || group === 'fluid') continue
    for (const [key, value] of Object.entries(group_value)) {
      if (value == null) continue
      out[`--atlas-${group}-${key}`] = group === 'fontSize' && fluid ? fluidToken(value, fluid) : String(value)
    }
  }
  return out
}
