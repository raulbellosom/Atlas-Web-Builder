import { useEffect, useState } from 'react'
import { useEditorAppearance } from './EditorAppearance.jsx'

/** Observe the editor, not the host's viewport: also works inside a narrow embed. */
export function useWorkspaceLayout() {
  const { scopeRef } = useEditorAppearance()
  const [width, setWidth] = useState(() => typeof window === 'undefined' ? 1440 : window.innerWidth)
  useEffect(() => {
    const scope = scopeRef.current, view = scope.ownerDocument.defaultView
    const resize = () => {
      setWidth(scope.getBoundingClientRect().width || view.innerWidth)
      scope.style.setProperty('--awb-viewport-height', `${view.visualViewport?.height ?? view.innerHeight}px`)
    }
    const Observer = view.ResizeObserver
    const observer = Observer ? new Observer(resize) : null
    observer?.observe(scope)
    resize(); view.addEventListener('resize', resize); view.visualViewport?.addEventListener('resize', resize)
    return () => { observer?.disconnect(); view.removeEventListener('resize', resize); view.visualViewport?.removeEventListener('resize', resize) }
  }, [scopeRef])
  return { compact: width <= 1100, phone: width <= 600, width }
}
