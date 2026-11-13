import { useEffect, useId, useState } from 'react'

export function NumberInput({ value, onChange, label, id, min, max, step = 1, disabled }) {
  const generatedId = useId(), inputId = id ?? generatedId
  const [draft, setDraft] = useState(value ?? '')
  const [invalid, setInvalid] = useState(false)
  useEffect(() => { setDraft(value ?? ''); setInvalid(false) }, [value])
  function increment(direction) {
    const next = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(value ?? 0) + direction * Number(step)))
    if (Number.isFinite(next)) { setDraft(next); setInvalid(false); onChange(next) }
  }
  return <div className="atlas-wb-number">
    <div className="atlas-wb-number__row">
      <button type="button" aria-label={`Disminuir ${label}`} disabled={disabled || (min !== undefined && value <= min)} onClick={() => increment(-1)}>−</button>
      <input id={inputId} aria-label={label} type="number" inputMode="decimal" className="atlas-wb-field__input" value={draft} min={min} max={max} step={step} disabled={disabled}
        aria-invalid={invalid || undefined} aria-describedby={invalid ? `${inputId}-error` : undefined}
        onChange={event => {
          const raw = event.target.value
          setDraft(raw)
          const valid = event.target.checkValidity()
          setInvalid(!valid)
          if (valid) onChange(raw === '' ? undefined : Number(raw))
        }} />
      <button type="button" aria-label={`Aumentar ${label}`} disabled={disabled || (max !== undefined && value >= max)} onClick={() => increment(1)}>+</button>
    </div>
    {invalid && <span id={`${inputId}-error`} className="atlas-wb-field__error" role="alert">Valor fuera del rango o incremento permitido. No se ha aplicado.</span>}
  </div>
}

export function SliderInput({ value, onChange, label, min = 0, max = 100, step = 1 }) {
  return <div className="atlas-wb-slider">
    <input type="range" aria-label={`${label} (deslizador)`} min={min} max={max} step={step} value={value ?? min} onChange={event => onChange(Number(event.target.value))} />
    <NumberInput label={label} value={value} onChange={onChange} min={min} max={max} step={step} />
  </div>
}

/** Only use for fields whose existing contract already accepts CSS length strings. */
export function UnitInput({ value, onChange, label, units = ['px', '%', 'rem', 'em', 'vh', 'vw', 'auto'] }) {
  const match = typeof value === 'string' && value.match(/^(-?\d+(?:\.\d+)?)(px|%|rem|em|vh|vw)$/)
  const valid = value === undefined || value === '' || value === 'auto' || !!match
  const unit = value === 'auto' ? 'auto' : match?.[2] ?? units[0]
  return <div className="atlas-wb-unit">
    <NumberInput label={label} value={match ? Number(match[1]) : undefined} disabled={unit === 'auto' || !valid}
      onChange={next => onChange(next === undefined ? '' : `${next}${unit}`)} step={0.1} />
    <select aria-label={`Unidad de ${label}`} className="atlas-wb-field__select" value={valid ? unit : ''} onChange={event => {
      const next = event.target.value
      onChange(next === 'auto' ? 'auto' : `${match ? match[1] : '0'}${next}`)
    }}>
      {!valid && <option value="">Valor personalizado</option>}
      {units.map(item => <option key={item} value={item}>{item}</option>)}
    </select>
    {!valid && <span className="atlas-wb-field__hint">Valor conservado: {String(value)}. Elige una unidad para reemplazarlo.</span>}
  </div>
}
