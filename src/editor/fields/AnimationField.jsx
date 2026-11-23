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
  { value: 'blur-in', label: 'Desenfoque a nítido' },
  { value: 'rotate-in', label: 'Giro suave' },
  { value: 'flip-up', label: 'Voltear hacia arriba' },
  { value: 'slide-fade-up', label: 'Subir suave (fade)' },
  { value: 'slide-fade-down', label: 'Bajar suave (fade)' },
  { value: 'slide-fade-left', label: 'Entrar suave desde derecha' },
  { value: 'slide-fade-right', label: 'Entrar suave desde izquierda' },
]

const EASINGS = [
  { value: 'ease-out', label: 'Suave al final (recomendado)' },
  { value: 'ease', label: 'Suave' },
  { value: 'ease-in', label: 'Acelerado' },
  { value: 'ease-in-out', label: 'Suave en ambos extremos' },
  { value: 'linear', label: 'Lineal' },
]

const SLIDES = /^(slide-|slide-fade-)/
const ZOOMS = /^zoom-/

function normalize(v) {
  if (!v || typeof v !== 'object') {
    return { preset: 'none', duration: 600, delay: 0, easing: 'ease-out' }
  }
  return {
    ...v, // keeps distance / scaleFrom / blur / once
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

          {SLIDES.test(v.preset) && (
            <div className="atlas-wb-anim-field__row">
              <span className="atlas-wb-anim-field__sub-label">Distancia</span>
              <div className="atlas-wb-anim-field__slider-group">
                <input type="range" className="atlas-wb-anim-field__range" aria-label="Distancia del desplazamiento" min="0" max="400" step="4" value={v.distance ?? (v.preset.startsWith('slide-fade') ? 14 : 28)} onChange={(e) => update({ distance: Number(e.target.value) })} />
                <span className="atlas-wb-anim-field__val">{v.distance ?? (v.preset.startsWith('slide-fade') ? 14 : 28)}px</span>
              </div>
            </div>
          )}
          {ZOOMS.test(v.preset) && (
            <div className="atlas-wb-anim-field__row">
              <span className="atlas-wb-anim-field__sub-label">Escala inicial</span>
              <div className="atlas-wb-anim-field__slider-group">
                <input type="range" className="atlas-wb-anim-field__range" aria-label="Escala inicial" min="0.5" max="1.5" step="0.02" value={v.scaleFrom ?? (v.preset === 'zoom-in' ? 0.88 : 1.12)} onChange={(e) => update({ scaleFrom: Number(e.target.value) })} />
                <span className="atlas-wb-anim-field__val">{(v.scaleFrom ?? (v.preset === 'zoom-in' ? 0.88 : 1.12)).toFixed(2)}</span>
              </div>
            </div>
          )}
          {v.preset === 'blur-in' && (
            <div className="atlas-wb-anim-field__row">
              <span className="atlas-wb-anim-field__sub-label">Desenfoque</span>
              <div className="atlas-wb-anim-field__slider-group">
                <input type="range" className="atlas-wb-anim-field__range" aria-label="Intensidad del desenfoque" min="0" max="40" step="1" value={v.blur ?? 12} onChange={(e) => update({ blur: Number(e.target.value) })} />
                <span className="atlas-wb-anim-field__val">{v.blur ?? 12}px</span>
              </div>
            </div>
          )}
          <label className="atlas-wb-effects-toggle">
            <input type="checkbox" checked={v.once === false} onChange={(e) => update({ once: e.target.checked ? false : undefined })} />
            <span className="atlas-wb-effects-toggle__text">Repetir cada vez que el bloque vuelve a entrar en pantalla</span>
          </label>

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
