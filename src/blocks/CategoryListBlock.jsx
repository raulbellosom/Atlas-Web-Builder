import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar, radiusVar } from './_tokens.js'
import { useResources, ResourceView } from '../resources/useResources.jsx'
import { Img, Skeleton, rootStyle } from '../commerce/ui.jsx'

const hrefFor = (tpl, c) => (tpl ? tpl.replace('{id}', encodeURIComponent(c.id)).replace('{slug}', encodeURIComponent(c.slug || c.id)) : undefined)

function CategoryListView({ ctx, layout, columns, showImage, showCount, hrefTemplate }) {
  const resources = useResources(ctx)
  const cols = layout === 'chips' ? 0 : Math.min(4, Math.max(1, Number(columns) || 3))
  return (
    <nav aria-label="Categorías" style={rootStyle}>
      <ResourceView resources={resources} path="categories" loading={<Skeleton count={cols || 4} columns={cols || 4} aspectRatio="3 / 2" />} empty={<p style={{ padding: 16, opacity: 0.7 }}>No hay categorías.</p>}>
        {(cats) => (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: cols ? 'grid' : 'flex', flexWrap: 'wrap', gap: cols ? 16 : 8, gridTemplateColumns: cols ? `repeat(${cols}, minmax(0, 1fr))` : undefined }}>
            {cats.map((c) => {
              const href = hrefFor(hrefTemplate, c)
              const body = (
                <>
                  {cols > 0 && showImage && <Img src={c.image} alt="" aspectRatio="3 / 2" />}
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  {showCount && typeof c.count === 'number' && <span style={{ opacity: 0.6 }}> ({c.count})</span>}
                </>
              )
              const style = { display: 'block', color: 'inherit', textDecoration: 'none', ...(cols ? {} : { padding: '6px 14px', border: `1px solid ${colorVar('border', '#CBD5E1')}`, borderRadius: radiusVar('full', '999px') }) }
              return <li key={c.id}>{href ? <a href={href} style={style}>{body}</a> : <div style={style}>{body}</div>}</li>
            })}
          </ul>
        )}
      </ResourceView>
    </nav>
  )
}

/** Category tiles or chips from `resources.categories()`. */
export const CategoryListBlock = defineBlock({
  type: 'CategoryListBlock',
  label: 'Lista de categorías',
  category: 'commerce',
  icon: 'list',
  resources: ['categories'],
  defaultProps: { layout: 'tiles', columns: '3', showImage: true, showCount: true, hrefTemplate: '/tienda?categoria={slug}' },
  fields: {
    layout: { type: 'select', label: 'Diseño', options: [{ value: 'tiles', label: 'Mosaico' }, { value: 'chips', label: 'Etiquetas' }] },
    columns: { type: 'select', label: 'Columnas', options: ['2', '3', '4'] },
    showImage: { type: 'toggle', label: 'Mostrar imagen' },
    showCount: { type: 'toggle', label: 'Mostrar cantidad' },
    hrefTemplate: { type: 'text', label: 'Enlace ({slug} o {id})' },
  },
  groups: [
    { label: 'Diseño', fields: ['layout', 'columns', 'showImage', 'showCount'] },
    { label: 'Enlace', fields: ['hrefTemplate'] },
  ],
  render: (props) => <CategoryListView {...props} />,
})
