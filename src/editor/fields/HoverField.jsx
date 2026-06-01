/**
 * @file HoverField — controls for hover transition effects.
 * Stores: { scale, shadow, brightness, duration, easing }
 */

const SCALE_OPTIONS = [
  { value: '', label: 'Sin cambio de escala' },
  { value: '1.02', label: 'Sutil (1.02×)' },
  { value: '1.05', label: 'Pequeño (1.05×)' },
  { value: '1.08', label: 'Mediano (1.08×)' },
  { value: '1.12', label: 'Grande (1.12×)' },
  { value: '0.97', label: 'Encoger (0.97×)' },
]

const SHADOW_OPTIONS = [
  { value: '', label: 'Sin sombra extra' },
  { value: 'sm', label: 'Pequeña' },
  { value: 'md', label: 'Mediana' },
  { value: 'lg', label: 'Grande' },
]

const EASING_OPTIONS = [
  { value: 'ease', label: 'Suave' },
  { value: 'ease-out', label: 'Suave al final' },
  { value: 'ease-in-out', label: 'Suave en ambos extremos' },
]

const DEFAULT = { scale: '', shadow: '', brightness: 100, duration: 200, easing: 'ease' }

function normalize(v) {
  if (!v || typeof v !== 'object') return { ...DEFAULT }
  return {
    scale: v.scale || '',
    shadow: v.shadow || '',
    brightness: v.brightness ?? 100,
    duration: v.duration ?? 200,
    easing: v.easing || 'ease',
  }
}

export function HoverField({ value, onChange, label }) {
  const v = normalize(value)

  function update(patch) {
    onChange({ ...v, ...patch })
  }

  const hasAny = v.scale || v.shadow || v.brightness !== 100

  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>

      <div className="atlas-wb-anim-field">
        {/* Scale */}
        <div className="atlas-wb-anim-field__row">
          <span className="atlas-wb-anim-field__sub-label">Escala</span>
          <select
            className="atlas-wb-field__select"
            value={v.scale}
            onChange={(e) => update({ scale: e.target.value })}
          >
            {SCALE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Shadow */}
        <div className="atlas-wb-anim-field__row">
          <span className="atlas-wb-anim-field__sub-label">Sombra</span>
          <select
            className="atlas-wb-field__select"
            value={v.shadow}
            onChange={(e) => update({ shadow: e.target.value })}
          >
            {SHADOW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Brightness */}
        <div className="atlas-wb-anim-field__row">
          <span className="atlas-wb-anim-field__sub-label">Brillo</span>
          <div className="atlas-wb-anim-field__slider-group">
            <input
              type="range"
              className="atlas-wb-anim-field__range"
              min="50"
              max="150"
              step="5"
              value={v.brightness}
              onChange={(e) => update({ brightness: Number(e.target.value) })}
            />
            <span className="atlas-wb-anim-field__val">{v.brightness}%</span>
          </div>
        </div>

        {/* Duration */}
        <div className="atlas-wb-anim-field__row">
          <span className="atlas-wb-anim-field__sub-label">Velocidad</span>
          <div className="atlas-wb-anim-field__slider-group">
            <input
              type="range"
              className="atlas-wb-anim-field__range"
              min="50"
              max="800"
              step="50"
              value={v.duration}
              onChange={(e) => update({ duration: Number(e.target.value) })}
            />
            <span className="atlas-wb-anim-field__val">{v.duration}ms</span>
          </div>
        </div>

        {/* Easing */}
        <div className="atlas-wb-anim-field__row">
          <span className="atlas-wb-anim-field__sub-label">Curva</span>
          <select
            className="atlas-wb-field__select"
            value={v.easing}
            onChange={(e) => update({ easing: e.target.value })}
          >
            {EASING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasAny && (
        <button
          type="button"
          className="atlas-wb-field__button"
          onClick={() => onChange({ ...DEFAULT })}
        >
          Restablecer hover
        </button>
      )}
    </div>
  )
}
