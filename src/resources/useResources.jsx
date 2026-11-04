import { createContext, useContext, useMemo } from 'react'
import { useResource } from '../renderer/useResource.js'
import { ResourceBoundary } from '../renderer/ResourceBoundary.jsx'
import { resolveHandler } from './contract.js'
import { sampleResources } from './sample.js'

const ResourcesContext = createContext(undefined)

/** Optional provider so custom blocks outside the renderer share one resources object. */
export const ResourcesProvider = ResourcesContext.Provider

/**
 * Resources visible to a block: `ctx.resources` (or the provider value). In
 * editor mode, sample handlers fill any missing catalog resource.
 *
 * @param {{mode?:string, resources?:Object}} [ctx]
 * @returns {import('./contract.js').Resources}
 */
export function useResources(ctx) {
  const fromContext = useContext(ResourcesContext)
  const base = (ctx && ctx.resources) || fromContext
  const edit = !!ctx && ctx.mode === 'edit'
  return useMemo(() => (edit ? { ...sampleResources, ...base } : base || {}), [base, edit])
}

const SKIP = () => undefined

/**
 * Call a (possibly nested) resource handler and track its state. Same state
 * shape as `useResource`; `skip` yields an idle state without calling anything.
 */
export function useResourceCall(resources, path, params, { skip = false } = {}) {
  const fetcher = skip ? SKIP : resolveHandler(resources, path)
  const state = useResource({ [path]: fetcher }, path, params)
  return skip ? { data: undefined, loading: false, error: null, empty: false } : state
}

function DefaultLoading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" style={{ padding: 16, opacity: 0.6 }}>
      Cargando…
    </div>
  )
}

/**
 * Consistent loading / empty / error rendering for a resource call, built on
 * ResourceBoundary. `children(data)` renders the ready state.
 *
 * @param {{
 *   resources: Object, path: string, params?: unknown, skip?: boolean,
 *   select?: (data:any)=>any, isEmpty?: (data:any)=>boolean,
 *   loading?: React.ReactNode, empty?: React.ReactNode, error?: (e:Error)=>React.ReactNode,
 *   children: (data:any)=>React.ReactNode,
 * }} props
 */
export function ResourceView({
  resources,
  path,
  params,
  skip,
  select,
  isEmpty,
  loading,
  empty,
  error,
  children,
}) {
  const fetcher = skip ? SKIP : resolveHandler(resources, path)
  const ctx = useMemo(() => ({ resources: { [path]: fetcher } }), [path, fetcher])
  return (
    <ResourceBoundary ctx={ctx} resource={path} query={params}>
      {(s) => {
        if (skip) return null
        if (s.loading) return loading ?? <DefaultLoading />
        if (s.error) {
          return error ? (
            error(s.error)
          ) : (
            <div role="alert" style={{ padding: 16, color: 'var(--atlas-color-danger, #DC2626)' }}>
              No se pudo cargar la información.
            </div>
          )
        }
        const data = select ? select(s.data) : s.data
        if (isEmpty ? isEmpty(data) : s.empty) {
          return empty ?? <div style={{ padding: 16, opacity: 0.7 }}>No hay elementos para mostrar.</div>
        }
        return children(data)
      }}
    </ResourceBoundary>
  )
}
