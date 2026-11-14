import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

const AppearanceContext = createContext(null)
const modes = ['light', 'dark', 'system']
const focusStacks = new WeakMap()
const useFocusEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Editor appearance is UI state; it never enters Page, Theme or undo history. */
export function EditorAppearanceProvider({ appearance, defaultAppearance = 'system', onAppearanceChange, children }) {
  const [localAppearance, setLocalAppearance] = useState(defaultAppearance)
  const [systemDark, setSystemDark] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  const scopeRef = useRef(null)
  const mode = appearance ?? localAppearance
  if (!modes.includes(mode)) throw new TypeError('appearance must be light, dark or system')

  useEffect(() => {
    const media = scopeRef.current?.ownerDocument.defaultView.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const update = () => setSystemDark(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  const resolvedAppearance = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
  const value = useMemo(() => ({
    appearance: mode, resolvedAppearance, scopeRef,
    setAppearance(next) {
      if (!modes.includes(next)) throw new TypeError('Invalid editor appearance')
      if (appearance === undefined) setLocalAppearance(next)
      onAppearanceChange?.(next)
    },
  }), [mode, resolvedAppearance, appearance, onAppearanceChange])

  return <AppearanceContext.Provider value={value}>
    <TooltipPrimitive.Provider delayDuration={400} skipDelayDuration={200}>
      <div className="atlas-wb-editor-scope" ref={scopeRef} data-appearance={resolvedAppearance} data-appearance-mode={mode}>
        {children}
      </div>
    </TooltipPrimitive.Provider>
  </AppearanceContext.Provider>
}

export function useEditorAppearance() { return useContext(AppearanceContext) }

/** Overlay target in the editor's own document: the editor root, or its fullscreen ancestor.
 * Inside a provider it never falls back to the host body; outside one (standalone
 * controls) it uses the current document's body. */
export function useOverlayContainer() {
  const appearance = useEditorAppearance()
  const scope = appearance?.scopeRef.current
  const owner = scope?.ownerDocument ?? (appearance || typeof document === 'undefined' ? null : document)
  const [fullscreen, setFullscreen] = useState(owner?.fullscreenElement)
  const [, remeasure] = useState(0)
  useEffect(() => { if (appearance && !scope) remeasure(1) }, [appearance, scope])
  useEffect(() => {
    if (!owner) return
    const update = () => setFullscreen(owner.fullscreenElement)
    owner.addEventListener('fullscreenchange', update)
    return () => owner.removeEventListener('fullscreenchange', update)
  }, [owner])
  if (!owner) return { target: null, appearance: 'light' }
  const normalTarget = scope?.querySelector('.atlas-wb-editor') ?? scope ?? owner.body
  const target = fullscreen && scope?.contains(fullscreen) && !fullscreen.contains(normalTarget) ? fullscreen : normalTarget
  return { target, appearance: appearance?.resolvedAppearance ?? 'light' }
}

/** Own-document portal, inside this editor's fullscreen element when applicable. */
export function EditorPortal({ children }) {
  const { target, appearance } = useOverlayContainer()
  if (!target) return null
  return createPortal(<div className="atlas-wb-overlay-scope" data-appearance={appearance}>{children}</div>, target)
}

/** Radix portal (Dialog/Popover/DropdownMenu/Tooltip `.Portal`) bound to the editor's
 * container and appearance scope instead of the global document body. */
export function OverlayPortal({ portal: Portal, children, ...props }) {
  const { target, appearance } = useOverlayContainer()
  if (!target) return null
  return <Portal container={target} {...props}><div className="atlas-wb-overlay-scope" data-appearance={appearance}>{children}</div></Portal>
}

/** Radix layers portal into `.atlas-wb-overlay-scope`; panel focus management must not fight them. */
const fromOverlay = event => !!event.target?.closest?.('.atlas-wb-overlay-scope')

/** React 18 treats inert as an unknown attribute; React 19 treats it as boolean.
 * Set the native attribute before paint so both releases behave identically. */
export function usePanelInert(ref, closed) {
  useFocusEffect(() => { ref.current?.toggleAttribute('inert', !!closed) }, [ref, closed])
}

/** Focus containment, Escape and focus return, scoped to the modal's document. */
export function useDialogFocus(ref, onClose, enabled = true, returnFocusRef) {
  const close = useRef(onClose)
  useFocusEffect(() => { close.current = onClose }, [onClose])
  useFocusEffect(() => {
    const element = ref.current
    if (!element || !enabled) return
    const owner = element.ownerDocument
    const previous = returnFocusRef?.current ?? owner.activeElement
    const stack = focusStacks.get(owner) ?? []
    focusStacks.set(owner, stack)
    stack.push(element)
    const focusables = () => [...element.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(node => !node.closest('[hidden], [inert]') && node.getAttribute('type') !== 'hidden')
    const focus = () => (focusables()[0] ?? element).focus()
    focus()
    function onKey(event) {
      if (stack.at(-1) !== element || fromOverlay(event)) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current?.(); return }
      if (event.key !== 'Tab') return
      const items = focusables(), index = items.indexOf(owner.activeElement)
      if (!items.length) { event.preventDefault(); element.focus() }
      else if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus() }
      else if (!event.shiftKey && (index === items.length - 1 || index < 0)) { event.preventDefault(); items[0].focus() }
    }
    function onFocus(event) { if (stack.at(-1) === element && !element.contains(event.target) && !fromOverlay(event)) focus() }
    owner.addEventListener('keydown', onKey)
    owner.addEventListener('focusin', onFocus)
    return () => {
      owner.removeEventListener('keydown', onKey)
      owner.removeEventListener('focusin', onFocus)
      stack.splice(stack.lastIndexOf(element), 1)
      if (previous?.isConnected) previous.focus()
    }
  }, [ref, enabled, returnFocusRef])
}
