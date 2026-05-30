/**
 * @file Shared style helpers for base blocks. Resolves theme-token keys
 * (e.g. spacing scale stop `'6'`) to the corresponding `var(--atlas-*)` CSS
 * expression so block authors never hard-code raw values.
 */

/** @param {string|undefined} key */
export function spacingVar(key) {
  if (key == null || key === '') return '0'
  return `var(--atlas-spacing-${key})`
}

/** @param {string|undefined} key */
export function colorVar(key, fallback = 'inherit') {
  if (!key) return fallback
  return `var(--atlas-color-${key}, ${fallback})`
}

/** @param {string|undefined} key */
export function radiusVar(key, fallback = '0') {
  if (!key) return fallback
  return `var(--atlas-radius-${key}, ${fallback})`
}

/** @param {string|undefined} key */
export function fontSizeVar(key, fallback = '1rem') {
  if (!key) return fallback
  return `var(--atlas-fontSize-${key}, ${fallback})`
}

/** @param {string|undefined} key */
export function shadowVar(key, fallback = 'none') {
  if (!key) return fallback
  return `var(--atlas-shadow-${key}, ${fallback})`
}

/** Reusable option lists for select fields. */
export const SPACING_STOPS = ['0', '1', '2', '3', '4', '6', '8', '12', '16']
export const COLOR_TOKENS = ['primary', 'primaryFg', 'bg', 'fg', 'muted', 'accent', 'danger']
export const RADIUS_TOKENS = [
  { value: 'none', label: 'Sin bordes' },
  { value: 'sm', label: 'Pequeño' },
  { value: 'md', label: 'Mediano' },
  { value: 'lg', label: 'Grande' },
  { value: 'pill', label: 'Píldora' },
]
export const FONT_SIZE_TOKENS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
export const SHADOW_TOKENS = [
  { value: 'none', label: 'Sin sombra' },
  { value: 'sm', label: 'Pequeña' },
  { value: 'md', label: 'Mediana' },
  { value: 'lg', label: 'Grande' },
]
export const ALIGN_OPTIONS = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
]

export const FONT_WEIGHT_OPTIONS = [
  { value: '300', label: 'Delgada' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extrabold' },
]

export const LINE_HEIGHT_OPTIONS = [
  { value: '1',    label: 'Compacta (1)' },
  { value: '1.2',  label: 'Ajustada (1.2)' },
  { value: '1.5',  label: 'Normal (1.5)' },
  { value: '1.75', label: 'Relajada (1.75)' },
  { value: '2',    label: 'Amplia (2)' },
]

export const LETTER_SPACING_OPTIONS = [
  { value: '-0.05em', label: 'Muy estrecho' },
  { value: '-0.02em', label: 'Estrecho' },
  { value: '0',       label: 'Normal' },
  { value: '0.03em',  label: 'Amplio' },
  { value: '0.08em',  label: 'Muy amplio' },
  { value: '0.15em',  label: 'Extra amplio' },
]

export const MAX_WIDTH_OPTIONS = [
  { value: '',       label: 'Sin límite' },
  { value: '40ch',   label: 'Estrecho (40ch)' },
  { value: '65ch',   label: 'Lectura (65ch)' },
  { value: '480px',  label: 'XS (480px)' },
  { value: '640px',  label: 'SM (640px)' },
  { value: '768px',  label: 'MD (768px)' },
  { value: '1024px', label: 'LG (1024px)' },
  { value: '1280px', label: 'XL (1280px)' },
]

export const VALIGN_OPTIONS = [
  { value: 'start',   label: 'Arriba' },
  { value: 'center',  label: 'Centro' },
  { value: 'end',     label: 'Abajo' },
  { value: 'stretch', label: 'Estirar' },
]

export const MIN_HEIGHT_OPTIONS = [
  { value: '',      label: 'Automática' },
  { value: '200px', label: 'Pequeña (200px)' },
  { value: '360px', label: 'Mediana (360px)' },
  { value: '480px', label: 'Grande (480px)' },
  { value: '600px', label: 'XL (600px)' },
  { value: '100vh', label: 'Pantalla completa' },
]

export const ASPECT_RATIO_OPTIONS = [
  { value: 'auto',   label: 'Automática (original)' },
  { value: '16 / 9', label: '16:9 — Panorámica' },
  { value: '4 / 3',  label: '4:3 — Estándar' },
  { value: '3 / 2',  label: '3:2 — Fotografía' },
  { value: '1 / 1',  label: '1:1 — Cuadrada' },
  { value: '2 / 3',  label: '2:3 — Retrato' },
  { value: '9 / 16', label: '9:16 — Vertical' },
  { value: '21 / 9', label: '21:9 — Ultra panorámica' },
  { value: '3 / 4',  label: '3:4 — Retrato estándar' },
]

export const IMAGE_WIDTH_OPTIONS = [
  { value: '100%',  label: 'Ancho completo' },
  { value: '75%',   label: '75%' },
  { value: '50%',   label: '50%' },
  { value: '33%',   label: '33%' },
  { value: '25%',   label: '25%' },
  { value: '480px', label: 'Fijo 480px' },
  { value: '320px', label: 'Fijo 320px' },
  { value: 'auto',  label: 'Automático' },
]

export const COLUMN_LAYOUT_OPTIONS = [
  { value: 'equal',  label: 'Iguales' },
  { value: '2-1',    label: '2/3 + 1/3' },
  { value: '1-2',    label: '1/3 + 2/3' },
  { value: '3-1',    label: '3/4 + 1/4' },
  { value: '1-3',    label: '1/4 + 3/4' },
]
