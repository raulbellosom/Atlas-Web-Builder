import { useState } from 'react'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar, radiusVar } from './_tokens.js'
import { normalizeList } from '../resources/contract.js'
import { useResources, useResourceCall, ResourceView } from '../resources/useResources.jsx'
import { formatPrice, productImages, sortProducts } from '../commerce/format.js'
import { useCart } from '../commerce/useCart.js'
import { Img, Skeleton, buttonStyle, inputStyle, rootStyle } from '../commerce/ui.jsx'

const SORTS = [
  { value: 'default', label: 'Relevancia' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name', label: 'Nombre' },
]

const hrefFor = (tpl, p) => (tpl ? tpl.replace('{id}', encodeURIComponent(p.id)).replace('{slug}', encodeURIComponent(p.slug || p.id)) : undefined)

function ProductCard({ product, list, currency, locale, detailHref, showAdd, edit, cart }) {
  const img = productImages(product)[0]
  const soldOut = product.stock === 0
  const href = hrefFor(detailHref, product)
  const price = { currency: product.currency || currency, locale }
  return (
    <li style={{ display: 'grid', gridTemplateColumns: list ? '120px 1fr' : '1fr', gap: 12, alignItems: 'start' }}>
      <Img src={img && img.src} alt={(img && img.alt) || product.title} aspectRatio="1 / 1" sizes="(min-width: 768px) 25vw, 50vw" />
      <div style={{ display: 'grid', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 'var(--atlas-fontSize-md, 1rem)' }}>
          {href ? (
            <a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
              {product.title}
            </a>
          ) : (
            product.title
          )}
        </h3>
        <div>
          <strong>{formatPrice(product.price, price)}</strong>
          {product.compareAtPrice > product.price && (
            <s style={{ marginLeft: 8, opacity: 0.6 }}>{formatPrice(product.compareAtPrice, price)}</s>
          )}
        </div>
        {soldOut && <span style={{ color: colorVar('danger', '#DC2626'), fontSize: 'var(--atlas-fontSize-sm, 0.875rem)' }}>Agotado</span>}
        {showAdd && (
          <button type="button" disabled={edit || soldOut} onClick={() => cart.add({ productId: product.id, quantity: 1, product })} style={buttonStyle({ variant: 'outline', disabled: edit || soldOut })}>
            Agregar al carrito
          </button>
        )}
      </div>
    </li>
  )
}

function ProductGridView(props) {
  const { ctx, layout, columns, categoryId, showCategories, showSearch, showSort, pageSize, pagination, currency, locale, detailHref, showAddToCart, emptyText } = props
  const resources = useResources(ctx)
  const edit = ctx.mode === 'edit'
  const cart = useCart(resources, { preview: edit || !showAddToCart, currency })
  const [category, setCategory] = useState(categoryId || '')
  const [sort, setSort] = useState('default')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loads, setLoads] = useState(1)
  const size = Math.max(1, Number(pageSize) || 12)
  const loadMore = pagination === 'loadMore'
  const params = { categoryId: category || undefined, query: query || undefined, limit: size * (loadMore ? loads : 1), page: pagination === 'pages' ? page : 1, sort }
  const cats = useResourceCall(resources, 'categories', undefined, { skip: !showCategories })
  const reset = () => {
    setPage(1)
    setLoads(1)
  }
  const list = layout === 'list'
  const cols = list ? 1 : Math.min(4, Math.max(1, Number(columns) || 3))

  return (
    <section style={rootStyle} aria-label="Catálogo de productos">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        {showSearch && (
          <form role="search" onSubmit={(e) => { e.preventDefault(); setQuery(draft.trim()); reset() }} style={{ display: 'flex', gap: 8 }}>
            <input type="search" aria-label="Buscar productos" placeholder="Buscar…" value={draft} disabled={edit} onChange={(e) => setDraft(e.target.value)} style={inputStyle} />
            <button type="submit" disabled={edit} style={buttonStyle({ variant: 'outline', disabled: edit })}>Buscar</button>
          </form>
        )}
        {showSort && (
          <select aria-label="Ordenar" value={sort} disabled={edit} onChange={(e) => { setSort(e.target.value); reset() }} style={inputStyle}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        )}
      </div>
      {showCategories && Array.isArray(cats.data) && cats.data.length > 0 && (
        <div role="group" aria-label="Categorías" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {[{ id: '', name: 'Todas' }, ...cats.data].map((c) => (
            <button key={c.id} type="button" aria-pressed={category === c.id} disabled={edit} onClick={() => { setCategory(c.id); reset() }} style={{ ...buttonStyle({ variant: category === c.id ? 'solid' : 'outline', disabled: edit }), padding: '6px 12px', borderRadius: radiusVar('full', '999px') }}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <ResourceView
        resources={resources}
        path="products"
        params={params}
        select={normalizeList}
        isEmpty={(d) => d.items.length === 0}
        loading={<Skeleton count={Math.min(size, cols * 2)} columns={cols} />}
        empty={<p style={{ padding: 16, opacity: 0.7 }}>{emptyText}</p>}
      >
        {({ items, total }) => {
          const hasMore = total !== undefined ? items.length + (pagination === 'pages' ? (page - 1) * size : 0) < total : items.length >= params.limit
          return (
            <>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 20, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {sortProducts(items, sort).map((p) => (
                  <ProductCard key={p.id} product={p} list={list} currency={currency} locale={locale} detailHref={detailHref} showAdd={showAddToCart} edit={edit} cart={cart} />
                ))}
              </ul>
              {pagination === 'loadMore' && hasMore && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <button type="button" disabled={edit} onClick={() => setLoads((n) => n + 1)} style={buttonStyle({ variant: 'outline', disabled: edit })}>Cargar más</button>
                </div>
              )}
              {pagination === 'pages' && (page > 1 || hasMore) && (
                <nav aria-label="Paginación" style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                  <button type="button" disabled={edit || page <= 1} onClick={() => setPage((n) => n - 1)} style={buttonStyle({ variant: 'outline', disabled: edit || page <= 1 })}>Anterior</button>
                  <span aria-current="page">Página {page}</span>
                  <button type="button" disabled={edit || !hasMore} onClick={() => setPage((n) => n + 1)} style={buttonStyle({ variant: 'outline', disabled: edit || !hasMore })}>Siguiente</button>
                </nav>
              )}
            </>
          )
        }}
      </ResourceView>
    </section>
  )
}

/** Product catalog from `resources.products` (+ `resources.categories` for filters). */
export const ProductGridBlock = defineBlock({
  type: 'ProductGridBlock',
  label: 'Catálogo de productos',
  category: 'commerce',
  icon: 'grid',
  resources: ['products', 'categories'],
  defaultProps: {
    layout: 'grid',
    columns: '3',
    categoryId: '',
    showCategories: true,
    showSearch: true,
    showSort: true,
    pageSize: 12,
    pagination: 'loadMore',
    currency: 'MXN',
    locale: 'es-MX',
    detailHref: '/producto/{slug}',
    showAddToCart: true,
    emptyText: 'No encontramos productos.',
  },
  fields: {
    layout: { type: 'select', label: 'Diseño', options: [{ value: 'grid', label: 'Cuadrícula' }, { value: 'list', label: 'Lista' }] },
    columns: { type: 'select', label: 'Columnas', options: ['2', '3', '4'] },
    categoryId: { type: 'text', label: 'Categoría fija (ID)' },
    showCategories: { type: 'toggle', label: 'Filtro de categorías' },
    showSearch: { type: 'toggle', label: 'Buscador' },
    showSort: { type: 'toggle', label: 'Ordenar' },
    pageSize: { type: 'number', label: 'Productos por página' },
    pagination: { type: 'select', label: 'Paginación', options: [{ value: 'loadMore', label: 'Cargar más' }, { value: 'pages', label: 'Páginas' }, { value: 'none', label: 'Ninguna' }] },
    currency: { type: 'text', label: 'Moneda (ISO)' },
    locale: { type: 'text', label: 'Idioma de formato' },
    detailHref: { type: 'text', label: 'Enlace al detalle ({slug} o {id})' },
    showAddToCart: { type: 'toggle', label: 'Botón agregar al carrito' },
    emptyText: { type: 'text', label: 'Texto sin resultados' },
  },
  groups: [
    { label: 'Datos', fields: ['categoryId', 'pageSize', 'pagination', 'detailHref'] },
    { label: 'Diseño', fields: ['layout', 'columns'] },
    { label: 'Controles', fields: ['showCategories', 'showSearch', 'showSort', 'showAddToCart'] },
    { label: 'Formato', fields: ['currency', 'locale', 'emptyText'] },
  ],
  render: (props) => <ProductGridView {...props} />,
})
