# @racoondevs/atlas-web-builder

Editor visual de páginas web para React. Inspirado en Puck, Webstudio y Plasmic — completamente propio, MIT, sin dependencias de SaaS.

---

## Contenido

1. [Instalación](#instalación)
2. [Setup rápido — Editor](#setup-rápido--editor)
3. [Setup rápido — Renderer (solo lectura)](#setup-rápido--renderer-solo-lectura)
4. [Guardar y cargar páginas](#guardar-y-cargar-páginas)
5. [Bloques disponibles](#bloques-disponibles)
6. [Efectos universales](#efectos-universales)
7. [Personalizar el tema](#personalizar-el-tema)
8. [Gestión de assets (imágenes/video)](#gestión-de-assets-imágenesvideo)
9. [Bloques personalizados](#bloques-personalizados)
10. [Tipos de campo personalizados](#tipos-de-campo-personalizados)
11. [Templates y layouts](#templates-y-layouts)
12. [API de referencia](#api-de-referencia)

---

## Instalación

```bash
# pnpm
pnpm add @racoondevs/atlas-web-builder

# npm
npm install @racoondevs/atlas-web-builder

# yarn
yarn add @racoondevs/atlas-web-builder
```

**Peer dependencies requeridas** (ya deberían estar en tu proyecto):

```bash
pnpm add react react-dom
```

---

## Setup rápido — Editor

```jsx
// src/pages/PageEditor.jsx
import { AtlasWebBuilderEditor, baseBlocks } from '@racoondevs/atlas-web-builder'
import '@racoondevs/atlas-web-builder/styles' // ← CSS obligatorio

export function PageEditor({ initialPage, onSave, onPublish }) {
  return (
    // El editor necesita un contenedor con altura definida
    <div style={{ position: 'fixed', inset: 0 }}>
      <AtlasWebBuilderEditor
        blocks={baseBlocks}
        initialPage={initialPage}
        onSaveDraft={onSave}
        onPublish={onPublish}
      />
    </div>
  )
}
```

> **Importante:** El editor usa `height: 100%` internamente. El contenedor padre **debe** tener una altura acotada (`position: fixed`, `height: 100vh`, etc.).

---

## Setup rápido — Renderer (solo lectura)

El renderer muestra páginas guardadas sin cargar ningún chrome del editor. Úsalo en el frontend público de tu app.

```jsx
// src/pages/PublicPage.jsx
import {
  AtlasWebBuilderProvider,
  AtlasWebRenderer,
  baseBlocks,
  defaultTheme,
} from '@racoondevs/atlas-web-builder'
import '@racoondevs/atlas-web-builder/styles'

export function PublicPage({ page }) {
  return (
    <AtlasWebBuilderProvider blocks={baseBlocks} theme={defaultTheme}>
      <AtlasWebRenderer page={page} mode="public" />
    </AtlasWebBuilderProvider>
  )
}
```

---

## Guardar y cargar páginas

El contenido de una página es un **objeto JSON serializable**. El editor lo devuelve en `onSaveDraft` y `onPublish`.

### Estructura de una página

```js
const page = {
  schemaVersion: 1,
  id: 'page_home',
  slug: '/',
  title: 'Inicio',
  visibility: 'public', // 'public' | 'draft' | 'private'
  layoutId: null,
  regions: {
    main: { id: 'region_main', children: ['blk_1', 'blk_2'] },
  },
  blocks: {
    blk_1: { id: 'blk_1', type: 'HeroBlock', props: { title: 'Bienvenido' }, children: {} },
    blk_2: { id: 'blk_2', type: 'TextBlock', props: { text: 'Hola mundo' }, children: {} },
  },
  seo: {
    title: '',
    description: '',
    canonical: null,
    ogImageAssetId: null,
  },
  updatedAt: '2025-01-01T00:00:00.000Z',
}
```

### Guardar en base de datos

```jsx
import { serializePage, parsePage } from '@racoondevs/atlas-web-builder'

// Serializar a JSON string (validado + limpio)
const json = serializePage(page, { pretty: false })

// Guardar en tu BD (Supabase, PostgreSQL, etc.)
await supabase.from('pages').upsert({ id: page.id, content: json })

// Cargar y parsear
const { data } = await supabase.from('pages').select('content').eq('id', 'page_home').single()
const page = parsePage(data.content) // valida el esquema y migra versiones antiguas
```

### Con el editor

```jsx
<AtlasWebBuilderEditor
  blocks={baseBlocks}
  initialPage={initialPage}
  onSaveDraft={async (page) => {
    const json = serializePage(page)
    await api.savePageDraft(page.id, json)
    toast.success('Borrador guardado')
  }}
  onPublish={async (page) => {
    const json = serializePage(page)
    await api.publishPage(page.id, json)
    toast.success('Página publicada')
  }}
/>
```

---

## Bloques disponibles

Importa `baseBlocks` para registrar todos los bloques de serie. También puedes importarlos individualmente.

### Navegación

| Bloque | Tipo          | Descripción                                                                                                                     |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Navbar | `NavbarBlock` | Barra de navegación. Links como `Inicio \| /ruta` por línea. Sub-ítems indentados con 2 espacios/tab generan menús desplegables |
| Footer | `FooterBlock` | Pie de página multi-columna                                                                                                     |

### Hero

| Bloque | Tipo        | Descripción                                                |
| ------ | ----------- | ---------------------------------------------------------- |
| Hero   | `HeroBlock` | Sección principal con título, subtítulo, CTA y 3 variantes |

### Diseño

| Bloque     | Tipo             | Descripción                                        |
| ---------- | ---------------- | -------------------------------------------------- |
| Sección    | `SectionBlock`   | Banda con fondo, padding y slot de contenido       |
| Contenedor | `ContainerBlock` | Caja centrada con ancho máximo                     |
| Columnas   | `ColumnsBlock`   | Grid de 2-4 columnas con distribución configurable |
| Cuadrícula | `GridBlock`      | Grid CSS libre                                     |
| Espaciador | `SpacerBlock`    | Espacio vertical vacío                             |
| Separador  | `DividerBlock`   | Línea divisoria horizontal                         |

### Contenido

| Bloque            | Tipo               | Descripción                                                 |
| ----------------- | ------------------ | ----------------------------------------------------------- |
| Encabezado        | `HeadingBlock`     | Títulos h1-h6 con control de peso, interlineado, mayúsculas |
| Texto             | `TextBlock`        | Párrafo con control tipográfico completo                    |
| Texto enriquecido | `RichTextBlock`    | HTML sanitizado con formato básico                          |
| Tarjeta           | `CardBlock`        | Card con imagen, título, descripción y CTA                  |
| Testimonio        | `TestimonialBlock` | Cita con autor y estrellas                                  |
| Precio            | `PricingBlock`     | Tarjeta de precio con features                              |
| Botón             | `ButtonBlock`      | Enlace estilizado como botón                                |

### Multimedia

| Bloque | Tipo         | Descripción                                                 |
| ------ | ------------ | ----------------------------------------------------------- |
| Imagen | `ImageBlock` | Imagen con proporción (select), sombra, pie de foto, enlace |
| Video  | `VideoBlock` | YouTube, Vimeo o MP4. Detecta automáticamente por URL       |

---

## Efectos universales

Todos los bloques soportan un conjunto de **props de efectos** con prefijo `_` que el editor expone en el panel "Efectos" del panel de propiedades derecho. No es necesario declararlos en `fields` del bloque — el sistema los aplica automáticamente a través de `EffectsWrapper`.

### Props disponibles

| Prop            | Tipo             | Descripción                                                                       |
| --------------- | ---------------- | --------------------------------------------------------------------------------- |
| `_opacity`      | `number` (0 – 1) | Opacidad del bloque                                                               |
| `_animation`    | `AnimationValue` | Animación de entrada al cargar la página                                          |
| `_scrollReveal` | `boolean`        | Dispara `_animation` cuando el bloque entra en el viewport (IntersectionObserver) |
| `_hover`        | `HoverValue`     | Efectos de escala, sombra y brillo al pasar el cursor                             |
| `_filter`       | `FilterValue`    | Filtros CSS: blur, brillo, contraste, escala de grises, sepia                     |
| `_transform`    | `TransformValue` | Rotación y distorsión (rotate, skewX, skewY)                                      |
| `_cursor`       | `string`         | Cursor CSS (`auto`, `pointer`, `grab`, `zoom-in`, `crosshair`, etc.)              |
| `_zIndex`       | `number`         | Capa z-index (1, 10, 20, 50, 100, 200, 1000)                                      |
| `_sticky`       | `boolean`        | `position: sticky; top: 0` — el bloque queda fijo al hacer scroll                 |

### Tipos de valores

```ts
// Animación de entrada
type AnimationValue = {
  preset:
    | 'none'
    | 'fade-in'
    | 'slide-up'
    | 'slide-down'
    | 'slide-left'
    | 'slide-right'
    | 'zoom-in'
    | 'zoom-out'
  duration: number // ms, default 600
  delay: number // ms, default 0
  easing: 'ease-out' | 'ease' | 'ease-in-out' | 'linear'
}

// Efectos hover (CSS inyectado via <style> con data-eid)
type HoverValue = {
  scale: '' | '0.97' | '1.02' | '1.05' | '1.08' | '1.12' // '' = sin cambio
  shadow: '' | 'sm' | 'md' | 'lg' // sombra al hover
  brightness: number // %, default 100
  duration: number // ms, default 200
  easing: 'ease' | 'ease-out' | 'ease-in-out'
}

// Filtros CSS
type FilterValue = {
  blur: number // px, default 0
  brightness: number // %, default 100
  contrast: number // %, default 100
  grayscale: number // %, default 0
  sepia: number // %, default 0
}

// Transformaciones CSS
type TransformValue = {
  rotate: number // grados, -180 a 180
  skewX: number // grados, -45 a 45
  skewY: number // grados, -45 a 45
}
```

### Ejemplo de uso desde código

Puedes pre-configurar efectos en el JSON de la página (`defaultProps` o datos guardados):

```js
const page = {
  blocks: {
    hero1: {
      id: 'hero1',
      type: 'HeroBlock',
      props: {
        title: 'Bienvenido',
        // Efecto: aparece deslizándose desde abajo cuando entra en pantalla
        _animation: { preset: 'slide-up', duration: 700, delay: 0, easing: 'ease-out' },
        _scrollReveal: true,
        // Hover: escala sutil + sombra
        _hover: { scale: '1.02', shadow: 'md', brightness: 100, duration: 250, easing: 'ease' },
      },
      children: {},
    },
    card1: {
      id: 'card1',
      type: 'CardBlock',
      props: {
        title: 'Tarjeta',
        // Filtro: blanco y negro que revierte al hover
        _filter: { blur: 0, brightness: 100, contrast: 100, grayscale: 80, sepia: 0 },
        _hover: { scale: '1.05', shadow: 'sm', brightness: 110, duration: 300, easing: 'ease-out' },
      },
      children: {},
    },
  },
}
```

### Usar los helpers de resolución

```js
import { resolveAnimation, resolveTransform, resolveFilter } from '@racoondevs/atlas-web-builder'

// resolveAnimation({ preset: 'fade-in', duration: 500, delay: 100, easing: 'ease-out' })
// → 'atlas-anim-fade-in 500ms ease-out 100ms both'

// resolveTransform({ rotate: 45, skewX: 0, skewY: 0 })
// → 'rotate(45deg)'

// resolveFilter({ blur: 4, brightness: 90, contrast: 110, grayscale: 0, sepia: 0 })
// → 'blur(4px) brightness(90%) contrast(110%)'
```

### Navbar con menús desplegables

El campo `links` del `NavbarBlock` soporta sub-ítems. Las líneas que empiezan con 2 espacios (o un tabulador) se convierten en elementos del menú desplegable del ítem anterior:

```
Inicio | /
Productos | /productos
  Producto A | /productos/a
  Producto B | /productos/b
  Ver todos | /productos
Nosotros | /nosotros
Contacto | /contacto
```

Los menús desplegables son **CSS-only** (`:hover` + `focus-within`), sin JavaScript extra. Se renderizan con clases `.atlas-nb-*` incluidas en el CSS del paquete.

---

## Personalizar el tema

Los temas son objetos de tokens CSS. Los bloques consumen variables como `var(--atlas-color-primary)`.

```jsx
import {
  AtlasWebBuilderEditor,
  baseBlocks,
  defineTheme,
  defaultTheme,
} from '@racoondevs/atlas-web-builder'

const myTheme = defineTheme({
  ...defaultTheme,
  id: 'atlas-erp',
  name: 'Atlas ERP',
  tokens: {
    ...defaultTheme.tokens,
    color: {
      ...defaultTheme.tokens.color,
      primary:   '#6D28D9',   // violeta Atlas
      primaryFg: '#FFFFFF',
      accent:    '#F59E0B',
    },
    radius: {
      ...defaultTheme.tokens.radius,
      md: '12px',
      lg: '20px',
    },
  },
})

<AtlasWebBuilderEditor
  blocks={baseBlocks}
  theme={myTheme}
  initialPage={page}
  onSaveDraft={handleSave}
  onPublish={handlePublish}
/>
```

### Tokens disponibles

| Grupo        | Variables generadas                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color.*`    | `--atlas-color-primary`, `--atlas-color-primaryFg`, `--atlas-color-bg`, `--atlas-color-fg`, `--atlas-color-muted`, `--atlas-color-accent`, `--atlas-color-danger` |
| `fontSize.*` | `--atlas-fontSize-xs` … `--atlas-fontSize-3xl`                                                                                                                    |
| `spacing.*`  | `--atlas-spacing-0` … `--atlas-spacing-16`                                                                                                                        |
| `radius.*`   | `--atlas-radius-sm`, `md`, `lg`, `pill`                                                                                                                           |
| `shadow.*`   | `--atlas-shadow-sm`, `md`, `lg`                                                                                                                                   |
| `font.*`     | `--atlas-font-sans`, `--atlas-font-serif`, `--atlas-font-mono`                                                                                                    |

---

## Gestión de assets (imágenes/video)

El editor incluye un modal de medios con tres pestañas: **URL**, **Biblioteca** y **Subir**. Para usar la Biblioteca y Subir debes proporcionar un `AssetSource`.

### AssetSource en memoria (desarrollo / demos)

```jsx
import {
  AtlasWebBuilderEditor,
  baseBlocks,
  createInMemoryAssetSource,
} from '@racoondevs/atlas-web-builder'

const assets = createInMemoryAssetSource([
  { id: 'img1', kind: 'image', url: 'https://picsum.photos/800/600', name: 'demo.jpg' },
])

<AtlasWebBuilderEditor blocks={baseBlocks} assets={assets} initialPage={page} />
```

### AssetSource con Supabase Storage

```js
// src/lib/atlasAssets.js
import { supabase } from './supabase'

export function createSupabaseAssetSource(bucket = 'atlas-media') {
  return {
    async list() {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 200 })
      if (error) throw error
      return data.map((file) => ({
        id: file.name,
        name: file.name,
        kind: file.metadata?.mimetype?.startsWith('video') ? 'video' : 'image',
        url: supabase.storage.from(bucket).getPublicUrl(file.name).data.publicUrl,
      }))
    },

    async upload(file) {
      const name = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from(bucket).upload(name, file)
      if (error) throw error
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(name)
      return { id: name, name, kind: 'image', url: publicUrl }
    },

    async remove(id) {
      const { error } = await supabase.storage.from(bucket).remove([id])
      if (error) throw error
    },
  }
}
```

```jsx
import { createSupabaseAssetSource } from '@/lib/atlasAssets'

const assets = createSupabaseAssetSource('atlas-media')

<AtlasWebBuilderEditor blocks={baseBlocks} assets={assets} initialPage={page} />
```

---

## Bloques personalizados

Crea bloques propios de tu dominio (productos, formularios, tablas ERP, etc.).

```jsx
// src/blocks/ProductCardBlock.jsx
import { defineBlock } from '@racoondevs/atlas-web-builder'

export const ProductCardBlock = defineBlock({
  type: 'ProductCardBlock', // único en el registro
  label: 'Tarjeta de producto',
  category: 'content',
  icon: 'card', // uno de los iconos built-in

  defaultProps: {
    productId: '',
    showPrice: true,
    showStock: false,
    align: 'left',
  },

  fields: {
    productId: { type: 'text', label: 'ID del producto' },
    showPrice: { type: 'toggle', label: 'Mostrar precio' },
    showStock: { type: 'toggle', label: 'Mostrar stock' },
    align: {
      type: 'select',
      label: 'Alineación',
      options: [
        { value: 'left', label: 'Izquierda' },
        { value: 'center', label: 'Centro' },
      ],
    },
  },

  groups: [
    { label: 'Datos', fields: ['productId', 'showPrice', 'showStock'] },
    { label: 'Estilo', fields: ['align'] },
  ],

  // render recibe los props + un objeto ctx con helpers
  render: ({ productId, showPrice, showStock, align }) => {
    // Aquí puedes llamar hooks, usar contexto, etc.
    // En modo "public" se renderiza en el frontend
    return (
      <div style={{ textAlign: align }}>
        <p>Producto: {productId}</p>
        {showPrice && <p>Precio: …</p>}
        {showStock && <p>Stock: …</p>}
      </div>
    )
  },
})
```

```jsx
// src/pages/PageEditor.jsx
import { AtlasWebBuilderEditor, baseBlocks } from '@racoondevs/atlas-web-builder'
import { ProductCardBlock } from '@/blocks/ProductCardBlock'

const blocks = [...baseBlocks, ProductCardBlock]

<AtlasWebBuilderEditor blocks={blocks} initialPage={page} onSaveDraft={handleSave} onPublish={handlePublish} />
```

### Bloque con contenido dinámico (resources)

```jsx
export const ProductListBlock = defineBlock({
  type: 'ProductListBlock',
  label: 'Lista de productos',
  category: 'content',
  defaultProps: { categoryId: '', limit: 12 },
  fields: {
    categoryId: { type: 'text', label: 'ID de categoría' },
    limit: { type: 'select', label: 'Máx. productos', options: ['6', '12', '24', '48'] },
  },

  render: ({ categoryId, limit, ctx }) => {
    // ctx.resource() carga datos del host (inyectados via <AtlasWebBuilderEditor resources={...}>)
    const { data: products, loading } = ctx.resource('products', { categoryId, limit })
    if (loading) return <p>Cargando…</p>
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {(products || []).map((p) => (
          <div key={p.id}>{p.name}</div>
        ))}
      </div>
    )
  },
})
```

```jsx
// Inyectar el resource fetcher en el editor
<AtlasWebBuilderEditor
  blocks={blocks}
  resources={{
    products: async ({ categoryId, limit }) => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('category_id', categoryId)
        .limit(Number(limit))
      return data
    },
  }}
  initialPage={page}
/>
```

---

## Tipos de campo personalizados

```jsx
// src/fields/ColorTokenField.jsx
import { useEditorStore } from '@racoondevs/atlas-web-builder'

export function ColorTokenField({ value, onChange, label }) {
  const theme = useEditorStore((s) => s.theme)
  const colors = Object.entries(theme?.tokens?.color || {})

  return (
    <label className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {colors.map(([key, hex]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: hex,
              border: value === key ? '3px solid #000' : '1px solid rgba(0,0,0,0.15)',
              cursor: 'pointer',
            }}
            title={key}
          />
        ))}
      </div>
    </label>
  )
}
```

```jsx
// Registrar el campo y pasarlo al editor
import { defaultFields } from '@racoondevs/atlas-web-builder'
import { ColorTokenField } from '@/fields/ColorTokenField'

const customFields = {
  ...defaultFields,
  colorToken: ColorTokenField,
}

<AtlasWebBuilderEditor
  blocks={blocks}
  fieldTypes={customFields}
  initialPage={page}
/>
```

---

## Templates y layouts

### Templates

Fragmentos de página predefinidos que el editor puede insertar desde la pestaña Plantillas.

```js
import { defineTemplate } from '@racoondevs/atlas-web-builder'

const heroCtaTemplate = defineTemplate({
  id: 'hero-cta',
  label: 'Hero con CTA',
  description: 'Sección destacada con titular y botón.',
  category: 'landing',
  build() {
    return {
      rootIds: ['section'],
      blocks: {
        section: {
          id: 'section',
          type: 'SectionBlock',
          props: { background: { kind: 'color', token: 'primary' }, paddingY: '16' },
          children: { children: ['heading', 'btn'] },
        },
        heading: {
          id: 'heading',
          type: 'HeadingBlock',
          props: { text: 'Tu titular aquí', align: 'center', color: 'primaryFg' },
          children: {},
        },
        btn: {
          id: 'btn',
          type: 'ButtonBlock',
          props: { label: 'Empezar', align: 'center', variant: 'outline' },
          children: {},
        },
      },
    }
  },
})
```

```jsx
<AtlasWebBuilderEditor blocks={blocks} templates={[heroCtaTemplate]} initialPage={page} />
```

---

## API de referencia

### `<AtlasWebBuilderEditor>`

| Prop          | Tipo                       | Requerido | Descripción                                                 |
| ------------- | -------------------------- | --------- | ----------------------------------------------------------- |
| `blocks`      | `BlockDefinition[]`        | ✓         | Array de bloques registrados. Usa `baseBlocks` o combínalos |
| `initialPage` | `Page`                     |           | Página inicial. Si es `undefined` se crea una vacía         |
| `theme`       | `Theme`                    |           | Tema. Usa `defaultTheme` o créalo con `defineTheme()`       |
| `templates`   | `TemplateDefinition[]`     |           | Plantillas para la pestaña Plantillas                       |
| `layouts`     | `LayoutDefinition[]`       |           | Layouts de regiones disponibles                             |
| `assets`      | `AssetSource`              |           | Fuente de medios. Sin esto, solo funciona la pestaña URL    |
| `resources`   | `Record<string, Fetcher>`  |           | Fetchers de datos para bloques dinámicos                    |
| `actions`     | `Record<string, Function>` |           | Acciones personalizadas (formularios, etc.)                 |
| `onSaveDraft` | `(page: Page) => void`     |           | Callback al guardar borrador                                |
| `onPublish`   | `(page: Page) => void`     |           | Callback al publicar                                        |

### `<AtlasWebRenderer>`

| Prop   | Tipo                    | Requerido | Descripción                                |
| ------ | ----------------------- | --------- | ------------------------------------------ |
| `page` | `Page`                  | ✓         | Objeto página (parseado con `parsePage()`) |
| `mode` | `'public' \| 'preview'` |           | `'public'` desactiva el editing inline     |

### `<AtlasWebBuilderProvider>`

Envuelve el renderer standalone cuando se usa fuera del editor.

| Prop        | Tipo                | Descripción         |
| ----------- | ------------------- | ------------------- |
| `blocks`    | `BlockDefinition[]` | Registro de bloques |
| `theme`     | `Theme`             | Tema a aplicar      |
| `assets`    | `AssetSource`       | Fuente de medios    |
| `resources` | `object`            | Fetchers de datos   |

### `defineBlock(def)`

| Campo          | Tipo                        | Descripción                               |
| -------------- | --------------------------- | ----------------------------------------- |
| `type`         | `string`                    | Identificador único (e.g. `'HeroBlock'`)  |
| `label`        | `string`                    | Nombre visible en la paleta               |
| `category`     | `string`                    | Categoría en la paleta                    |
| `icon`         | `string`                    | Icono (ver lista en `BlockIcon.jsx`)      |
| `defaultProps` | `object`                    | Valores por defecto de props              |
| `fields`       | `Record<string, FieldSpec>` | Controles del panel de propiedades        |
| `groups`       | `{label, fields[]}[]`       | Agrupa campos en secciones colapsables    |
| `slots`        | `Record<string, {}>`        | Slots donde pueden anidarse otros bloques |
| `render`       | `(props, ctx) => JSX`       | Función de renderizado                    |

### Tipos de campo (`fields`)

| `type`       | Control                          | Notas                                            |
| ------------ | -------------------------------- | ------------------------------------------------ |
| `text`       | Input texto                      | —                                                |
| `textarea`   | Textarea                         | —                                                |
| `select`     | Select / dropdown                | Requiere `options: string[] \| {value,label}[]`  |
| `toggle`     | Checkbox switch                  | —                                                |
| `link`       | Input URL con validación         | —                                                |
| `image`      | Picker de imagen                 | Abre el modal de medios                          |
| `color`      | Color picker nativo              | —                                                |
| `background` | Editor de fondo                  | Sólido, gradiente o imagen                       |
| `number`     | Input numérico                   | —                                                |
| `richtext`   | Editor rich text                 | —                                                |
| `animation`  | Selector de animación de entrada | Preset, duración, delay, curva                   |
| `filter`     | Controles de filtros CSS         | Blur, brillo, contraste, escala de grises, sepia |
| `hover`      | Controles de efecto hover        | Escala, sombra, brillo, duración, curva          |
| `transform`  | Sliders de transformación        | Rotación y distorsión (skewX / skewY)            |

### `serializePage(page, options?) → string`

Serializa a JSON. Lanza `PageValidationError` si el esquema es inválido.

### `parsePage(json) → Page`

Parsea y migra automáticamente páginas de versiones antiguas del esquema.

### `createInMemoryAssetSource(initial?)`

Crea un AssetSource en memoria para desarrollo. Soporta `list()`, `upload()`, `remove()`, `subscribe()`.

### Componentes y helpers de efectos

| Export                | Tipo       | Descripción                                                                   |
| --------------------- | ---------- | ----------------------------------------------------------------------------- |
| `EffectsWrapper`      | Componente | Aplica todos los efectos universales. Usado internamente por `BlockRenderer`. |
| `AnimationField`      | Componente | Control de campo para animaciones de entrada.                                 |
| `FilterField`         | Componente | Control de campo para filtros CSS.                                            |
| `HoverField`          | Componente | Control de campo para efectos hover.                                          |
| `TransformField`      | Componente | Control de campo para transformaciones (rotate, skew).                        |
| `resolveAnimation(v)` | Función    | Convierte `AnimationValue` a string CSS `animation`.                          |
| `resolveFilter(v)`    | Función    | Convierte `FilterValue` a string CSS `filter`.                                |
| `resolveTransform(v)` | Función    | Convierte `TransformValue` a string CSS `transform`.                          |

---

## Configuración de Vite (proyecto consumidor)

No se requiere ninguna configuración especial. El paquete distribuye ESM + CJS pre-compilados.

```js
// vite.config.js del proyecto consumidor — sin cambios especiales
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

> Si usas **Next.js**, añade el paquete a `transpilePackages` en `next.config.js`:
>
> ```js
> module.exports = { transpilePackages: ['@racoondevs/atlas-web-builder'] }
> ```

---

## Desarrollo local del paquete

```bash
# En la raíz del monorepo:
pnpm install

# Compilar la librería (ESM + CJS + CSS → dist/)
pnpm build

# Watch mode (reconstruye al guardar)
pnpm dev

# Tests
pnpm test

# Lint
pnpm lint

# Playground de desarrollo (fuente directa, HMR instantáneo)
cd examples/playground && pnpm dev
```

---

## License

MIT © RacoonDevs
