import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { getCartStore } from './cartStore.js'
import { SAMPLE_CART } from '../resources/sample.js'

const noop = async () => {}
const PREVIEW = {
  cart: SAMPLE_CART,
  loading: false,
  busy: false,
  error: null,
  count: 3,
  add: noop,
  update: noop,
  remove: noop,
  checkout: noop,
  refresh: noop,
}

/**
 * Cart state shared by every cart block on the page. Wraps `resources.cart`
 * (optimistic updates, rollback on error) or a local fallback store.
 * `preview` (editor mode) returns static sample data and never touches a store.
 *
 * @param {import('../resources/contract.js').Resources} resources
 * @param {{ preview?: boolean, currency?: string, navigate?: (url:string)=>void }} [opts]
 */
export function useCart(resources, { preview = false, currency, navigate } = {}) {
  const store = useMemo(() => getCartStore(resources, { currency, navigate }), [resources, currency, navigate])
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  useEffect(() => {
    if (!preview) store.init()
  }, [store, preview])
  return useMemo(
    () =>
      preview
        ? PREVIEW
        : {
            ...state,
            count: state.cart.items.reduce((n, l) => n + l.quantity, 0),
            add: store.add,
            update: store.update,
            remove: store.remove,
            checkout: store.checkout,
            refresh: () => store.init(),
          },
    [preview, state, store],
  )
}
