// Fluid typography: one font size that scales continuously between a minimum and a maximum across a page-width range.
// Widths are measured against the Atlas page container (`--atlas-page-cqw`, 1cqw of [data-atlas-page]), not the browser window,
// so the editor device frame and a published page agree. Per-device sizes (tablet/mobile) always win over fluid sizing.

export const FLUID_LIMITS = Object.freeze({ size: [8, 200], minViewport: [280, 1024], maxViewport: [600, 2560] })
export const FLUID_DEFAULTS = Object.freeze({ minViewport: 360, maxViewport: 1280 })

const within = (value, [min, max]) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
const round = (n) => Math.round(n * 10000) / 10000

/**
 * @param {{ fluidType?: boolean, fontSizeMin?: number, fontSizeMax?: number, fluidMinViewport?: number, fluidMaxViewport?: number }} props
 * @returns {{ value?: string, error?: string }} `{}` when fluid sizing is off; `{ error }` when the configuration is invalid
 */
export function fluidFontSize(props) {
  if (!props || props.fluidType !== true) return {}
  const min = props.fontSizeMin, max = props.fontSizeMax
  const vmin = props.fluidMinViewport ?? FLUID_DEFAULTS.minViewport, vmax = props.fluidMaxViewport ?? FLUID_DEFAULTS.maxViewport
  if (!within(min, FLUID_LIMITS.size) || !within(max, FLUID_LIMITS.size) || !within(vmin, FLUID_LIMITS.minViewport) || !within(vmax, FLUID_LIMITS.maxViewport)) return { error: 'fluid_invalid' }
  if (min > max || vmin >= vmax) return { error: 'fluid_invalid' }
  if (min === max) return { value: `${min}px` }
  const slope = (max - min) / (vmax - vmin) // px of font size per px of page width
  const intercept = min - slope * vmin
  return { value: `clamp(${min}px, calc(${round(intercept)}px + ${round(slope * 100)} * var(--atlas-page-cqw, 1vw)), ${max}px)` }
}

/** Same math for a theme size token such as "3rem": keeps the token as the maximum and scales down to `ratio` of it. */
export function fluidToken(value, { minViewport = FLUID_DEFAULTS.minViewport, maxViewport = FLUID_DEFAULTS.maxViewport, ratio = 0.7 } = {}) {
  const match = /^(\d*\.?\d+)(rem|px)$/.exec(String(value).trim())
  if (!match) return String(value)
  const max = Number(match[1]) * (match[2] === 'rem' ? 16 : 1)
  if (max < 24) return String(value) // body-sized text never shrinks
  const min = Math.max(16, Math.round(max * ratio))
  const props = { fluidType: true, fontSizeMin: min, fontSizeMax: Math.round(max), fluidMinViewport: minViewport, fluidMaxViewport: maxViewport }
  return fluidFontSize(props).value ?? String(value)
}

/** Whether `device` already has an explicit font size (its own or inherited from a smaller device). */
export function hasDeviceFontSize(props, device) {
  const explicit = (key, flag) => props[key] !== undefined && props[key] !== 'inherit' && props[flag] !== true
  const tablet = explicit('tabletFontSize', 'tabletFontSizeInherit'), mobile = explicit('mobileFontSize', 'mobileFontSizeInherit')
  if (device === 'tablet') return tablet
  if (device === 'mobile') return tablet || mobile
  return false
}

export const fluidFields = {
  fluidType: { type: 'toggle', label: 'Tamaño fluido (se adapta al ancho)' },
  fontSizeMin: { type: 'number', label: 'Tamaño mínimo (px)', min: FLUID_LIMITS.size[0], max: FLUID_LIMITS.size[1] },
  fontSizeMax: { type: 'number', label: 'Tamaño máximo (px)', min: FLUID_LIMITS.size[0], max: FLUID_LIMITS.size[1] },
  fluidMinViewport: { type: 'number', label: 'Ancho donde empieza (px)', min: FLUID_LIMITS.minViewport[0], max: FLUID_LIMITS.minViewport[1] },
  fluidMaxViewport: { type: 'number', label: 'Ancho donde termina (px)', min: FLUID_LIMITS.maxViewport[0], max: FLUID_LIMITS.maxViewport[1] },
}
