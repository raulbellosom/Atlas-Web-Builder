/**
 * @file Typed `resources` host contract for data-driven blocks. The package
 * never calls a backend: the host supplies handlers, blocks only consume them.
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} [slug]
 * @property {string} title
 * @property {string} [description]
 * @property {number} price
 * @property {number} [compareAtPrice]
 * @property {string} [currency]
 * @property {Array<string|{src:string,alt?:string}>} [images]
 * @property {string} [categoryId]
 * @property {number|null} [stock]  Units left; null/undefined = untracked.
 * @property {Array<{name:string,values:string[]}>} [options]
 * @property {Array<{id:string,options:Object<string,string>,price?:number,stock?:number|null}>} [variants]
 *
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} [slug]
 * @property {string} [image]
 * @property {number} [count]
 *
 * @typedef {Object} ProductQuery
 * @property {string} [categoryId]
 * @property {number} [limit]
 * @property {string} [query]
 * @property {number} [page]   1-based.
 * @property {string} [sort]   'default' | 'price-asc' | 'price-desc' | 'name'.
 *
 * @typedef {Object} FormField
 * @property {string} [name]
 * @property {string} label
 * @property {'text'|'email'|'tel'|'textarea'|'select'|'checkbox'|'radio'|'date'|'number'} [type]
 * @property {boolean} [required]
 * @property {Array<string|{value:string,label:string}>} [options]
 * @property {string} [placeholder]
 *
 * @typedef {Object} FormSchema
 * @property {string} [title]
 * @property {FormField[]} fields
 * @property {string} [submitLabel]
 * @property {string} [successMessage]
 * @property {string} [redirectUrl]
 *
 * @typedef {Object} CartLine
 * @property {string} id         Line id (host-defined).
 * @property {string} productId
 * @property {string} [variantId]
 * @property {string} title
 * @property {number} price      Unit price.
 * @property {number} quantity
 * @property {string} [image]
 *
 * @typedef {Object} Cart
 * @property {CartLine[]} items
 * @property {number} [subtotal]
 * @property {number} [discount]   Positive amount subtracted from the subtotal.
 * @property {number} [total]
 * @property {string} [currency]
 *
 * @typedef {Object} CartApi
 * @property {() => Promise<Cart>|Cart} get
 * @property {(line:{productId:string,variantId?:string,quantity:number,product?:Product}) => Promise<Cart|void>} add
 * @property {(lineId:string, quantity:number) => Promise<Cart|void>} update
 * @property {(lineId:string) => Promise<Cart|void>} remove
 * @property {() => Promise<{redirectUrl?:string}|void>} checkout
 *
 * @typedef {Object} Resources
 * @property {(q?:ProductQuery) => Promise<Product[]|{items:Product[],total?:number}>} [products]
 * @property {() => Promise<Category[]>} [categories]
 * @property {(idOrSlug:string) => Promise<Product>} [product]
 * @property {{get:(formId:string)=>Promise<FormSchema>, submit:(formId:string, values:Object)=>Promise<{redirectUrl?:string}|void>}} [forms]
 * @property {CartApi} [cart]
 * @property {unknown} [bookings]  Opaque; reserved for host booking blocks.
 * @property {{getItem:(k:string)=>string|null, setItem:(k:string,v:string)=>void}} [cartStorage]
 */

const FN = 'function'

/** Expected shape; object entries are validated member by member when present. */
export const RESOURCE_SHAPE = {
  products: FN,
  categories: FN,
  product: FN,
  forms: { get: FN, submit: FN },
  cart: { get: FN, add: FN, update: FN, remove: FN, checkout: FN },
  cartStorage: { getItem: FN, setItem: FN },
}

function check(value, shape, path, problems) {
  if (shape === FN) {
    if (typeof value !== FN) problems.push(`${path} must be a function`)
    return
  }
  if (value === null || typeof value !== 'object') {
    problems.push(`${path} must be an object`)
    return
  }
  for (const key of Object.keys(shape)) {
    if (key in value) check(value[key], shape[key], `${path}.${key}`, problems)
  }
}

/**
 * Identity helper that validates the shape of host handlers in development.
 * Unknown keys are allowed so custom `ctx.resource('name')` fetchers still work.
 *
 * @param {Resources & Object<string, unknown>} handlers
 * @returns {Resources & Object<string, unknown>}
 */
export function defineResources(handlers) {
  if (handlers === null || typeof handlers !== 'object') {
    throw new TypeError('defineResources: handlers must be an object')
  }
  const prod = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production'
  if (!prod) {
    const problems = []
    for (const key of Object.keys(RESOURCE_SHAPE)) {
      if (key in handlers) check(handlers[key], RESOURCE_SHAPE[key], key, problems)
    }
    if (problems.length) {
      throw new TypeError(`defineResources: invalid handlers:\n - ${problems.join('\n - ')}`)
    }
  }
  return handlers
}

/**
 * Walk a dotted path (`'forms.get'`) in a resources object.
 *
 * @param {Object|undefined|null} resources
 * @param {string} path
 * @returns {Function|undefined}
 */
export function resolveHandler(resources, path) {
  let cur = resources
  for (const part of path.split('.')) {
    if (cur === null || cur === undefined) return undefined
    cur = cur[part]
  }
  return typeof cur === FN ? cur : undefined
}

/**
 * Normalize a `products()` response (array or `{items,total}`).
 *
 * @param {unknown} data
 * @returns {{items: Product[], total: number|undefined}}
 */
export function normalizeList(data) {
  if (Array.isArray(data)) return { items: data, total: undefined }
  if (data && Array.isArray(data.items)) return { items: data.items, total: data.total }
  return { items: [], total: 0 }
}
