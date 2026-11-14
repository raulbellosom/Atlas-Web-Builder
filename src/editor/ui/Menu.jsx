import { useRef } from 'react'
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import clsx from 'clsx'
import { OverlayPortal } from './EditorAppearance.jsx'
import { TooltipLabel } from './OverlayControls.jsx'

/** Radix dropdown in the editor's own container. Non-modal: it never locks the host's
 * scroll or disables pointer events on the host body. Focus returns to the trigger. */
export function ActionMenu({ label, trigger, align = 'end', children }) {
  const triggerRef = useRef(null)
  return <MenuPrimitive.Root modal={false}>
    <TooltipLabel label={label}>
      <MenuPrimitive.Trigger asChild ref={triggerRef}>{trigger}</MenuPrimitive.Trigger>
    </TooltipLabel>
    <OverlayPortal portal={MenuPrimitive.Portal}>
      <MenuPrimitive.Content className="atlas-wb-menu" aria-label={label} align={align} sideOffset={6} collisionPadding={8} loop
        onCloseAutoFocus={() => triggerRef.current?.setAttribute('data-awb-focus-return', '')}>
        {children}
      </MenuPrimitive.Content>
    </OverlayPortal>
  </MenuPrimitive.Root>
}

export function MenuItem({ icon: Icon, tone, children, ...props }) {
  return <MenuPrimitive.Item className={clsx('atlas-wb-menu__item', tone && `atlas-wb-menu__item--${tone}`)} {...props}>
    {Icon ? <Icon /> : <span className="atlas-wb-menu__spacer" />}<span>{children}</span>
  </MenuPrimitive.Item>
}

/** Exclusive choice as `menuitemradio`; the selected option is announced and checked. */
export function MenuRadioGroup({ label, value, onValueChange, options }) {
  return <MenuPrimitive.Group aria-label={label}>
    <MenuPrimitive.Label className="atlas-wb-menu__label">{label}</MenuPrimitive.Label>
    <MenuPrimitive.RadioGroup value={value} onValueChange={onValueChange}>
      {options.map(({ value: option, label: text, icon: Icon }) => <MenuPrimitive.RadioItem key={option} value={option} className="atlas-wb-menu__item">
        {Icon ? <Icon /> : <span className="atlas-wb-menu__spacer" />}<span>{text}</span>
        <MenuPrimitive.ItemIndicator className="atlas-wb-menu__check"><Check /></MenuPrimitive.ItemIndicator>
      </MenuPrimitive.RadioItem>)}
    </MenuPrimitive.RadioGroup>
  </MenuPrimitive.Group>
}

export const MenuSeparator = () => <MenuPrimitive.Separator className="atlas-wb-menu__separator" />
