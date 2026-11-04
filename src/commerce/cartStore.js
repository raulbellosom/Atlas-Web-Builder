/**
 * @file Cart state: wraps `resources.cart` with optimistic updates, or falls
 * back to a local store (in-memory + optional storage adapter) for demos.
 * No payment logic: checkout only calls the host and follows its redirect.
 */
import { followRedirect } from '../resources/navigate.js'

const EMPTY = { items: [], subtotal: 0, discount: 0, total: 0, currency: undefined }
const STORAGE_KEY = 'atlas-wb-cart'

/** Recompute subtotal/total from lines, keeping the host discount. */
export function withTotals(cart) {
  const items = (cart && cart.items) || []
  const subtotal = items.reduce((s, l) => s + Number(l.price) * Number(l.quantity), 0)
  const discount = Number(cart && cart.discount) || 0
  return { ...cart, items, subtotal, discount, total: Math.max(0, subtotal - discount) }
}

export const lineId = (productId, variantId) => `${productId}:${variantId || ''}`

function applyAdd(cart, { productId, variantId, quantity = 1, product }) {
  const id = lineId(productId, variantId)
  const items = [...cart.items]
  const i = items.findIndex((l) => l.id === id)
  if (i >= 0) items[i] = { ...items[i], quantity: items[i].quantity + quantity }
  else {
    const img = product && (product.image || (product.images && (product.images[0].src || product.images[0])))
    items.push({ id, productId, variantId, title: product ? product.title : productId, price: product ? Number(product.price) : 0, quantity, image: img })
  }
  return withTotals({ ...cart, items })
}

function applyUpdate(cart, id, quantity) {
  if (quantity <= 0) return applyRemove(cart, id)
  return withTotals({ ...cart, items: cart.items.map((l) => (l.id === id ? { ...l, quantity } : l)) })
}

function applyRemove(cart, id) {
  return withTotals({ ...cart, items: cart.items.filter((l) => l.id !== id) })
}

/**
 * @param {{ api?: import('../resources/contract.js').CartApi,
 *   storage?: {getItem:Function,setItem:Function}, currency?: string,
 *   navigate?: (url:string)=>void }} opts
 */
export function createCartStore({ api, storage, currency, navigate } = {}) {
  const listeners = new Set()
  let state = { cart: withTotals({ ...EMPTY, currency }), loading: false, busy: false, error: null }
  let loaded = false

  const emit = (patch) => {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  }
  const persist = (cart) => {
    if (api || !storage) return
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(cart.items))
    } catch {
      /* storage unavailable: stay in memory */
    }
  }
  // Host-provided totals (taxes, shipping) win over the recomputed ones.
  const adopt = (res) => {
    if (!res || !Array.isArray(res.items)) return null
    const host = {}
    for (const k of ['subtotal', 'discount', 'total']) if (typeof res[k] === 'number') host[k] = res[k]
    return { currency, ...withTotals(res), ...host }
  }

  // Optimistic mutation: show `next` now, reconcile with the host, roll back on failure.
  async function mutate(next, call) {
    const prev = state.cart
    emit({ cart: next, busy: true, error: null })
    persist(next)
    if (!api) return emit({ busy: false })
    try {
      const res = await call()
      const fresh = adopt(res) || (api.get ? adopt(await api.get()) : null)
      emit({ cart: fresh || next, busy: false })
    } catch (error) {
      emit({ cart: prev, busy: false, error })
    }
  }

  return {
    subscribe(l) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    getState: () => state,
    async init() {
      if (loaded) return
      loaded = true
      if (api && api.get) {
        emit({ loading: true })
        try {
          emit({ cart: adopt(await api.get()) || state.cart, loading: false })
        } catch (error) {
          emit({ loading: false, error })
        }
      } else if (storage) {
        try {
          const items = JSON.parse(storage.getItem(STORAGE_KEY) || '[]')
          if (Array.isArray(items)) emit({ cart: withTotals({ ...state.cart, items }) })
        } catch {
          /* corrupt storage: ignore */
        }
      }
    },
    add: (line) => mutate(applyAdd(state.cart, line), () => api.add(line)),
    update: (id, quantity) => mutate(applyUpdate(state.cart, id, quantity), () => (quantity <= 0 ? api.remove(id) : api.update(id, quantity))),
    remove: (id) => mutate(applyRemove(state.cart, id), () => api.remove(id)),
    async checkout() {
      if (!api || !api.checkout) {
        emit({ error: new Error('El pago no está conectado.') })
        return false
      }
      emit({ busy: true, error: null })
      try {
        const res = await api.checkout()
        emit({ busy: false })
        return followRedirect(res && (res.redirectUrl || res.url), navigate) || true
      } catch (error) {
        emit({ busy: false, error })
        return false
      }
    },
  }
}

const stores = new WeakMap()
const DEFAULT_KEY = {}

/** One shared store per cart API (or per resources object for the local fallback). */
export function getCartStore(resources, opts = {}) {
  const key = (resources && resources.cart) || (resources && Object.keys(resources).length ? resources : DEFAULT_KEY)
  let store = stores.get(key)
  if (!store) {
    store = createCartStore({ api: resources && resources.cart, storage: resources && resources.cartStorage, ...opts })
    stores.set(key, store)
  }
  return store
}

/** Storage adapter over `window.localStorage` for `resources.cartStorage`. */
export function localStorageAdapter() {
  return {
    getItem: (k) => window.localStorage.getItem(k),
    setItem: (k, v) => window.localStorage.setItem(k, v),
  }
}
