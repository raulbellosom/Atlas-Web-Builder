import { useState } from 'react'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar } from './_tokens.js'
import { useResources } from '../resources/useResources.jsx'
import { useCart } from '../commerce/useCart.js'
import { buttonStyle, rootStyle } from '../commerce/ui.jsx'

function AddToCartView({ ctx, productId, variantId, quantity, label, addedLabel, variant, align }) {
  const resources = useResources(ctx)
  const edit = ctx.mode === 'edit'
  const cart = useCart(resources, { preview: edit })
  const [added, setAdded] = useState(false)
  const disabled = edit || !productId || cart.busy

  const click = async () => {
    // The local fallback cart needs title/price; a host cart resolves them itself.
    let product
    if (!resources.cart && typeof resources.product === 'function') {
      try {
        product = await resources.product(productId)
      } catch {
        /* add without product details */
      }
    }
    await cart.add({ productId, variantId: variantId || undefined, quantity: Math.max(1, Number(quantity) || 1), product })
    setAdded(true)
  }

  return (
    <div style={{ ...rootStyle, textAlign: align === 'full' ? undefined : align }}>
      <button type="button" disabled={disabled} onClick={click} style={buttonStyle({ variant, disabled, full: align === 'full' })}>
        {added && !cart.error ? addedLabel : label}
      </button>
      <div role="status" aria-live="polite" style={{ minHeight: 18, fontSize: 'var(--atlas-fontSize-sm, 0.875rem)' }}>
        {cart.error && <span style={{ color: colorVar('danger', '#DC2626') }}>No se pudo agregar al carrito.</span>}
      </div>
    </div>
  )
}

/** Adds one product (and optional variant) to the cart. */
export const AddToCartButtonBlock = defineBlock({
  type: 'AddToCartButtonBlock',
  label: 'Botón agregar al carrito',
  category: 'commerce',
  icon: 'cart',
  resources: ['cart', 'product'],
  defaultProps: { productId: '', variantId: '', quantity: 1, label: 'Agregar al carrito', addedLabel: 'Agregado', variant: 'solid', align: 'left' },
  fields: {
    productId: { type: 'text', label: 'Producto (ID)' },
    variantId: { type: 'text', label: 'Variante (ID, opcional)' },
    quantity: { type: 'number', label: 'Cantidad' },
    label: { type: 'text', label: 'Texto del botón' },
    addedLabel: { type: 'text', label: 'Texto tras agregar' },
    variant: { type: 'select', label: 'Estilo', options: [{ value: 'solid', label: 'Sólido' }, { value: 'outline', label: 'Contorno' }] },
    align: { type: 'select', label: 'Alineación', options: [{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }, { value: 'full', label: 'Ancho completo' }] },
  },
  groups: [
    { label: 'Datos', fields: ['productId', 'variantId', 'quantity'] },
    { label: 'Contenido', fields: ['label', 'addedLabel'] },
    { label: 'Estilo', fields: ['variant', 'align'] },
  ],
  render: (props) => <AddToCartView {...props} />,
})
