import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

/**
 * @typedef {'info'|'success'|'warning'|'error'} NotificationLevel
 * @typedef {{ id: string, level: NotificationLevel, message: string, ttl: number }} NotificationItem
 */

const NotificationsContext = createContext(null)

/**
 * Hook for emitting and listing toast-style notifications. Use this inside
 * editor chrome components to surface results of long-running or
 * error-prone operations (import, publish, etc.).
 *
 * @returns {{
 *   items: NotificationItem[],
 *   notify: (level: NotificationLevel, message: string, ttl?: number) => string,
 *   dismiss: (id: string) => void,
 *   clear: () => void,
 * }}
 */
export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used inside <NotificationsProvider>')
  }
  return ctx
}

/**
 * Sequential id generator local to the notification system. Stable enough
 * for React keys; we don't need cryptographic randomness here.
 */
let seq = 0
function nextId() {
  seq += 1
  return `ntf_${seq}`
}

export function NotificationsProvider({ children, defaultTtl = 5000 }) {
  const [items, setItems] = useState(/** @type {NotificationItem[]} */ ([]))
  const timersRef = useRef(/** @type {Map<string, any>} */ (new Map()))

  const dismiss = useCallback((id) => {
    setItems((curr) => curr.filter((n) => n.id !== id))
    const t = timersRef.current.get(id)
    if (t) {
      clearTimeout(t)
      timersRef.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (level, message, ttl = defaultTtl) => {
      const id = nextId()
      const item = { id, level, message: String(message ?? ''), ttl }
      setItems((curr) => [...curr, item])
      if (ttl > 0 && typeof window !== 'undefined') {
        const t = window.setTimeout(() => dismiss(id), ttl)
        timersRef.current.set(id, t)
      }
      return id
    },
    [defaultTtl, dismiss],
  )

  const clear = useCallback(() => {
    for (const t of timersRef.current.values()) clearTimeout(t)
    timersRef.current.clear()
    setItems([])
  }, [])

  const value = useMemo(() => ({ items, notify, dismiss, clear }), [items, notify, dismiss, clear])
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
