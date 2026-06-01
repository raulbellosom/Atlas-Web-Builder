/**
 * @file TransformField — rotate, skewX, skewY controls.
 * Stores: { rotate, skewX, skewY }
 */

const DEFAULT = { rotate: 0, skewX: 0, skewY: 0 }

function normalize(v) {
  if (!v || typeof v !== 'object') return { ...DEFAULT }
  return {
    rotate: v.rotate ?? 0,
    skewX: v.skewX ?? 0,
    skewY: v.skewY ?? 0,
  }
}

function SliderRow({ label, value, min, max, unit, onChange }) {
  return (
    <div className="atlas-wb-anim-field__row">
      <span className="atlas-wb-anim-field__sub-label">{label}</span>
      <div className="atlas-wb-anim-field__slider-group">
        <input
          type="range"
          className="atlas-wb-anim-field__range"
          min={min}
          max={max}
          step="1"
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

export function TransformField({ value, onChange, label }) {
  const v = normalize(value)

  function update(patch) {
    onChange({ ...v, ...patch })
  }

  const isDefault = v.rotate === 0 && v.skewX === 0 && v.skewY === 0

  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>

      <div className="atlas-wb-anim-field">
        <SliderRow
          label="Rotación"
          value={v.rotate}
          min={-180}
          max={180}
          unit="°"
          onChange={(n) => update({ rotate: n })}
        />
        <SliderRow
          label="Inclinación X"
          value={v.skewX}
          min={-45}
          max={45}
          unit="°"
          onChange={(n) => update({ skewX: n })}
        />
        <SliderRow
          label="Inclinación Y"
          value={v.skewY}
          min={-45}
          max={45}
          unit="°"
          onChange={(n) => update({ skewY: n })}
        />
      </div>

      {!isDefault && (
        <button
          type="button"
          className="atlas-wb-field__button"
          onClick={() => onChange({ ...DEFAULT })}
        >
          Restablecer transformaciones
        </button>
      )}
    </div>
  )
}
