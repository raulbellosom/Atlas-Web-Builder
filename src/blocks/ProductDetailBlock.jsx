import { useState } from 'react'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar } from './_tokens.js'
import { useResources, ResourceView } from '../resources/useResources.jsx'
import { formatPrice, productImages } from '../commerce/format.js'
import { useCart } from '../commerce/useCart.js'
import { Img, buttonStyle, inputStyle, rootStyle } from '../commerce/ui.jsx'

/** Variant whose options match every selected value, if any. */
export function findVariant(product, selected) {
  return (product.variants || []).find((v) => Object.keys(selected).every((k) => (v.options || {})[k] === selected[k]))
}

function Detail({ product, currency, locale, showStock, addLabel, edit, cart }) {
  const options = product.options || []
  const [selected, setSelected] = useState(() => Object.fromEntries(options.map((o) => [o.name, o.values[0]])))
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [added, setAdded] = useState(false)
  const images = productImages(product)
  const variant = options.length ? findVariant(product, selected) : undefined
  const price = variant && variant.price !== undefined ? variant.price : product.price
  const stock = variant ? variant.stock : product.stock
  const soldOut = stock === 0
  const fmt = { currency: product.currency || currency, locale }
  const unavailable = options.length > 0 && (product.variants || []).length > 0 && !variant
  const max = typeof stock === 'number' ? Math.max(1, stock) : 99
  const img = images[active]

  const add = async () => {
    await cart.add({ productId: product.id, variantId: variant && variant.id, quantity: qty, product: { ...product, price } })
    setAdded(true)
  }

  return (
    <article style={{ ...rootStyle, display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div style={{ display: 'grid', gap: 10 }}>
        <Img src={img && img.src} alt={(img && img.alt) || product.title} aspectRatio="1 / 1" />
        {images.length > 1 && (
          <div role="group" aria-label="Galería" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {images.map((im, i) => (
              <button key={im.src} type="button" aria-label={`Imagen ${i + 1}`} aria-pressed={i === active} onClick={() => setActive(i)} style={{ width: 64, padding: 0, border: `2px solid ${i === active ? colorVar('primary', '#0F62FE') : 'transparent'}`, background: 'none', cursor: 'pointer', borderRadius: 8 }}>
                <Img src={im.src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <h2 style={{ margin: 0 }}>{product.title}</h2>
        <div style={{ fontSize: 'var(--atlas-fontSize-xl, 1.5rem)' }}>
          <strong>{formatPrice(price, fmt)}</strong>
          {product.compareAtPrice > price && <s style={{ marginLeft: 10, opacity: 0.6, fontSize: '0.8em' }}>{formatPrice(product.compareAtPrice, fmt)}</s>}
        </div>
        {showStock && (
          <span role="status" style={{ color: soldOut ? colorVar('danger', '#DC2626') : colorVar('fg', 'inherit') }}>
            {soldOut ? 'Agotado' : typeof stock === 'number' && stock <= 5 ? `Quedan ${stock} piezas` : 'Disponible'}
          </span>
        )}
        {product.description && <p style={{ margin: 0 }}>{product.description}</p>}
        {options.map((o) => (
          <label key={o.name} style={{ display: 'grid', gap: 4 }}>
            {o.name}
            <select value={selected[o.name]} disabled={edit} onChange={(e) => { setSelected((s) => ({ ...s, [o.name]: e.target.value })); setAdded(false) }} style={inputStyle}>
              {o.values.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
        ))}
        <label style={{ display: 'grid', gap: 4, maxWidth: 120 }}>
          Cantidad
          <input type="number" min={1} max={max} value={qty} disabled={edit} onChange={(e) => setQty(Math.min(max, Math.max(1, Math.floor(Number(e.target.value)) || 1)))} style={inputStyle} />
        </label>
        <button type="button" disabled={edit || soldOut || unavailable || cart.busy} onClick={add} style={buttonStyle({ disabled: edit || soldOut || unavailable })}>
          {soldOut ? 'Agotado' : unavailable ? 'Combinación no disponible' : addLabel}
        </button>
        <div role="status" aria-live="polite" style={{ minHeight: 20 }}>
          {added && !cart.error && 'Agregado al carrito.'}
          {cart.error && <span role="alert" style={{ color: colorVar('danger', '#DC2626') }}>No se pudo agregar al carrito.</span>}
        </div>
      </div>
    </article>
  )
}

function ProductDetailView({ ctx, productId, currency, locale, showStock, addLabel }) {
  const resources = useResources(ctx)
  const edit = ctx.mode === 'edit'
  const cart = useCart(resources, { preview: edit, currency })
  return (
    <ResourceView resources={resources} path="product" params={productId || 'sample-1'} skip={!productId && !edit} empty={<p style={{ padding: 16 }}>Producto no encontrado.</p>}>
      {(product) => <Detail key={product.id} product={product} currency={currency} locale={locale} showStock={showStock} addLabel={addLabel} edit={edit} cart={cart} />}
    </ResourceView>
  )
}

/** Single product from `resources.product(idOrSlug)`: gallery, variants, stock and add to cart. */
export const ProductDetailBlock = defineBlock({
  type: 'ProductDetailBlock',
  label: 'Detalle de producto',
  category: 'commerce',
  icon: 'product',
  resources: ['product'],
  defaultProps: { productId: '', currency: 'MXN', locale: 'es-MX', showStock: true, addLabel: 'Agregar al carrito' },
  fields: {
    productId: { type: 'text', label: 'Producto (ID o slug)' },
    currency: { type: 'text', label: 'Moneda (ISO)' },
    locale: { type: 'text', label: 'Idioma de formato' },
    showStock: { type: 'toggle', label: 'Mostrar disponibilidad' },
    addLabel: { type: 'text', label: 'Texto del botón' },
  },
  groups: [
    { label: 'Datos', fields: ['productId'] },
    { label: 'Contenido', fields: ['showStock', 'addLabel'] },
    { label: 'Formato', fields: ['currency', 'locale'] },
  ],
  render: (props) => <ProductDetailView {...props} />,
})
