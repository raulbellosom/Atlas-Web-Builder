import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar } from './_tokens.js'
import { useResources } from '../resources/useResources.jsx'
import { formatPrice } from '../commerce/format.js'
import { useCart } from '../commerce/useCart.js'
import { Img, buttonStyle, rootStyle } from '../commerce/ui.jsx'

/** Subtotal / discount / total rows (discount hidden when zero). */
export function CartTotals({ cart, fmt, showDiscount = true }) {
  const row = { display: 'flex', justifyContent: 'space-between', gap: 12 }
  return (
    <dl style={{ margin: 0, display: 'grid', gap: 6 }}>
      <div style={row}>
        <dt>Subtotal</dt>
        <dd style={{ margin: 0 }}>{formatPrice(cart.subtotal, fmt)}</dd>
      </div>
      {showDiscount && cart.discount > 0 && (
        <div style={row}>
          <dt>Descuento</dt>
          <dd style={{ margin: 0 }}>-{formatPrice(cart.discount, fmt)}</dd>
        </div>
      )}
      <div style={{ ...row, fontWeight: 700, fontSize: 'var(--atlas-fontSize-lg, 1.125rem)' }}>
        <dt>Total</dt>
        <dd style={{ margin: 0 }}>{formatPrice(cart.total, fmt)}</dd>
      </div>
    </dl>
  )
}

export function CartStatus({ cart }) {
  return (
    <div role="status" aria-live="polite" style={{ minHeight: 18, color: colorVar('danger', '#DC2626') }}>
      {cart.error && 'No se pudo completar la acción. Intenta de nuevo.'}
    </div>
  )
}

function CartView({ ctx, title, currency, locale, emptyText, checkoutLabel, showDiscount, continueHref, continueLabel }) {
  const resources = useResources(ctx)
  const edit = ctx.mode === 'edit'
  const state = useCart(resources, { preview: edit, currency })
  const { cart } = state
  const fmt = { currency: cart.currency || currency, locale }
  const stepper = { width: 32, height: 32, cursor: edit ? 'default' : 'pointer' }

  return (
    <section style={rootStyle} aria-label={title || 'Carrito'} aria-busy={state.loading || state.busy || undefined}>
      {title && <h2 style={{ marginTop: 0 }}>{title}</h2>}
      {state.loading ? (
        <div role="status">Cargando carrito…</div>
      ) : cart.items.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', opacity: 0.8 }}>
          <p>{emptyText}</p>
          {continueHref && <a href={continueHref} style={{ ...buttonStyle({ variant: 'outline' }), textDecoration: 'none' }}>{continueLabel}</a>}
        </div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
            {cart.items.map((l) => (
              <li key={l.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 12, alignItems: 'center' }}>
                <Img src={l.image} alt="" />
                <div>
                  <div style={{ fontWeight: 600 }}>{l.title}</div>
                  <div style={{ opacity: 0.7 }}>{formatPrice(l.price, fmt)}</div>
                  <div role="group" aria-label={`Cantidad de ${l.title}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <button type="button" aria-label={`Quitar una unidad de ${l.title}`} disabled={edit} onClick={() => state.update(l.id, l.quantity - 1)} style={stepper}>-</button>
                    <span aria-live="polite">{l.quantity}</span>
                    <button type="button" aria-label={`Agregar una unidad de ${l.title}`} disabled={edit} onClick={() => state.update(l.id, l.quantity + 1)} style={stepper}>+</button>
                    <button type="button" disabled={edit} onClick={() => state.remove(l.id)} style={{ marginLeft: 8, background: 'none', border: 0, color: colorVar('danger', '#DC2626'), cursor: 'pointer', font: 'inherit' }}>
                      Eliminar
                    </button>
                  </div>
                </div>
                <strong>{formatPrice(l.price * l.quantity, fmt)}</strong>
              </li>
            ))}
          </ul>
          <hr style={{ margin: '16px 0', border: 0, borderTop: `1px solid ${colorVar('border', '#E2E8F0')}` }} />
          <CartTotals cart={cart} fmt={fmt} showDiscount={showDiscount} />
          <CartStatus cart={state} />
          <button type="button" disabled={edit || state.busy} onClick={() => state.checkout()} style={{ ...buttonStyle({ disabled: edit || state.busy, full: true }), marginTop: 8 }}>
            {checkoutLabel}
          </button>
        </>
      )}
    </section>
  )
}

/** Cart lines with quantity stepper, remove, totals and checkout. */
export const CartBlock = defineBlock({
  type: 'CartBlock',
  label: 'Carrito',
  category: 'commerce',
  icon: 'cart',
  resources: ['cart'],
  defaultProps: {
    title: 'Tu carrito',
    currency: 'MXN',
    locale: 'es-MX',
    emptyText: 'Tu carrito está vacío.',
    checkoutLabel: 'Finalizar compra',
    showDiscount: true,
    continueHref: '/tienda',
    continueLabel: 'Seguir comprando',
  },
  fields: {
    title: { type: 'text', label: 'Título' },
    currency: { type: 'text', label: 'Moneda (ISO)' },
    locale: { type: 'text', label: 'Idioma de formato' },
    emptyText: { type: 'text', label: 'Texto de carrito vacío' },
    checkoutLabel: { type: 'text', label: 'Texto del botón de pago' },
    showDiscount: { type: 'toggle', label: 'Mostrar descuento' },
    continueHref: { type: 'link', label: 'Enlace seguir comprando' },
    continueLabel: { type: 'text', label: 'Texto seguir comprando' },
  },
  groups: [
    { label: 'Contenido', fields: ['title', 'emptyText', 'checkoutLabel', 'continueHref', 'continueLabel'] },
    { label: 'Formato', fields: ['currency', 'locale', 'showDiscount'] },
  ],
  render: (props) => <CartView {...props} />,
})
