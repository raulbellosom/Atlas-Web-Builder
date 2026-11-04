/** Sample data shown in editor mode when the host supplies no handler. */
export const SAMPLE_PRODUCTS = [
  { id: 'sample-1', title: 'Producto de ejemplo', price: 499, compareAtPrice: 599, stock: 8, categoryId: 'sample-c1' },
  { id: 'sample-2', title: 'Otro producto', price: 249, stock: 0, categoryId: 'sample-c1' },
  { id: 'sample-3', title: 'Tercer producto', price: 1290, stock: 3, categoryId: 'sample-c2' },
]
export const SAMPLE_CATEGORIES = [
  { id: 'sample-c1', name: 'Categoría A', count: 2 },
  { id: 'sample-c2', name: 'Categoría B', count: 1 },
]
export const SAMPLE_CART = {
  items: [
    { id: 's1', productId: 'sample-1', title: 'Producto de ejemplo', price: 499, quantity: 2 },
    { id: 's2', productId: 'sample-3', title: 'Tercer producto', price: 1290, quantity: 1 },
  ],
  subtotal: 2288,
  discount: 100,
  total: 2188,
  currency: 'MXN',
}
export const sampleResources = {
  products: () => SAMPLE_PRODUCTS,
  categories: () => SAMPLE_CATEGORIES,
  product: () => SAMPLE_PRODUCTS[0],
}
