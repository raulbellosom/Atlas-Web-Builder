import { useEffect, useId, useRef, useState } from 'react'
import { EditorPortal, DialogSurface } from './EditorAppearance.jsx'

function PopoverContent({ children, label, onClose, anchor }) {
  const rect = anchor.current.getBoundingClientRect(), view = anchor.current.ownerDocument.defaultView
  return <EditorPortal><div className="atlas-wb-popover-backdrop" role="presentation" onClick={onClose} />
    <DialogSurface onClose={onClose} returnFocusRef={anchor} role="dialog" aria-modal="true" aria-label={label} className="atlas-wb-popover"
      style={{ left: Math.max(8, Math.min(rect.left, view.innerWidth - 296)), top: Math.min(rect.bottom + 8, Math.max(8, view.innerHeight - 300)) }}>
      <header><strong>{label}</strong><button type="button" className="atlas-wb-btn" onClick={onClose} aria-label={`Cerrar ${label}`}>×</button></header>
      {children}
    </DialogSurface></EditorPortal>
}

export function Popover({ label, trigger, children }) {
  const [open, setOpen] = useState(false), anchor = useRef(null)
  return <><button ref={anchor} type="button" className="atlas-wb-btn" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(value => !value)}>{trigger ?? label}</button>
    {open && <PopoverContent label={label} anchor={anchor} onClose={() => setOpen(false)}>{children}</PopoverContent>}</>
}

export function Tooltip({ label, children }) {
  const id = useId(), anchor = useRef(null), [open, setOpen] = useState(false)
  const rect = open ? anchor.current?.getBoundingClientRect() : null
  return <button type="button" ref={anchor} className="atlas-wb-tooltip" aria-describedby={open ? id : undefined}
    onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
    onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>{children}
    {open && <EditorPortal><span className="atlas-wb-tooltip__content" role="tooltip" id={id} style={{ left: Math.max(8, Math.min(rect.left, anchor.current.ownerDocument.defaultView.innerWidth - 248)), top: Math.max(8, rect.top - 38) }}>{label}</span></EditorPortal>}
  </button>
}

export function ColorInput({ value, onChange, label, swatches = ['#ffffff', '#111827', '#315dec', '#147547', '#db4c3f'] }) {
  const isHex = /^#[0-9a-f]{6}$/i.test(value ?? '')
  const [draft, setDraft] = useState(value ?? '')
  useEffect(() => setDraft(value ?? ''), [value])
  const valid = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(draft)
  // Picking a color also replaces a rejected draft, even when the saved value does not change.
  const pick = color => { setDraft(color); onChange(color) }
  return <div className="atlas-wb-color-input">
    <label className="atlas-wb-color-input__native"><span className="atlas-wb-sr-only">{label}</span>
      <input type="color" value={isHex ? value : '#000000'} onChange={event => pick(event.target.value)} /></label>
    <input type="text" aria-label={`${label} (hexadecimal)`} className="atlas-wb-field__input" value={draft} aria-invalid={!valid || undefined} onChange={event => { setDraft(event.target.value); if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(event.target.value)) onChange(event.target.value) }} />
    {!valid && <span className="atlas-wb-field__hint">Hexadecimal no aplicado; se conserva el valor anterior.</span>}
    <div className="atlas-wb-color-input__swatches" role="group" aria-label={`Muestras de ${label}`}>
      {swatches.map(color => <button key={color} type="button" aria-label={color} aria-pressed={value === color} style={{ '--swatch': color }} onClick={() => pick(color)} />)}
    </div>
  </div>
}
