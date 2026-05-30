import clsx from 'clsx'
import { useNotifications } from './NotificationsProvider.jsx'
import { es } from '../i18n/es.js'

/**
 * Floating list of toast notifications. Renders absolutely positioned in
 * the editor shell; relies on the toast classes defined in editor.css.
 */
export function NotificationCenter() {
  const { items, dismiss } = useNotifications()
  if (!items.length) return null
  return (
    <div
      className="atlas-wb-toasts"
      role="region"
      aria-live="polite"
      aria-label={es.notifications.region}
    >
      {items.map((n) => (
        <div
          key={n.id}
          className={clsx('atlas-wb-toast', `atlas-wb-toast--${n.level}`)}
          role={n.level === 'error' ? 'alert' : 'status'}
        >
          <span className="atlas-wb-toast__message">{n.message}</span>
          <button
            type="button"
            className="atlas-wb-toast__close"
            onClick={() => dismiss(n.id)}
            aria-label={es.notifications.dismiss}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
