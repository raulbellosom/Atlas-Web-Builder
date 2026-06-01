/**
 * @file AnimationField — entrance animation preset picker with duration,
 * delay and easing controls. Stores an object:
 *   { preset: string, duration: number, delay: number, easing: string }
 *
 * The rendered value maps to a CSS `animation` shorthand via the
 * `atlas-anim-*` keyframes defined in editor.css (also included in the
 * public stylesheet so animations run in production).
 */

const PRESETS = [
  { value: 'none', label: 'Sin animación' },
  { value: 'fade-in', label: 'Aparecer (fade)' },
  { value: 'slide-up', label: 'Subir desde abajo' },
  { value: 'slide-down', label: 'Bajar desde arriba' },
  { value: 'slide-left', label: 'Entrar desde derecha' },
  { value: 'slide-right', label: 'Entrar desde izquierda' },
  { value: 'zoom-in', label: 'Zoom — crecer' },
  { value: 'zoom-out', label: 'Zoom — encoger' },
]

const EASINGS = [
  { value: 'ease-out', label: 'Suave al final (recomendado)' },
  { value: 'ease', label: 'Suave' },
  { value: 'ease-in', label: 'Acelerado' },
  { value: 'ease-in-out', label: 'Suave en ambos extremos' },
  { value: 'linear', label: 'Lineal' },
]

function normalize(v) {
  if (!v || typeof v !== 'object') {
    return { preset: 'none', duration: 600, delay: 0, easing: 'ease-out' }
  }
  return {
    preset: v.preset || 'none',
    duration: v.duration ?? 600,
    delay: v.delay ?? 0,
    easing: v.easing || 'ease-out',
  }
}

export function AnimationField({ value, onChange, label }) {
  const v = normalize(value)

  function update(patch) {
    onChange({ ...v, ...patch })
  }

  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>

      <select
        className="atlas-wb-field__select"
        value={v.preset}
        onChange={(e) => update({ preset: e.target.value })}
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {v.preset !== 'none' && (
        <div className="atlas-wb-anim-field">
          <div className="atlas-wb-anim-field__row">
            <span className="atlas-wb-anim-field__sub-label">Duración</span>
            <div className="atlas-wb-anim-field__slider-group">
              <input
                type="range"
                className="atlas-wb-anim-field__range"
                min="100"
                max="2000"
                step="50"
                value={v.duration}
                onChange={(e) => update({ duration: Number(e.target.value) })}
              />
              <span className="atlas-wb-anim-field__val">{v.duration}ms</span>
            </div>
          </div>

          <div className="atlas-wb-anim-field__row">
            <span className="atlas-wb-anim-field__sub-label">Retraso</span>
            <div className="atlas-wb-anim-field__slider-group">
              <input
                type="range"
                className="atlas-wb-anim-field__range"
                min="0"
                max="2000"
                step="50"
                value={v.delay}
                onChange={(e) => update({ delay: Number(e.target.value) })}
              />
              <span className="atlas-wb-anim-field__val">{v.delay}ms</span>
            </div>
          </div>

          <div className="atlas-wb-anim-field__row">
            <span className="atlas-wb-anim-field__sub-label">Curva</span>
            <select
              className="atlas-wb-field__select"
              value={v.easing}
              onChange={(e) => update({ easing: e.target.value })}
            >
              {EASINGS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
