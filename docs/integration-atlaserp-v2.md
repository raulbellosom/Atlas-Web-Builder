# Integración en atlaserp-v2

Guía paso a paso para instalar y usar `@racoondevs/atlas-web-builder` dentro del proyecto `atlaserp-v2`.

---

## 1. Instalar el paquete

```bash
# En la raíz de atlaserp-v2
pnpm add @racoondevs/atlas-web-builder
```

> **Si usas un monorepo pnpm con workspaces** y ambos proyectos están en el mismo repo:
> ```bash
> pnpm add @racoondevs/atlas-web-builder@workspace:*
> ```
> Esto consume la fuente local en lugar del npm registry. Para publicar en producción, cambia a una versión fija: `@racoondevs/atlas-web-builder@^0.0.2`.

---

## 2. Importar el CSS

El CSS del editor **debe importarse una sola vez** en la aplicación. El lugar recomendado es el entry point o el layout raíz.

```jsx
// src/main.jsx  o  src/App.jsx  o  pages/_app.jsx (Next.js)
import '@racoondevs/atlas-web-builder/styles'
```

Si tu bundler requiere la ruta explícita:
```js
import '@racoondevs/atlas-web-builder/dist/style.css'
```

---

## 3. Estructura de archivos sugerida

```
src/
├── features/
│   └── page-builder/
│       ├── PageEditor.jsx          ← componente del editor
│       ├── PageRenderer.jsx        ← componente renderer (frontend público)
│       ├── atlasTheme.js           ← tema de Atlas ERP
│       ├── atlasBlocks.js          ← baseBlocks + bloques propios
│       ├── atlasAssets.js          ← AssetSource con Supabase Storage
│       └── blocks/
│           ├── ProductCardBlock.jsx
│           ├── ProductListBlock.jsx
│           └── FormBlock.jsx
└── pages/
    └── admin/
        └── pages/
            ├── [id]/edit.jsx       ← ruta del editor
            └── index.jsx           ← lista de páginas
```

---

## 4. Definir el tema de Atlas ERP

```js
// src/features/page-builder/atlasTheme.js
import { defineTheme, defaultTheme } from '@racoondevs/atlas-web-builder'

export const atlasTheme = defineTheme({
  ...defaultTheme,
  id: 'atlas-erp',
  name: 'Atlas ERP',
  tokens: {
    ...defaultTheme.tokens,
    color: {
      ...defaultTheme.tokens.color,
      primary:   '#6D28D9',   // tu color de marca
      primaryFg: '#FFFFFF',
      accent:    '#F59E0B',
      danger:    '#DC2626',
    },
    radius: {
      ...defaultTheme.tokens.radius,
      md: '10px',
      lg: '16px',
    },
    font: {
      ...defaultTheme.tokens.font,
      sans: '"Inter", system-ui, -apple-system, sans-serif',
    },
  },
})
```

---

## 5. Definir los bloques

```js
// src/features/page-builder/atlasBlocks.js
import { baseBlocks } from '@racoondevs/atlas-web-builder'
import { ProductCardBlock } from './blocks/ProductCardBlock'
import { ProductListBlock } from './blocks/ProductListBlock'

// Exporta el array completo de bloques para pasar al editor y al renderer
export const atlasBlocks = [
  ...baseBlocks,
  ProductCardBlock,
  ProductListBlock,
]
```

---

## 6. Configurar el AssetSource (Supabase Storage)

```js
// src/features/page-builder/atlasAssets.js
import { supabase } from '@/lib/supabase'

const BUCKET = 'atlas-media'

export const atlasAssets = {
  /** Lista todos los archivos del bucket */
  async list() {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) throw new Error(error.message)

    return data.map((file) => ({
      id:   file.name,
      name: file.name,
      kind: /\.(mp4|webm|ogg|mov)$/i.test(file.name) ? 'video' : 'image',
      url:  supabase.storage.from(BUCKET).getPublicUrl(file.name).data.publicUrl,
    }))
  },

  /** Sube un archivo y retorna el asset */
  async upload(file) {
    const ext  = file.name.split('.').pop()
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage.from(BUCKET).upload(name, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) throw new Error(error.message)

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(name)
    const kind = /\.(mp4|webm|ogg|mov)$/i.test(name) ? 'video' : 'image'
    return { id: name, name, kind, url: publicUrl }
  },

  /** Elimina un archivo */
  async remove(id) {
    const { error } = await supabase.storage.from(BUCKET).remove([id])
    if (error) throw new Error(error.message)
  },
}
```

> Asegúrate de que el bucket `atlas-media` exista en Supabase y tenga política pública de lectura.

---

## 7. Componente del editor

```jsx
// src/features/page-builder/PageEditor.jsx
import { AtlasWebBuilderEditor, serializePage } from '@racoondevs/atlas-web-builder'
import { atlasBlocks }  from './atlasBlocks'
import { atlasTheme }   from './atlasTheme'
import { atlasAssets }  from './atlasAssets'

/**
 * @param {{
 *   page: import('@racoondevs/atlas-web-builder').Page,
 *   onSaved?: (page) => void,
 *   onPublished?: (page) => void,
 * }} props
 */
export function PageEditor({ page, onSaved, onPublished }) {
  async function handleSaveDraft(updatedPage) {
    const json = serializePage(updatedPage)
    await fetch(`/api/pages/${updatedPage.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: json, status: 'draft' }),
    })
    onSaved?.(updatedPage)
  }

  async function handlePublish(updatedPage) {
    const json = serializePage(updatedPage)
    await fetch(`/api/pages/${updatedPage.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: json, status: 'published' }),
    })
    onPublished?.(updatedPage)
  }

  return (
    // Contenedor con altura acotada — obligatorio para que el editor scrollee correctamente
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <AtlasWebBuilderEditor
        blocks={atlasBlocks}
        theme={atlasTheme}
        assets={atlasAssets}
        initialPage={page}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />
    </div>
  )
}
```

---

## 8. Componente renderer (frontend público)

```jsx
// src/features/page-builder/PageRenderer.jsx
import {
  AtlasWebBuilderProvider,
  AtlasWebRenderer,
  parsePage,
} from '@racoondevs/atlas-web-builder'
import { atlasBlocks } from './atlasBlocks'
import { atlasTheme }  from './atlasTheme'

/**
 * Muestra una página pública sin cargar ningún chrome del editor.
 *
 * @param {{ pageJson: string | object }} props
 */
export function PageRenderer({ pageJson }) {
  const page = typeof pageJson === 'string' ? parsePage(pageJson) : pageJson

  return (
    <AtlasWebBuilderProvider blocks={atlasBlocks} theme={atlasTheme}>
      <AtlasWebRenderer page={page} mode="public" />
    </AtlasWebBuilderProvider>
  )
}
```

---

## 9. Ruta del editor (ejemplo con React Router)

```jsx
// src/pages/admin/pages/[id]/edit.jsx
import { useParams }   from 'react-router-dom'
import { useQuery }    from '@tanstack/react-query'
import { parsePage }   from '@racoondevs/atlas-web-builder'
import { PageEditor }  from '@/features/page-builder/PageEditor'

export function PageEditorRoute() {
  const { id } = useParams()

  const { data: page, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: async () => {
      const res  = await fetch(`/api/pages/${id}`)
      const json = await res.json()
      return parsePage(json.content)   // migra esquemas viejos automáticamente
    },
  })

  if (isLoading) return <div>Cargando editor…</div>

  return (
    <PageEditor
      page={page}
      onSaved={() => console.log('Borrador guardado')}
      onPublished={() => console.log('Publicado')}
    />
  )
}
```

---

## 10. Crear bloques propios de Atlas ERP

### Ejemplo: Bloque de producto

```jsx
// src/features/page-builder/blocks/ProductCardBlock.jsx
import { defineBlock } from '@racoondevs/atlas-web-builder'
import { useProduct }  from '@/hooks/useProduct'

export const ProductCardBlock = defineBlock({
  type: 'ProductCardBlock',
  label: 'Tarjeta de producto',
  category: 'content',
  icon: 'card',

  defaultProps: {
    productId: '',
    showPrice: true,
    showBadge: false,
    ctaLabel:  'Añadir al carrito',
    align:     'left',
  },

  fields: {
    productId: { type: 'text',   label: 'ID o SKU del producto' },
    showPrice: { type: 'toggle', label: 'Mostrar precio' },
    showBadge: { type: 'toggle', label: 'Mostrar badge de disponibilidad' },
    ctaLabel:  { type: 'text',   label: 'Texto del botón' },
    align:     { type: 'select', label: 'Alineación', options: [
      { value: 'left',   label: 'Izquierda' },
      { value: 'center', label: 'Centro' },
    ]},
  },

  groups: [
    { label: 'Producto', fields: ['productId', 'showPrice', 'showBadge'] },
    { label: 'Estilo',   fields: ['ctaLabel', 'align'] },
  ],

  render: ({ productId, showPrice, showBadge, ctaLabel, align }) => {
    // Este componente se renderiza tanto en el editor como en el frontend público.
    // En el editor (ctx.mode === 'edit') puedes mostrar un placeholder si productId está vacío.
    const { data: product, loading } = useProduct(productId)

    if (!productId) {
      return (
        <div style={{ border: '2px dashed #e5e7eb', borderRadius: 12, padding: 24, textAlign: 'center', color: '#9ca3af' }}>
          Selecciona un producto en el panel de propiedades
        </div>
      )
    }

    if (loading) return <div style={{ padding: 24, color: '#9ca3af' }}>Cargando producto…</div>

    return (
      <div style={{ textAlign: align, fontFamily: 'var(--atlas-font-sans)' }}>
        {product?.image && (
          <img src={product.image} alt={product.name} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
        )}
        <h3 style={{ margin: '12px 0 4px', fontSize: 'var(--atlas-fontSize-lg)' }}>{product?.name}</h3>
        {showPrice && (
          <p style={{ color: 'var(--atlas-color-primary)', fontWeight: 700, fontSize: 'var(--atlas-fontSize-xl)', margin: '0 0 12px' }}>
            ${product?.price?.toFixed(2)}
          </p>
        )}
        {showBadge && product?.inStock !== undefined && (
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 999,
            background: product.inStock ? '#dcfce7' : '#fee2e2',
            color: product.inStock ? '#16a34a' : '#dc2626',
            fontSize: 12, fontWeight: 600, marginBottom: 12,
          }}>
            {product.inStock ? 'En stock' : 'Agotado'}
          </span>
        )}
        {ctaLabel && (
          <button type="button" style={{ background: 'var(--atlas-color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--atlas-fontSize-md)' }}>
            {ctaLabel}
          </button>
        )}
      </div>
    )
  },
})
```

---

## 11. API de páginas (backend sugerido)

```
GET    /api/pages              → lista de páginas { id, title, slug, status, updatedAt }
GET    /api/pages/:id          → { id, content: string (JSON), status, slug, title }
POST   /api/pages              → crear página vacía
PATCH  /api/pages/:id          → { content: string, status } → actualizar
DELETE /api/pages/:id          → eliminar
```

### Migración de base de datos (Supabase SQL)

```sql
create table if not exists pages (
  id          text primary key,
  slug        text unique not null,
  title       text not null default '',
  status      text not null default 'draft'  check (status in ('draft','published','private')),
  content     jsonb,                          -- página serializada
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Índice para buscar por slug en el frontend público
create index on pages (slug) where status = 'published';
```

---

## 12. Preguntas frecuentes

**¿El editor funciona con Next.js App Router?**
Sí. Añade `'use client'` al componente que envuelve `<PageEditor>` y el paquete al array `transpilePackages` en `next.config.js`. El renderer puede usarse en server components si no necesitas interactividad.

**¿Cómo cargo una página en el renderer sin parpadeo?**
Pasa el JSON de la página directamente desde el server (SSR/SSG) como prop al `<PageRenderer>`. `parsePage()` es síncrono y no hace fetch.

**¿Los bloques personalizados son tree-shakeable?**
Sí. Solo se incluyen en el bundle los bloques que pasas al array `blocks`. No uses `baseBlocks` en el renderer si no necesitas todos.

**¿Puedo tener múltiples editores en la misma página?**
Sí. Cada `<AtlasWebBuilderEditor>` crea su propio store Zustand aislado. No comparten estado.

**¿Cómo guardo el historial de undo/redo?**
El historial vive solo en memoria (zundo). Al navegar a otra página se pierde. Si quieres persistirlo considera auto-save agresivo (cada N segundos o cada N cambios) en `onSaveDraft`.
