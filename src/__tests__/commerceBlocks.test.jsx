import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { formatPrice } from '../commerce/format.js'
import { createCartStore, withTotals } from '../commerce/cartStore.js'
import { ProductGridBlock } from '../blocks/ProductGridBlock.jsx'
import { ProductDetailBlock, findVariant } from '../blocks/ProductDetailBlock.jsx'
import { CategoryListBlock } from '../blocks/CategoryListBlock.jsx'
import { AddToCartButtonBlock } from '../blocks/AddToCartButtonBlock.jsx'
import { CartBlock } from '../blocks/CartBlock.jsx'
import { CheckoutSummaryBlock } from '../blocks/CheckoutSummaryBlock.jsx'

const P = (id, over = {}) => ({ id, title: `Prod ${id}`, price: 100, ...over })
const view = (block, props, resources, mode = 'view') => {
  const Comp = block.render
  return render(<Comp {...block.defaultProps} {...props} ctx={{ mode, resources, blockId: 'b' }} />)
}

describe('formatPrice', () => {
  it('uses Intl and survives bad currencies', () => {
    expect(formatPrice(1234.5, { currency: 'MXN', locale: 'es-MX' })).toMatch(/1,234\.50/)
    expect(formatPrice(5, { currency: 'nope' })).toBe('5.00')
    expect(formatPrice('x')).toBe('')
  })
})

describe('cart store', () => {
  const api = () => ({
    get: vi.fn(async () => ({ items: [] })),
    add: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    checkout: vi.fn(async () => ({ redirectUrl: 'https://pay.test/s' })),
  })

  it('local fallback adds, merges, updates, removes and persists', async () => {
    const mem = {}
    const storage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => (mem[k] = v) }
    const s = createCartStore({ storage })
    await s.add({ productId: 'a', quantity: 1, product: P('a', { price: 50 }) })
    await s.add({ productId: 'a', quantity: 2 })
    expect(s.getState().cart.items[0].quantity).toBe(3)
    expect(s.getState().cart.total).toBe(150)
    await s.update('a:', 1)
    await s.update('a:', 0)
    expect(s.getState().cart.items).toEqual([])
    const s2 = createCartStore({ storage })
    await s.add({ productId: 'b', product: P('b') })
    await s2.init()
    expect(s2.getState().cart.items[0].productId).toBe('b')
  })

  it('applies optimistically and rolls back when the host fails', async () => {
    const a = api()
    let fail
    a.add = vi.fn(() => new Promise((_, rej) => (fail = rej)))
    const s = createCartStore({ api: a })
    const p = s.add({ productId: 'a', quantity: 1, product: P('a') })
    expect(s.getState().cart.items).toHaveLength(1)
    fail(new Error('boom'))
    await p
    expect(s.getState().cart.items).toHaveLength(0)
    expect(s.getState().error.message).toBe('boom')
  })

  it('adopts host totals and follows the checkout redirect', async () => {
    const a = api()
    a.get = vi.fn(async () => ({ items: [{ id: 'l', productId: 'a', title: 'A', price: 10, quantity: 2 }], total: 17, discount: 3 }))
    const navigate = vi.fn()
    const s = createCartStore({ api: a, navigate })
    await s.init()
    expect(s.getState().cart.total).toBe(17)
    await s.checkout()
    expect(navigate).toHaveBeenCalledWith('https://pay.test/s')
    expect(withTotals({ items: [{ price: 5, quantity: 2 }], discount: 20 }).total).toBe(0)
  })
})

describe('catalog blocks', () => {
  it('ProductGrid shows skeleton, items, prices and filters by category', async () => {
    const products = vi.fn(async (q) => (q.categoryId === 'c1' ? [P('2')] : [P('1', { compareAtPrice: 150 }), P('2')]))
    const categories = async () => [{ id: 'c1', name: 'Ropa' }]
    view(ProductGridBlock, { showAddToCart: false }, { products, categories })
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Prod 1')).toBeInTheDocument())
    fireEvent.click(await screen.findByRole('button', { name: 'Ropa' }))
    await waitFor(() => expect(screen.queryByText('Prod 1')).toBeNull())
    expect(products).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: 'c1' }))
  })

  it('ProductGrid shows the empty state and loads more by growing the limit', async () => {
    view(ProductGridBlock, { showCategories: false }, { products: async () => [] })
    await waitFor(() => expect(screen.getByText('No encontramos productos.')).toBeInTheDocument())
  })

  it('ProductGrid load-more requests a bigger page', async () => {
    const products = vi.fn(async (q) => ({ items: Array.from({ length: Math.min(q.limit, 5) }, (_, i) => P(String(i))), total: 5 }))
    view(ProductGridBlock, { showCategories: false, pageSize: 2, showAddToCart: false }, { products })
    fireEvent.click(await screen.findByRole('button', { name: 'Cargar más' }))
    await waitFor(() => expect(products).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 4 })))
  })

  it('ProductGrid renders sample products in editor mode without handlers', async () => {
    view(ProductGridBlock, {}, {}, 'edit')
    await waitFor(() => expect(screen.getByText('Producto de ejemplo')).toBeInTheDocument())
  })

  it('ProductDetail resolves variants and adds the chosen one', async () => {
    const product = P('p', { options: [{ name: 'Talla', values: ['S', 'M'] }], variants: [{ id: 'vs', options: { Talla: 'S' }, price: 90, stock: 2 }, { id: 'vm', options: { Talla: 'M' }, stock: 0 }] })
    expect(findVariant(product, { Talla: 'M' }).id).toBe('vm')
    const add = vi.fn(async () => ({ items: [] }))
    view(ProductDetailBlock, { productId: 'p' }, { product: async () => product, cart: { get: async () => ({ items: [] }), add, update: vi.fn(), remove: vi.fn(), checkout: vi.fn() } })
    await screen.findByText('Quedan 2 piezas')
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    await waitFor(() => expect(add).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p', variantId: 'vs', quantity: 1 })))
    fireEvent.change(screen.getByLabelText('Talla'), { target: { value: 'M' } })
    expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled()
  })

  it('CategoryList renders links', async () => {
    view(CategoryListBlock, {}, { categories: async () => [{ id: '1', slug: 'ropa', name: 'Ropa', count: 4 }] })
    const link = await screen.findByRole('link', { name: /Ropa/ })
    expect(link).toHaveAttribute('href', '/tienda?categoria=ropa')
  })
})

describe('purchase blocks (local fallback cart)', () => {
  it('AddToCartButton feeds CartBlock, which shows totals and supports qty/remove', async () => {
    const resources = { product: async () => P('x', { title: 'Taza', price: 80 }) }
    const { unmount } = view(AddToCartButtonBlock, { productId: 'x' }, resources)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    })
    unmount()
    view(CartBlock, {}, resources)
    await screen.findByText('Taza')
    expect(screen.getAllByText(/\$80\.00/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Agregar una unidad de Taza/ }))
    await waitFor(() => expect(screen.getAllByText(/\$160\.00/).length).toBeGreaterThan(0))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await screen.findByText('Tu carrito está vacío.')
  })

  it('CheckoutSummary calls cart.checkout and is inert in edit mode', async () => {
    const checkout = vi.fn(async () => undefined)
    const cart = { get: async () => ({ items: [{ id: 'l', productId: 'a', title: 'A', price: 10, quantity: 1 }] }), add: vi.fn(), update: vi.fn(), remove: vi.fn(), checkout }
    const { unmount } = view(CheckoutSummaryBlock, {}, { cart })
    const btn = await screen.findByRole('button', { name: 'Continuar al pago' })
    await waitFor(() => expect(btn).not.toBeDisabled())
    fireEvent.click(btn)
    await waitFor(() => expect(checkout).toHaveBeenCalled())
    unmount()
    view(CheckoutSummaryBlock, {}, { cart }, 'edit')
    expect(screen.getByRole('button', { name: 'Continuar al pago' })).toBeDisabled()
  })
})
