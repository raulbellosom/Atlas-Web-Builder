// One IntersectionObserver per threshold, shared by every animated block of a page: a page with dozens of reveals keeps a
// single observer instead of one per element. Pure browser API; callers guard for SSR/unsupported environments.
const registries = new Map()

function registry(threshold) {
  let entry = registries.get(threshold)
  if (entry) return entry
  const callbacks = new Map()
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) callbacks.get(target)?.(isIntersecting)
  }, { threshold })
  entry = { observer, callbacks }
  registries.set(threshold, entry)
  return entry
}

/** Calls `callback(isVisible)` whenever the element crosses the threshold. Returns the stop function. */
export function observeVisibility(element, threshold, callback) {
  const entry = registry(threshold)
  entry.callbacks.set(element, callback)
  entry.observer.observe(element)
  return () => {
    entry.observer.unobserve(element)
    entry.callbacks.delete(element)
    if (!entry.callbacks.size) { entry.observer.disconnect(); registries.delete(threshold) }
  }
}

/** Test hook: number of live observers. */
export const observerCount = () => registries.size
