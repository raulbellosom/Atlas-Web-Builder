/**
 * Format a money amount with Intl. Falls back to a plain number when the
 * currency/locale is invalid so a bad prop never breaks the page.
 */
export function formatPrice(amount, { currency = 'MXN', locale = 'es-MX' } = {}) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return ''
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n)
  } catch {
    return n.toFixed(2)
  }
}

/** Normalize a product's `images` / `image` into `[{src, alt}]`. */
export function productImages(product) {
  const raw = (product && (product.images || (product.image ? [product.image] : []))) || []
  return raw
    .map((i) => (typeof i === 'string' ? { src: i, alt: '' } : i))
    .filter((i) => i && i.src)
}

export function sortProducts(items, sort) {
  if (!sort || sort === 'default') return items
  const copy = [...items]
  if (sort === 'price-asc') copy.sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') copy.sort((a, b) => b.price - a.price)
  else if (sort === 'name') copy.sort((a, b) => String(a.title).localeCompare(String(b.title), 'es'))
  return copy
}
