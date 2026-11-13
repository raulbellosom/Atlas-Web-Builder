import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const AppearanceContext = createContext(null)
const modes = ['light', 'dark', 'system']

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
    <div className="atlas-wb-editor-scope" ref={scopeRef} data-appearance={resolvedAppearance} data-appearance-mode={mode}>
      {children}
    </div>
  </AppearanceContext.Provider>
}

export function useEditorAppearance() { return useContext(AppearanceContext) }

/** Own-document portal, inside this editor's fullscreen element when applicable. */
export function EditorPortal({ children }) {
  const appearance = useEditorAppearance()
  const scope = appearance?.scopeRef.current
  const owner = scope?.ownerDocument ?? (typeof document === 'undefined' ? null : document)
  const [fullscreen, setFullscreen] = useState(owner?.fullscreenElement)
  useEffect(() => {
    if (!owner) return
    const update = () => setFullscreen(owner.fullscreenElement)
    owner.addEventListener('fullscreenchange', update)
    return () => owner.removeEventListener('fullscreenchange', update)
  }, [owner])
  if (!owner) return null
  const target = fullscreen && scope && (fullscreen.contains(scope) || scope.contains(fullscreen))
    ? fullscreen : scope ?? owner.body
  return createPortal(<div className="atlas-wb-overlay-scope" data-appearance={appearance?.resolvedAppearance ?? 'light'}>{children}</div>, target)
}

/** Focus containment, Escape and focus return, scoped to the modal's document. */
export function useDialogFocus(ref, onClose) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const owner = element.ownerDocument
    const previous = owner.activeElement
    const focusables = () => [...element.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(node => !node.closest('[hidden], [inert]') && node.getAttribute('type') !== 'hidden')
    const focus = () => (focusables()[0] ?? element).focus()
    focus()
    function onKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current?.(); return }
      if (event.key !== 'Tab') return
      const items = focusables(), index = items.indexOf(owner.activeElement)
      if (!items.length) { event.preventDefault(); element.focus() }
      else if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1).focus() }
      else if (!event.shiftKey && (index === items.length - 1 || index < 0)) { event.preventDefault(); items[0].focus() }
    }
    function onFocus(event) { if (!element.contains(event.target)) focus() }
    owner.addEventListener('keydown', onKey)
    owner.addEventListener('focusin', onFocus)
    return () => {
      owner.removeEventListener('keydown', onKey)
      owner.removeEventListener('focusin', onFocus)
      if (previous?.isConnected) previous.focus()
    }
  }, [ref])
}
