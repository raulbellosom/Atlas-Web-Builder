/**
 * @file FilterField — CSS filter effects control (blur, brightness, contrast,
 * grayscale, sepia). Stores an object:
 *   { blur?: number, brightness?: number, contrast?: number,
 *     grayscale?: number, sepia?: number }
 *
 * Values are applied as `filter: blur(Xpx) brightness(X%) ...` inline style
 * at the BlockRenderer wrapper level.
 */

function normalize(v) {
  if (!v || typeof v !== 'object') {
    return { blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 }
  }
  return {
    blur: v.blur ?? 0,
    brightness: v.brightness ?? 100,
    contrast: v.contrast ?? 100,
    grayscale: v.grayscale ?? 0,
    sepia: v.sepia ?? 0,
  }
}

function SliderRow({ label, value, min, max, step = 1, unit, onChange }) {
  return (
    <div className="atlas-wb-anim-field__row">
      <span className="atlas-wb-anim-field__sub-label">{label}</span>
      <div className="atlas-wb-anim-field__slider-group">
        <input
          type="range"
          className="atlas-wb-anim-field__range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="atlas-wb-anim-field__val">
          {value}
          {unit}
        </span>
      </div>
    </div>
  )
}

export function FilterField({ value, onChange, label }) {
  const v = normalize(value)

  function update(patch) {
    onChange({ ...v, ...patch })
  }

  const isDefault =
    v.blur === 0 && v.brightness === 100 && v.contrast === 100 && v.grayscale === 0 && v.sepia === 0

  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>

      <div className="atlas-wb-anim-field">
        <SliderRow
          label="Desenfoque"
          value={v.blur}
          min={0}
          max={20}
          step={0.5}
          unit="px"
          onChange={(n) => update({ blur: n })}
        />
        <SliderRow
          label="Brillo"
          value={v.brightness}
          min={0}
          max={200}
          unit="%"
          onChange={(n) => update({ brightness: n })}
        />
        <SliderRow
          label="Contraste"
          value={v.contrast}
          min={0}
          max={200}
          unit="%"
          onChange={(n) => update({ contrast: n })}
        />
        <SliderRow
          label="Escala de grises"
          value={v.grayscale}
          min={0}
          max={100}
          unit="%"
          onChange={(n) => update({ grayscale: n })}
        />
        <SliderRow
          label="Sepia"
          value={v.sepia}
          min={0}
          max={100}
          unit="%"
          onChange={(n) => update({ sepia: n })}
        />
      </div>

      {!isDefault && (
        <button
          type="button"
          className="atlas-wb-field__button"
          onClick={() =>
            onChange({ blur: 0, brightness: 100, contrast: 100, grayscale: 0, sepia: 0 })
          }
        >
          Restablecer filtros
        </button>
      )}
    </div>
  )
}

/**
 * Build a CSS `filter` string from a filter value object.
 * Returns `undefined` when all values are defaults (no filter needed).
 *
 * @param {object|undefined} v
 * @returns {string|undefined}
 */
export function resolveFilter(v) {
  if (!v || typeof v !== 'object') return undefined
  const parts = []
  if (v.blur && v.blur !== 0) parts.push(`blur(${v.blur}px)`)
  if (v.brightness !== undefined && v.brightness !== 100) parts.push(`brightness(${v.brightness}%)`)
  if (v.contrast !== undefined && v.contrast !== 100) parts.push(`contrast(${v.contrast}%)`)
  if (v.grayscale && v.grayscale !== 0) parts.push(`grayscale(${v.grayscale}%)`)
  if (v.sepia && v.sepia !== 0) parts.push(`sepia(${v.sepia}%)`)
  return parts.length ? parts.join(' ') : undefined
}
