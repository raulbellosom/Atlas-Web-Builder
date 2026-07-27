import { useEffect, useState } from 'react'

/**
 * @typedef {Object} ResourceState
 * @property {unknown}    data
 * @property {boolean}    loading
 * @property {Error|null} error
 * @property {boolean}    empty
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isEmptyValue(value) {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * Fetch a host-registered resource by name and track its data/loading/error
 * state. Backs `ctx.resource()` and `<ResourceBoundary>`.
 *
 * Must be called unconditionally from a real function component — the same
 * rule as any other React hook. `ctx.resource()` works because block
 * `render` functions are invoked via JSX (`<Component ctx={ctx} />`), so
 * they are themselves function components and can call hooks in their body.
 *
 * @param {Object<string, Function>|undefined|null} resourcesMap - Usually `ctx.resources`.
 * @param {string} name - Key registered by the host in its `resources` prop.
 * @param {unknown} [params] - Arguments passed to the fetcher.
 * @returns {ResourceState}
 */
export function useResource(resourcesMap, name, params) {
  const fetcher = resourcesMap ? resourcesMap[name] : undefined
  const paramsKey = JSON.stringify(params ?? null)
  const [state, setState] = useState({ data: undefined, loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    if (typeof fetcher !== 'function') {
      setState({
        data: undefined,
        loading: false,
        error: new Error(`[atlas-web-builder] No resource registered for "${name}".`),
      })
      return undefined
    }

    setState({ data: undefined, loading: true, error: null })

    let result
    try {
      result = fetcher(params)
    } catch (syncError) {
      setState({ data: undefined, loading: false, error: syncError })
      return () => {
        cancelled = true
      }
    }

    Promise.resolve(result)
      .then((data) => {
        if (cancelled) return
        setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        setState({ data: undefined, loading: false, error })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, name, paramsKey])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    empty: !state.loading && !state.error && isEmptyValue(state.data),
  }
}
