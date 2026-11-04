/**
 * @file Brand helpers: derive a full theme from a few inputs, with a WCAG
 * contrast guard, plus font presets and Google Fonts link builder.
 */
import { defaultTheme } from './defaultTheme.js'

function parseHex(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
const toHex = (rgb) =>
  '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase()

/** Mix color a toward b by t (0..1). */
export function mixColors(a, b, t) {
  const A = parseHex(a), B = parseHex(b)
  if (!A || !B) return a
  return toHex(A.map((v, i) => v + (B[i] - v) * t))
}

/** WCAG relative luminance of a hex color. */
export function luminance(hex) {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio (1..21) between two hex colors. */
export function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Black or white, whichever reads better on `bg`. */
export function readableOn(bg, light = '#FFFFFF', dark = '#0B0B0F') {
  return contrastRatio(bg, light) >= contrastRatio(bg, dark) ? light : dark
}

/**
 * Nudge `fg` toward black/white until it reaches `min` contrast on `bg`.
 * @returns {string}
 */
export function ensureContrast(fg, bg, min = 4.5) {
  if (!parseHex(fg) || contrastRatio(fg, bg) >= min) return fg
  const target = luminance(bg) > 0.5 ? '#000000' : '#FFFFFF'
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const c = mixColors(fg, target, t)
    if (contrastRatio(c, bg) >= min) return c
  }
  return target
}

export const FONT_PAIRS = [
  { id: 'modern',    label: 'Moderno',    heading: 'Inter',            body: 'Inter' },
  { id: 'editorial', label: 'Editorial',  heading: 'Playfair Display', body: 'Source Sans 3' },
  { id: 'friendly',  label: 'Amigable',   heading: 'Poppins',          body: 'Nunito' },
  { id: 'technical', label: 'Técnico',    heading: 'Space Grotesk',    body: 'IBM Plex Sans' },
  { id: 'classic',   label: 'Clásico',    heading: 'Merriweather',     body: 'Open Sans' },
]

export const BRAND_MOODS = {
  sharp:    { radius: { sm: '0px', md: '2px', lg: '4px' },  shadowAlpha: 0.06 },
  balanced: { radius: { sm: '4px', md: '8px', lg: '16px' }, shadowAlpha: 0.08 },
  soft:     { radius: { sm: '8px', md: '14px', lg: '28px' }, shadowAlpha: 0.1 },
}

const stack = (name, fallback) => (name ? `"${name}", ${fallback}` : fallback)
const SANS_FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/**
 * Derive a full theme from a few brand inputs. Foreground colors are chosen
 * by contrast and `muted` is guaranteed >= 4.5:1 on the background.
 *
 * @param {{primary?:string, accent?:string, neutral?:string, fontHeading?:string,
 *   fontBody?:string, radius?:'sm'|'md'|'lg', mood?:'sharp'|'balanced'|'soft', name?:string}} [input]
 * @returns {import('../schema/theme.js').Theme}
 */
export function createBrandTheme(input = {}) {
  const { primary = '#0F62FE', accent, neutral = '#6B7280', fontHeading, fontBody, mood = 'balanced', name } = input
  const base = defaultTheme.tokens
  const m = BRAND_MOODS[mood] || BRAND_MOODS.balanced
  const bg = '#FFFFFF'
  const acc = accent || mixColors(primary, '#F59E0B', 0.7)
  const fg = mixColors(neutral, '#000000', 0.85)
  const a = m.shadowAlpha
  return {
    id: 'theme_brand',
    name: name || 'Marca',
    tokens: {
      ...base,
      color: {
        ...base.color,
        primary,
        primaryFg: readableOn(primary),
        primaryTint: mixColors(primary, bg, 0.88),
        primaryDark: mixColors(primary, '#000000', 0.2),
        accent: acc,
        accentFg: readableOn(acc),
        bg,
        fg,
        surface: mixColors(neutral, bg, 0.94),
        border: mixColors(neutral, bg, 0.8),
        muted: ensureContrast(neutral, bg, 4.5),
      },
      font: {
        ...base.font,
        sans: stack(fontBody, base.font.sans),
        heading: stack(fontHeading || fontBody, SANS_FALLBACK),
      },
      radius: { ...base.radius, ...m.radius, ...(input.radius ? { md: m.radius[input.radius] } : null) },
      shadow: {
        sm: `0 1px 2px rgba(0,0,0,${a})`,
        md: `0 4px 12px rgba(0,0,0,${a + 0.02})`,
        lg: `0 12px 32px rgba(0,0,0,${a + 0.06})`,
      },
    },
  }
}

/** Families used by a theme, read from its font tokens (first quoted/leading name). */
function families(theme) {
  const out = new Set()
  for (const v of Object.values(theme?.tokens?.font || {})) {
    const first = String(v).split(',')[0].trim().replace(/^["']|["']$/g, '')
    if (first && !/^(system-ui|-apple-system|Georgia|JetBrains Mono|serif|sans-serif|monospace)$/i.test(first)) out.add(first)
  }
  return [...out]
}

/**
 * Google Fonts stylesheet href for the theme's chosen families (null if none).
 * The host decides whether to load it.
 *
 * @param {import('../schema/theme.js').Theme} theme
 * @param {{weights?: number[]}} [opts]
 * @returns {string|null}
 */
export function fontLinks(theme, { weights = [400, 500, 600, 700] } = {}) {
  const fams = families(theme)
  if (!fams.length) return null
  const q = fams.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@${weights.join(';')}`)
  return `https://fonts.googleapis.com/css2?${q.join('&')}&display=swap`
}
