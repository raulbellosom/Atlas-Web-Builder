/**
 * @file Phase-2 placeholder for the resource boundary. Real implementation
 * arrives in Phase 7 alongside the resources/actions providers.
 *
 * For now this component simply renders its children inside a wrapper so
 * blocks can already declare the API shape they expect later:
 *
 *   <ResourceBoundary resource="products" query={query}>
 *     {({ data, loading, error }) => ...}
 *   </ResourceBoundary>
 */

/**
 * @typedef {Object} ResourceBoundaryRenderProps
 * @property {unknown}        data
 * @property {boolean}        loading
 * @property {Error|null}     error
 * @property {boolean}        empty
 */

/**
 * @param {{
 *   resource: string,
 *   query?: unknown,
 *   children: (state: ResourceBoundaryRenderProps) => React.ReactNode,
 * }} props
 */
export function ResourceBoundary({ children }) {
  // Phase 7 will replace this with real loading/error/empty state handling
  // sourced from the host's registered resources or mockResources.
  const state = { data: null, loading: false, error: null, empty: true }
  return typeof children === 'function' ? children(state) : null
}
