# Data-driven blocks: forms, catalog and purchase flow

Date: 2026-11-03. Status: implemented (not published).

## Goal

Generic, host-agnostic blocks for forms, product catalogs and a purchase flow. The package never calls a backend: the host passes handlers in the `resources` prop (reaching blocks as `ctx.resources`), blocks only consume them. Hosts opt in; the blocks are not part of `baseBlocks`.

```jsx
import { baseBlocks, formBlocks, commerceBlocks } from '@raulbellosom/atlas-web-builder'
<AtlasWebBuilderEditor blocks={[...baseBlocks, ...formBlocks, ...commerceBlocks]} resources={resources} />
```

## Resources contract

All members are optional; blocks degrade to an error/empty state when one is missing. `defineResources(handlers)` validates shapes in development (throws a `TypeError` listing every problem; unknown custom keys are allowed, so `ctx.resource('custom')` keeps working).

| Resource | Signature | Notes |
|---|---|---|
| `products` | `({categoryId, limit, query, page, sort}) => Product[] \| {items, total?}` | `page` is 1-based; `total` enables accurate pagination |
| `categories` | `() => Category[]` | `{id, name, slug?, image?, count?}` |
| `product` | `(idOrSlug) => Product` | `{id, slug?, title, description?, price, compareAtPrice?, currency?, images?, stock?, options?, variants?}` |
| `forms.get` | `(formId) => {title?, fields[], submitLabel?, successMessage?, redirectUrl?}` | field: `{name?, label, type, required?, options?, placeholder?}` |
| `forms.submit` | `(formId, values) => {redirectUrl?} \| void` | reject to show an error message |
| `cart` | `{get, add, update, remove, checkout}` | `get()` returns `{items[], subtotal?, discount?, total?, currency?}`; mutators may return a cart or nothing (the store then calls `get()`); `checkout()` may return `{redirectUrl}` |
| `bookings` | opaque | reserved, untouched here |
| `cartStorage` | `{getItem, setItem}` | only used by the local fallback cart |

Example host:

```js
const resources = defineResources({
  products: ({ categoryId, query, limit, page }) => api.get('/products', { categoryId, q: query, limit, page }),
  categories: () => api.get('/categories'),
  product: (idOrSlug) => api.get(`/products/${idOrSlug}`),
  forms: {
    get: (id) => api.get(`/forms/${id}`),
    submit: (id, values) => api.post(`/forms/${id}/submissions`, values),
  },
  cart: {
    get: () => api.get('/cart'),
    add: ({ productId, variantId, quantity }) => api.post('/cart/lines', { productId, variantId, quantity }),
    update: (lineId, quantity) => api.patch(`/cart/lines/${lineId}`, { quantity }),
    remove: (lineId) => api.delete(`/cart/lines/${lineId}`),
    checkout: async () => ({ redirectUrl: (await api.post('/checkout')).paymentUrl }),
  },
  cartStorage: localStorageAdapter(), // only matters when `cart` is omitted (demos)
})
```

State handling is uniform: `useResourceCall(resources, 'forms.get', formId)` returns the `useResource` state; `ResourceView` (built on `ResourceBoundary`) renders loading / empty / error consistently. `useResource` and flat resource names are unchanged. In editor mode, `useResources(ctx)` fills missing `products`, `categories` and `product` with sample data, and all interactive controls are disabled.

## Blocks

Categories: `forms`, `commerce`. All editor labels are Spanish.

| Type | Props |
|---|---|
| `FormBlock` | `formId`, `title`, `fieldsDsl`, `submitLabel`, `successMessage`, `redirectUrl`, `consentEnabled`, `consentText`, `consentLinkLabel`, `consentHref` |
| `ProductGridBlock` | `layout` (grid/list), `columns`, `categoryId`, `showCategories`, `showSearch`, `showSort`, `pageSize`, `pagination` (loadMore/pages/none), `currency`, `locale`, `detailHref`, `showAddToCart`, `emptyText` |
| `ProductDetailBlock` | `productId`, `currency`, `locale`, `showStock`, `addLabel` |
| `CategoryListBlock` | `layout` (tiles/chips), `columns`, `showImage`, `showCount`, `hrefTemplate` |
| `AddToCartButtonBlock` | `productId`, `variantId`, `quantity`, `label`, `addedLabel`, `variant`, `align` |
| `CartBlock` | `title`, `currency`, `locale`, `emptyText`, `checkoutLabel`, `showDiscount`, `continueHref`, `continueLabel` |
| `CheckoutSummaryBlock` | `title`, `currency`, `locale`, `checkoutLabel`, `note`, `showItems` |

`FormBlock` DSL: one field per line, `Label | type | required | options` (types: text, email, tel, textarea, select, checkbox, radio, date, number; `required` accepts `*`, `req`, `required`, `si`; options comma separated; `#` comments). Validation is client side (required, email, tel, number, option membership); errors use `aria-invalid`/`aria-describedby`, status uses `aria-live`. A hidden honeypot field makes bots see a fake success. Submit is guarded against double clicks. Redirects (form or checkout) only follow `http(s)://` or same-site `/path` URLs.

## Cart

`useCart(resources, {preview, currency, navigate})` is backed by one shared store per `resources.cart`, so every cart block on the page stays in sync. Mutations are optimistic and roll back (setting `error`) if the host rejects; host totals win over recomputed ones. Without `resources.cart` a local store (memory, plus `resources.cartStorage` if given) lets templates work in demos. No payment logic: `checkout()` calls `resources.cart.checkout()` and follows a safe returned URL.

## Known limits

- Load-more grows `limit` and refetches instead of appending pages.
- Concurrent cart mutations roll back to the snapshot taken at the start of each one.
- Images use the shared `AtlasImage` through `src/commerce/ui.jsx` (single swap point).
