// Contract of the universal `_*` block props (motion, interaction, filters). One declarative table drives:
//   - the render-time sanitizers in effects.js (ranges and enums),
//   - the catalog (`universalProps`) that hosts and the Website portable format validate against,
//   - the editor controls (limits).
// The table is JSON-serializable on purpose: it is copied into the Builder catalog and re-read by readers that do not
// run React (Hub validator, ERP). Spec: docs/superpowers/specs/2026-11-23-motion-and-responsive-pro-design.md.

export const EFFECT_PRESETS = Object.freeze([
  'none', 'fade-in', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out', 'blur-in', 'rotate-in', 'flip-up',
  'slide-fade-up', 'slide-fade-down', 'slide-fade-left', 'slide-fade-right',
])
export const ANIMATION_EASINGS = Object.freeze(['ease-out', 'ease', 'ease-in', 'ease-in-out', 'linear'])
export const HOVER_EASINGS = Object.freeze(['ease', 'ease-out', 'ease-in-out'])
export const CURSORS = Object.freeze(['auto', 'default', 'pointer', 'grab', 'zoom-in', 'zoom-out', 'crosshair', 'not-allowed', 'text'])
export const KENBURNS_PANS = Object.freeze(['none', 'left', 'right', 'up', 'down', 'center'])

const number = (min, max, extra = {}) => ({ type: 'number', min, max, ...extra })
const enumOf = (values) => ({ type: 'enum', values: [...values] })
const object = (keys) => ({ type: 'object', keys })

export const UNIVERSAL_PROPS = Object.freeze({
  _animation: object({
    preset: enumOf(EFFECT_PRESETS), duration: number(0, 5000), delay: number(0, 5000), easing: enumOf(ANIMATION_EASINGS),
    distance: number(0, 400), scaleFrom: number(0.5, 1.5), blur: number(0, 40), once: { type: 'boolean' },
  }),
  _scrollReveal: { type: 'boolean' },
  _kenburns: object({ zoom: number(1, 1.5), direction: enumOf(['in', 'out']), pan: enumOf(KENBURNS_PANS), duration: number(3000, 30000), easing: enumOf(ANIMATION_EASINGS) }),
  _pressed: object({ scale: number(0.9, 1), brightness: number(50, 150) }),
  _stagger: number(0, 1000),
  _parallax: object({ speed: number(-0.5, 0.5) }),
  _hover: object({ scale: { type: 'string', pattern: '^$|^[01]\\.\\d{1,2}$' }, shadow: enumOf(['', 'sm', 'md', 'lg']), brightness: number(50, 150), duration: number(0, 2000), easing: enumOf(HOVER_EASINGS) }),
  _transform: object({ rotate: number(-360, 360), skewX: number(-89, 89), skewY: number(-89, 89) }),
  _filter: object({ blur: number(0, 50), brightness: number(0, 300), contrast: number(0, 300), grayscale: number(0, 100), sepia: number(0, 100) }),
  _opacity: number(0, 1),
  _cursor: enumOf(CURSORS),
  _zIndex: number(-1000, 1000, { integer: true }),
  _sticky: { type: 'boolean' },
  _lazy: { type: 'boolean' },
  _lazyMinHeight: number(0, 4000),
})

export const UNIVERSAL_CAPABILITIES = Object.freeze({ motion: 1, responsive: 1 })

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

function check(spec, value, path, errors) {
  const bad = (message) => errors.push({ code: 'effect_invalid', path, message })
  switch (spec.type) {
    case 'boolean': if (typeof value !== 'boolean') bad('se espera true o false'); return
    case 'enum': if (!spec.values.includes(value)) bad(`valor no permitido (${spec.values.join(', ')})`); return
    case 'string': if (typeof value !== 'string' || value.length > 20 || !new RegExp(spec.pattern).test(value)) bad('formato no permitido'); return
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value) || value < spec.min || value > spec.max || (spec.integer && !Number.isInteger(value))) bad(`número entre ${spec.min} y ${spec.max}`)
      return
    case 'object':
      if (!isObject(value)) { bad('se espera un objeto'); return }
      for (const [key, inner] of Object.entries(value)) {
        if (!Object.hasOwn(spec.keys, key)) { errors.push({ code: 'effect_invalid', path: `${path}.${key}`, message: 'clave no permitida' }); continue }
        check(spec.keys[key], inner, `${path}.${key}`, errors)
      }
      return
    default: bad('especificación desconocida')
  }
}

/**
 * Strict validation of one universal prop against the contract (write time). Render time stays tolerant: the sanitizers in
 * effects.js clamp instead of rejecting. `specs` is injectable so readers can validate against the table shipped in a catalog.
 * @returns {{ ok: boolean, errors: Array<{ code: 'effect_invalid'|'effect_unknown', path: string, message: string }> }}
 */
export function validateUniversalProp(name, value, specs = UNIVERSAL_PROPS, path = name) {
  if (typeof name !== 'string' || !Object.hasOwn(specs, name)) return { ok: false, errors: [{ code: 'effect_unknown', path, message: `La propiedad ${String(name).slice(0, 40)} no existe en el contrato de efectos` }] }
  const errors = []
  check(specs[name], value, path, errors)
  return { ok: errors.length === 0, errors }
}
