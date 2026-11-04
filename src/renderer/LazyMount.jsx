import { useEffect, useRef, useState } from 'react'

/**
 * Defers rendering of `children` until the placeholder is near the viewport.
 * Falls back to immediate render without IntersectionObserver (SSR, old
 * browsers). The placeholder keeps `minHeight` to avoid layout shift.
 *
 * @param {{ minHeight?: number, rootMargin?: string, children: React.ReactNode }} props
 */
export function LazyMount({ minHeight = 240, rootMargin = '300px 0px', children }) {
  const supported = typeof IntersectionObserver !== 'undefined'
  const [visible, setVisible] = useState(!supported)
  const ref = useRef(null)

  useEffect(() => {
    if (visible || !ref.current) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [visible, rootMargin])

  if (visible) return children
  return <div ref={ref} data-atlas-lazy="pending" style={{ minHeight }} aria-hidden="true" />
}
