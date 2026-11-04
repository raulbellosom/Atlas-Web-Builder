import { defineBlock } from '../registry/createBlockRegistry.js'
import { useResources } from '../resources/useResources.jsx'
import { formatPrice } from '../commerce/format.js'
import { useCart } from '../commerce/useCart.js'
import { buttonStyle, rootStyle } from '../commerce/ui.jsx'
import { CartTotals, CartStatus } from './CartBlock.jsx'

function CheckoutSummaryView({ ctx, title, currency, locale, checkoutLabel, note, showItems }) {
  const resources = useResources(ctx)
  const edit = ctx.mode === 'edit'
  const state = useCart(resources, { preview: edit, currency })
  const { cart } = state
  const fmt = { currency: cart.currency || currency, locale }
  return (
    <aside style={{ ...rootStyle, display: 'grid', gap: 12 }} aria-label={title}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {showItems && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
          {cart.items.map((l) => (
            <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span>{l.title} x {l.quantity}</span>
              <span>{formatPrice(l.price * l.quantity, fmt)}</span>
            </li>
          ))}
        </ul>
      )}
      <CartTotals cart={cart} fmt={fmt} />
      <CartStatus cart={state} />
      <button type="button" disabled={edit || state.busy || cart.items.length === 0} onClick={() => state.checkout()} style={buttonStyle({ disabled: edit || state.busy || cart.items.length === 0, full: true })}>
        {checkoutLabel}
      </button>
      {note && <small style={{ opacity: 0.7 }}>{note}</small>}
    </aside>
  )
}

/** Order summary with totals and a checkout button (calls `resources.cart.checkout()`). */
export const CheckoutSummaryBlock = defineBlock({
  type: 'CheckoutSummaryBlock',
  label: 'Resumen de compra',
  category: 'commerce',
  icon: 'receipt',
  resources: ['cart'],
  defaultProps: { title: 'Resumen del pedido', currency: 'MXN', locale: 'es-MX', checkoutLabel: 'Continuar al pago', note: '', showItems: true },
  fields: {
    title: { type: 'text', label: 'Título' },
    currency: { type: 'text', label: 'Moneda (ISO)' },
    locale: { type: 'text', label: 'Idioma de formato' },
    checkoutLabel: { type: 'text', label: 'Texto del botón' },
    note: { type: 'text', label: 'Nota' },
    showItems: { type: 'toggle', label: 'Mostrar artículos' },
  },
  groups: [
    { label: 'Contenido', fields: ['title', 'checkoutLabel', 'note', 'showItems'] },
    { label: 'Formato', fields: ['currency', 'locale'] },
  ],
  render: (props) => <CheckoutSummaryView {...props} />,
})
