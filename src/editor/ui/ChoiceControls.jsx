import { useEffect, useId, useRef, useState } from 'react'
import { EditorPortal } from './EditorAppearance.jsx'

const normalize = options => options.map(option => typeof option === 'object' ? { ...option, value: String(option.value) } : { value: String(option), label: String(option) })

export function SegmentedControl({ value, onChange, label, options = [] }) {
  const items = normalize(options), refs = useRef([])
  return <div className="atlas-wb-segmented" role="radiogroup" aria-label={label}>
    {items.map((item, index) => <button key={item.value} ref={node => { refs.current[index] = node }} type="button" role="radio" aria-checked={String(value) === item.value}
      tabIndex={String(value) === item.value || (!items.some(option => option.value === String(value)) && index === 0) ? 0 : -1}
      title={item.label} onClick={() => onChange(item.value)}
      onKeyDown={event => {
        const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + direction + items.length) % items.length
        if (direction || ['Home', 'End'].includes(event.key)) { event.preventDefault(); refs.current[next]?.focus(); onChange(items[next].value) }
      }}>{item.label}</button>)}
  </div>
}

export function SwitchControl({ value, onChange, label }) {
  return <label className="atlas-wb-switch"><input type="checkbox" role="switch" checked={!!value} onChange={event => onChange(event.target.checked)} /><span aria-hidden="true" /><span>{label}</span></label>
}

export function CheckboxControl({ value, onChange, label }) {
  return <label className="atlas-wb-checkbox"><input type="checkbox" checked={!!value} onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>
}

/** Search only selects registered options; typing never changes the saved value. */
export function Combobox({ value, onChange, label, options = [] }) {
  const id = useId(), inputRef = useRef(null), popupRef = useRef(null)
  const items = normalize(options), selected = items.find(item => item.value === String(value))
  const [query, setQuery] = useState(''), [open, setOpen] = useState(false), [active, setActive] = useState(0), [position, setPosition] = useState({})
  const filtered = items.filter(item => String(item.label).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  useEffect(() => {
    if (!open) return
    const input = inputRef.current, owner = input.ownerDocument, view = owner.defaultView
    const update = () => {
      const rect = input.getBoundingClientRect(), bottom = view.innerHeight - rect.bottom
      setPosition({ left: Math.max(8, Math.min(rect.left, view.innerWidth - rect.width - 8)), width: rect.width,
        ...(bottom > 180 ? { top: rect.bottom + 4, maxHeight: Math.min(280, bottom - 12) } : { bottom: view.innerHeight - rect.top + 4, maxHeight: Math.min(280, rect.top - 12) }) })
    }
    const outside = event => { if (!input.contains(event.target) && !popupRef.current?.contains(event.target)) setOpen(false) }
    update(); view.addEventListener('resize', update); owner.addEventListener('scroll', update, true); owner.addEventListener('pointerdown', outside)
    return () => { view.removeEventListener('resize', update); owner.removeEventListener('scroll', update, true); owner.removeEventListener('pointerdown', outside) }
  }, [open])
  function pick(item) { if (!item || inputRef.current.matches(':disabled')) return; onChange(item.value); inputRef.current.focus(); setOpen(false); setQuery('') }
  return <div className="atlas-wb-combobox">
    <input ref={inputRef} className="atlas-wb-field__input" role="combobox" aria-label={label} aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`}
      aria-activedescendant={open && filtered[active] ? `${id}-${active}` : undefined} value={open ? query : selected?.label ?? value ?? ''}
      onFocus={event => { if (!event.currentTarget.matches(':disabled')) { setOpen(true); setQuery(''); setActive(0) } }}
      onChange={event => { setQuery(event.target.value); setOpen(true); setActive(0) }}
      onBlur={event => { if (!popupRef.current?.contains(event.relatedTarget)) setOpen(false) }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); return }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive(index => Math.max(0, Math.min(filtered.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))) }
        if (event.key === 'Enter' && open) { event.preventDefault(); pick(filtered[active]) }
        if (event.key === 'Tab') setOpen(false)
      }} />
    {open && <EditorPortal><div ref={popupRef} id={`${id}-list`} role="listbox" aria-label={label} className="atlas-wb-combobox__options" style={position}>
      {filtered.length ? filtered.map((item, index) => <div id={`${id}-${index}`} key={item.value} role="option" tabIndex={-1} aria-selected={index === active}
        onPointerDown={event => event.preventDefault()} onClick={() => pick(item)} onKeyDown={event => { if (event.key === 'Enter') pick(item) }} className="atlas-wb-combobox__option">{item.label}</div>) : <p role="status">Sin resultados</p>}
    </div></EditorPortal>}
  </div>
}
