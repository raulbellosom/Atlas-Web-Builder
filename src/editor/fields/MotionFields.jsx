import { SliderInput } from '../ui/NumericControls.jsx'
import { KENBURNS_PANS } from '../../renderer/universalProps.js'

const PAN_LABELS = { none: 'Sin desplazamiento', left: 'Hacia la izquierda', right: 'Hacia la derecha', up: 'Hacia arriba', down: 'Hacia abajo', center: 'Centrado' }
const row = (label, control) => <div className="atlas-wb-anim-field__row"><span className="atlas-wb-anim-field__sub-label">{label}</span>{control}</div>

/** Ken Burns: slow zoom (and optional pan) on an image, stored as `_kenburns`. Empty/absent = off. */
export function KenBurnsField({ value, onChange }) {
  const on = !!value && typeof value === 'object'
  const v = { zoom: 1.15, direction: 'in', pan: 'none', duration: 12000, easing: 'ease-in-out', ...(on ? value : {}) }
  const update = (patch) => onChange({ ...v, ...patch })
  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">Efecto Ken Burns (zoom lento)</span>
      <label className="atlas-wb-effects-toggle">
        <input type="checkbox" aria-label="Activar Ken Burns" checked={on} onChange={(e) => onChange(e.target.checked ? v : undefined)} />
        <span className="atlas-wb-effects-toggle__text">{on ? 'La imagen se acerca o aleja lentamente dentro de su marco' : 'Desactivado'}</span>
      </label>
      {on && (
        <div className="atlas-wb-anim-field">
          {row('Acercamiento', <SliderInput label="Acercamiento" value={v.zoom} min={1.02} max={1.5} step={0.01} onChange={(zoom) => update({ zoom })} />)}
          {row('Dirección', <select className="atlas-wb-field__select" aria-label="Dirección del zoom" value={v.direction} onChange={(e) => update({ direction: e.target.value })}><option value="in">Acercar</option><option value="out">Alejar</option></select>)}
          {row('Desplazamiento', <select className="atlas-wb-field__select" aria-label="Desplazamiento" value={v.pan} onChange={(e) => update({ pan: e.target.value })}>{KENBURNS_PANS.map((pan) => <option key={pan} value={pan}>{PAN_LABELS[pan]}</option>)}</select>)}
          {row('Duración (s)', <SliderInput label="Duración del efecto" value={v.duration / 1000} min={3} max={30} step={1} onChange={(seconds) => update({ duration: Math.round(seconds * 1000) })} />)}
          <p className="atlas-wb-empty">Se detiene para quienes prefieren menos movimiento y no cambia el tamaño del bloque.</p>
        </div>
      )}
    </div>
  )
}

/** Pressed state (:active) for touch and mouse, stored as `_pressed`. */
export function PressedField({ value, onChange }) {
  const v = { scale: 1, brightness: 100, ...(value ?? {}) }
  const update = (patch) => { const next = { ...v, ...patch }; onChange(next.scale === 1 && next.brightness === 100 ? undefined : next) }
  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">Al presionar (táctil y mouse)</span>
      <div className="atlas-wb-anim-field">
        {row('Escala', <SliderInput label="Escala al presionar" value={v.scale} min={0.9} max={1} step={0.01} onChange={(scale) => update({ scale })} />)}
        {row('Brillo (%)', <SliderInput label="Brillo al presionar" value={v.brightness} min={50} max={150} step={5} onChange={(brightness) => update({ brightness })} />)}
        <p className="atlas-wb-empty">El efecto al pasar el cursor solo se aplica con puntero; en pantallas táctiles se usa este estado.</p>
      </div>
    </div>
  )
}
