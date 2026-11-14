import { forwardRef, useEffect, useState } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { OverlayPortal } from './EditorAppearance.jsx'

/** Non-modal Radix popover: focus moves in, Escape/outside close, focus returns to the trigger. */
export function Popover({ label, trigger, children }) {
  return <PopoverPrimitive.Root>
    <PopoverPrimitive.Trigger className="atlas-wb-btn" aria-label={label}>{trigger ?? label}</PopoverPrimitive.Trigger>
    <OverlayPortal portal={PopoverPrimitive.Portal}>
      <PopoverPrimitive.Content className="atlas-wb-popover" aria-label={label} side="bottom" align="start" sideOffset={8} collisionPadding={8}>
        <header><strong>{label}</strong><PopoverPrimitive.Close className="atlas-wb-icon-btn" aria-label={`Cerrar ${label}`}><X /></PopoverPrimitive.Close></header>
        {children}
      </PopoverPrimitive.Content>
    </OverlayPortal>
  </PopoverPrimitive.Root>
}

/** Accessible label rendered by Radix; works on hover and keyboard focus, never on touch. */
export function TooltipLabel({ label, side = 'bottom', children }) {
  return <TooltipPrimitive.Root>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <OverlayPortal portal={TooltipPrimitive.Portal}>
      <TooltipPrimitive.Content className="atlas-wb-tooltip__content" side={side} sideOffset={6} collisionPadding={8}>{label}</TooltipPrimitive.Content>
    </OverlayPortal>
  </TooltipPrimitive.Root>
}

export function Tooltip({ label, children }) {
  // Standalone controls may live outside the editor provider; a nested provider is harmless.
  return <TooltipPrimitive.Provider delayDuration={400}>
    <TooltipLabel label={label} side="top"><button type="button" className="atlas-wb-tooltip">{children}</button></TooltipLabel>
  </TooltipPrimitive.Provider>
}

/** Icon-only button: Lucide icon, accessible name and tooltip from one label. */
export const IconButton = forwardRef(function IconButton({ label, icon: Icon, tooltip = true, variant = 'ghost', active, className, children, side, ...props }, ref) {
  const button = <button ref={ref} type="button" aria-label={label} className={clsx('atlas-wb-icon-btn', `atlas-wb-icon-btn--${variant}`, active && 'atlas-wb-icon-btn--active', className)} {...props}>
    {Icon ? <Icon /> : null}{children}
  </button>
  return tooltip ? <TooltipLabel label={label} side={side}>{button}</TooltipLabel> : button
})

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
