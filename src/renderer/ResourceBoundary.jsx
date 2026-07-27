import { useResource } from './useResource.js'

/**
 * @typedef {Object} ResourceBoundaryRenderProps
 * @property {unknown}    data
 * @property {boolean}    loading
 * @property {Error|null} error
 * @property {boolean}    empty
 */

/**
 * Render-prop alternative to `ctx.resource()`. Must be rendered inside a
 * block's `render` function, passing that block's own `ctx` through, so it
 * resolves against the correctly-scoped `ctx.resources` (host resources in
 * public/preview mode, `mockResources` in edit mode).
 *
 * @param {{
 *   ctx: { resources?: Object<string, Function> },
 *   resource: string,
 *   query?: unknown,
 *   children: (state: ResourceBoundaryRenderProps) => React.ReactNode,
 * }} props
 */
export function ResourceBoundary({ ctx, resource, query, children }) {
  const state = useResource(ctx ? ctx.resources : undefined, resource, query)
  return typeof children === 'function' ? children(state) : null
}
