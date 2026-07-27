# ctx.resource() Real Implementation + Docs Completeness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@raulbellosom/atlas-web-builder` match its own documentation — implement the `ctx.resource()` data-fetching hook and `ResourceBoundary` for real, fix the wrong npm scope and version drift in the docs, complete the API reference, then ship `0.2.0` and bump atlaserp-v2's dependency.

**Architecture:** A new internal hook (`useResource`) backs both `ctx.resource()` (wired into `BlockRenderer`) and `ResourceBoundary` (rewritten from a dead stub into a real render-prop wrapper over the same hook). No public API is removed or renamed — this only makes previously-broken/undocumented surface actually work and be documented.

**Tech Stack:** React 18 (hooks), Vite 5 (lib build), Vitest 2 + @testing-library/react 16 (jsdom), pnpm.

---

## Spec

`docs/superpowers/specs/2026-07-27-ctx-resource-fix-design.md`

## Repos touched

- `D:\RacoonDevs\atlas-web-builder` (source of the npm package) — Tasks 1–9
- `D:\RacoonDevs\atlaserp-v2` (consumer) — Task 10

All commands below assume the working directory is `D:\RacoonDevs\atlas-web-builder` unless a task says otherwise. **No commit in this plan includes any AI/Claude co-authorship trailer** — plain `git commit -m "..."` only, per explicit instruction.

---

### Task 1: Fix the npm scope typo across the README (`@racoondevs` → `@raulbellosom`)

**Files:**
- Modify: `README.md`

The README title, install instructions, and every code example reference the wrong
npm scope. The published package is `@raulbellosom/atlas-web-builder`; the README says
`@racoondevs/atlas-web-builder` everywhere (18 occurrences), including the very first
install command — copy-pasting it 404s.

- [ ] **Step 1: Replace every occurrence**

Open `README.md` and replace **all 18 occurrences** of `@racoondevs/atlas-web-builder`
with `@raulbellosom/atlas-web-builder` (this covers the title, the `pnpm add` / `npm
install` / `yarn add` lines, every `import ... from '@racoondevs/atlas-web-builder'` and
`import '@racoondevs/atlas-web-builder/styles'` in every code example, and the
`transpilePackages: ['@racoondevs/atlas-web-builder']` Next.js note). Do not touch the
`## License` line (`MIT © RacoonDevs`) — that is a copyright holder name, not the npm
scope, and is correct as-is.

- [ ] **Step 2: Verify no bad references remain**

Run: `grep -c "@racoondevs/atlas-web-builder" README.md`
Expected: command exits non-zero / reports no matches (grep returns 1 when there are no
matches). If it still reports matches, repeat Step 1 for the ones missed.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: fix npm scope typo (@racoondevs -> @raulbellosom) throughout README"
```

---

### Task 2: Fix the version constant drift + add a guardrail test

**Files:**
- Modify: `src/index.js:12`
- Create: `src/__tests__/version.test.js`

`src/index.js` exports `version = '0.0.2'` claiming it's "kept in lockstep with
package.json", but `package.json` says `0.1.0`. Fix the value now and add a test so this
can't silently drift again.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/version.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { version } from '../index.js'
import pkg from '../../package.json'

describe('package version', () => {
  it('keeps the exported version constant in sync with package.json', () => {
    expect(version).toBe(pkg.version)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm vitest run src/__tests__/version.test.js`
Expected: FAIL — `expected '0.0.2' to be '0.1.0'`

- [ ] **Step 3: Fix the constant**

In `src/index.js`, change:

```js
export const version = '0.0.2'
```

to:

```js
export const version = '0.1.0'
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm vitest run src/__tests__/version.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.js src/__tests__/version.test.js
git commit -m "fix: sync exported version constant with package.json, add drift guard test"
```

---

### Task 3: Implement the `useResource` hook

**Files:**
- Create: `src/renderer/useResource.js`
- Create: `src/__tests__/resource.test.jsx`

This is the internal hook that will back both `ctx.resource()` and `ResourceBoundary`.
It takes a resources map (`ctx.resources`), a resource name, and params; returns
`{ data, loading, error, empty }`; refetches when `params` change; and ignores
late-arriving responses after unmount or after params change again (no
setState-after-unmount, no stale overwrite races).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/resource.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useResource } from '../renderer/useResource.js'
import { ResourceBoundary } from '../renderer/ResourceBoundary.jsx'

function Harness({ resourcesMap, name, params, exposeState }) {
  const state = useResource(resourcesMap, name, params)
  exposeState(state)
  return <div data-testid="state">{state.loading ? 'loading' : 'settled'}</div>
}

function setup(initialProps) {
  let state
  const exposeState = (s) => {
    state = s
  }
  const utils = render(<Harness {...initialProps} exposeState={exposeState} />)
  return {
    getState: () => state,
    rerenderWith: (props) => utils.rerender(<Harness {...props} exposeState={exposeState} />),
    unmount: utils.unmount,
  }
}

describe('useResource', () => {
  it('starts in a loading state', () => {
    const { getState } = setup({
      resourcesMap: { products: () => Promise.resolve([]) },
      name: 'products',
      params: {},
    })
    expect(getState().loading).toBe(true)
    expect(getState().data).toBeUndefined()
  })

  it('resolves data and flips loading to false', async () => {
    const { getState } = setup({
      resourcesMap: { products: () => Promise.resolve([{ id: '1', name: 'Silla' }]) },
      name: 'products',
      params: {},
    })
    await waitFor(() => expect(getState().loading).toBe(false))
    expect(getState().data).toEqual([{ id: '1', name: 'Silla' }])
    expect(getState().error).toBeNull()
    expect(getState().empty).toBe(false)
  })

  it('marks empty when the resolved value is an empty array', async () => {
    const { getState } = setup({
      resourcesMap: { products: () => Promise.resolve([]) },
      name: 'products',
      params: {},
    })
    await waitFor(() => expect(getState().loading).toBe(false))
    expect(getState().empty).toBe(true)
  })

  it('captures an error when the fetcher rejects', async () => {
    const { getState } = setup({
      resourcesMap: { products: () => Promise.reject(new Error('network down')) },
      name: 'products',
      params: {},
    })
    await waitFor(() => expect(getState().loading).toBe(false))
    expect(getState().error).toBeInstanceOf(Error)
    expect(getState().error.message).toBe('network down')
  })

  it('errors clearly when the named resource is not registered', async () => {
    const { getState } = setup({ resourcesMap: {}, name: 'products', params: {} })
    await waitFor(() => expect(getState().loading).toBe(false))
    expect(getState().error.message).toMatch(/No resource registered for "products"/)
  })

  it('refetches when params change', async () => {
    const fetcher = vi.fn((p) => Promise.resolve(p.page))
    const resourcesMap = { products: fetcher }
    const { getState, rerenderWith } = setup({ resourcesMap, name: 'products', params: { page: 1 } })
    await waitFor(() => expect(getState().data).toBe(1))

    rerenderWith({ resourcesMap, name: 'products', params: { page: 2 } })
    await waitFor(() => expect(getState().data).toBe(2))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not update state after unmount', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let resolveFetch
    const fetcher = () => new Promise((resolve) => { resolveFetch = resolve })
    const { unmount } = setup({ resourcesMap: { products: fetcher }, name: 'products', params: {} })
    unmount()
    resolveFetch([{ id: '1' }])
    await new Promise((r) => setTimeout(r, 0))
    const warned = consoleError.mock.calls.some((args) =>
      String(args[0]).includes('Cannot update a component'),
    )
    expect(warned).toBe(false)
    consoleError.mockRestore()
  })
})

describe('ResourceBoundary', () => {
  it('passes data/loading/error/empty through to its render-prop children, scoped by ctx', async () => {
    const ctx = { resources: { products: () => Promise.resolve([{ id: '1' }]) } }
    render(
      <ResourceBoundary ctx={ctx} resource="products" query={{}}>
        {({ data, loading }) => (
          <p data-testid="rb">{loading ? 'loading' : JSON.stringify(data)}</p>
        )}
      </ResourceBoundary>,
    )
    expect(screen.getByTestId('rb').textContent).toBe('loading')
    await waitFor(() => expect(screen.getByTestId('rb').textContent).toBe('[{"id":"1"}]'))
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm vitest run src/__tests__/resource.test.jsx`
Expected: FAIL — `Failed to resolve import "../renderer/useResource.js"` (module doesn't exist yet), and `ResourceBoundary` import failing too since its current stub doesn't accept these props.

- [ ] **Step 3: Implement the hook**

Create `src/renderer/useResource.js`:

```js
import { useEffect, useState } from 'react'

/**
 * @typedef {Object} ResourceState
 * @property {unknown}    data
 * @property {boolean}    loading
 * @property {Error|null} error
 * @property {boolean}    empty
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isEmptyValue(value) {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * Fetch a host-registered resource by name and track its data/loading/error
 * state. Backs `ctx.resource()` and `<ResourceBoundary>`.
 *
 * Must be called unconditionally from a real function component — the same
 * rule as any other React hook. `ctx.resource()` works because block
 * `render` functions are invoked via JSX (`<Component ctx={ctx} />`), so
 * they are themselves function components and can call hooks in their body.
 *
 * @param {Object<string, Function>|undefined|null} resourcesMap - Usually `ctx.resources`.
 * @param {string} name - Key registered by the host in its `resources` prop.
 * @param {unknown} [params] - Arguments passed to the fetcher.
 * @returns {ResourceState}
 */
export function useResource(resourcesMap, name, params) {
  const fetcher = resourcesMap ? resourcesMap[name] : undefined
  const paramsKey = JSON.stringify(params ?? null)
  const [state, setState] = useState({ data: undefined, loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    if (typeof fetcher !== 'function') {
      setState({
        data: undefined,
        loading: false,
        error: new Error(`[atlas-web-builder] No resource registered for "${name}".`),
      })
      return undefined
    }

    setState({ data: undefined, loading: true, error: null })

    Promise.resolve()
      .then(() => fetcher(params))
      .then((data) => {
        if (cancelled) return
        setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        setState({ data: undefined, loading: false, error })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, name, paramsKey])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    empty: !state.loading && !state.error && isEmptyValue(state.data),
  }
}
```

- [ ] **Step 4: Rewrite `ResourceBoundary` on top of the hook**

Replace the full contents of `src/renderer/ResourceBoundary.jsx` with:

```jsx
import { useResource } from './useResource.js'

/**
 * @typedef {Object} ResourceBoundaryRenderProps
 * @property {unknown}    data
 * @property {boolean}    loading
 * @property {Error|null} error
 * @property {boolean}    empty
 */

/**
 * Render-prop alternative to `ctx.resource()`. Must be rendered inside a
 * block's `render` function, passing that block's own `ctx` through, so it
 * resolves against the correctly-scoped `ctx.resources` (host resources in
 * public/preview mode, `mockResources` in edit mode).
 *
 * @param {{
 *   ctx: { resources?: Object<string, Function> },
 *   resource: string,
 *   query?: unknown,
 *   children: (state: ResourceBoundaryRenderProps) => React.ReactNode,
 * }} props
 */
export function ResourceBoundary({ ctx, resource, query, children }) {
  const state = useResource(ctx ? ctx.resources : undefined, resource, query)
  return typeof children === 'function' ? children(state) : null
}
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `pnpm vitest run src/__tests__/resource.test.jsx`
Expected: PASS (8 tests)

- [ ] **Step 6: Commit**

```bash
git add src/renderer/useResource.js src/renderer/ResourceBoundary.jsx src/__tests__/resource.test.jsx
git commit -m "feat: implement useResource hook and rewire ResourceBoundary on top of it"
```

---

### Task 4: Wire `ctx.resource()` into `BlockRenderer`

**Files:**
- Modify: `src/renderer/BlockRenderer.jsx`
- Modify: `src/__tests__/renderer.test.jsx`

- [ ] **Step 1: Write the failing test**

In `src/__tests__/renderer.test.jsx`, change the import line:

```js
import { render, screen } from '@testing-library/react'
```

to:

```js
import { render, screen, waitFor } from '@testing-library/react'
```

Then add this test inside the existing `describe('AtlasWebRenderer', ...)` block (after
the last `it(...)`):

```jsx
  it('wires ctx.resource() to the resources registered on the provider', async () => {
    const ListDef = defineBlock({
      type: 'ProductListBlock',
      label: 'Lista',
      render: ({ ctx }) => {
        const { data, loading } = ctx.resource('products', {})
        return <p data-testid="list">{loading ? 'loading' : JSON.stringify(data)}</p>
      },
    })
    const listPage = {
      schemaVersion: 1,
      id: 'page_list',
      slug: '/list',
      title: 'Lista',
      visibility: 'public',
      layoutId: null,
      regions: { main: { id: 'region_main', children: ['blk_list_1'] } },
      blocks: {
        blk_list_1: { id: 'blk_list_1', type: 'ProductListBlock', props: {}, children: {} },
      },
    }
    render(
      <AtlasWebBuilderProvider
        blocks={[ListDef]}
        resources={{ products: () => Promise.resolve([{ id: '1' }]) }}
      >
        <AtlasWebRenderer page={listPage} mode="public" />
      </AtlasWebBuilderProvider>,
    )
    expect(screen.getByTestId('list').textContent).toBe('loading')
    await waitFor(() => expect(screen.getByTestId('list').textContent).toBe('[{"id":"1"}]'))
  })
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm vitest run src/__tests__/renderer.test.jsx`
Expected: FAIL — `ctx.resource is not a function`

- [ ] **Step 3: Wire it up**

In `src/renderer/BlockRenderer.jsx`, change the import block:

```js
import { memo } from 'react'
import { useBuilder } from '../provider/BuilderContext.js'
import { useTheme } from '../theme/ThemeProvider.jsx'
import { useEditorRender } from '../editor/dnd/EditorRenderContext.js'
import { createInlineTextHelper } from '../editor/inline/InlineText.jsx'
import { EffectsWrapper } from './EffectsWrapper.jsx'
```

to:

```js
import { memo } from 'react'
import { useBuilder } from '../provider/BuilderContext.js'
import { useTheme } from '../theme/ThemeProvider.jsx'
import { useEditorRender } from '../editor/dnd/EditorRenderContext.js'
import { createInlineTextHelper } from '../editor/inline/InlineText.jsx'
import { EffectsWrapper } from './EffectsWrapper.jsx'
import { useResource } from './useResource.js'
```

Then change:

```js
  const ctx = {
    mode,
    theme,
    resources: mode === 'edit' ? mockResources || resources : resources,
    actions,
    permissions,
    slot,
    blockId,
  }
  ctx.inlineText = createInlineTextHelper(ctx)
```

to:

```js
  const ctx = {
    mode,
    theme,
    resources: mode === 'edit' ? mockResources || resources : resources,
    actions,
    permissions,
    slot,
    blockId,
  }
  ctx.inlineText = createInlineTextHelper(ctx)
  ctx.resource = (name, params) => useResource(ctx.resources, name, params)
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `pnpm vitest run src/__tests__/renderer.test.jsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/renderer/BlockRenderer.jsx src/__tests__/renderer.test.jsx
git commit -m "feat: wire ctx.resource() into BlockRenderer"
```

---

### Task 5: Rewrite the broken `ctx.resource()` README example

**Files:**
- Modify: `README.md`

The section "Bloque con contenido dinámico (resources)" currently shows
`ctx.resource('products', {...})` returning `{ data, loading }` with no indication this
is a hook, no error handling, and no mention of the `ResourceBoundary` alternative.

- [ ] **Step 1: Replace the section**

Find this block in `README.md` (under the heading `### Bloque con contenido dinámico
(resources)`):

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
```

Replace it with:

```
### Bloque con contenido dinámico (ctx.resource())

`ctx.resource(name, params)` es un hook — debe llamarse de forma **incondicional** en el
cuerpo de `render`, igual que cualquier hook de React (no dentro de un `if`, un loop, ni
después de un `return` temprano).

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
    const { data: products, loading, error } = ctx.resource('products', { categoryId, limit })
    if (loading) return <p>Cargando…</p>
    if (error) return <p>No se pudieron cargar los productos.</p>
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

> **Importante:** el objeto `resources` debe ser referencialmente estable entre renders
> del host (envuélvelo en `useMemo`/`useCallback`, o defínelo fuera del componente). Si
> pasas un objeto literal nuevo en cada render, `ctx.resource()` volverá a pedir los
> datos en cada render de tu app anfitriona.

`ctx.resource()` devuelve:

| Campo     | Tipo          | Descripción                                                            |
| --------- | ------------- | ------------------------------------------------------------------------- |
| `data`    | `unknown`     | El valor resuelto por el fetcher. `undefined` mientras carga.             |
| `loading` | `boolean`     | `true` mientras la promesa está pendiente.                                |
| `error`   | `Error\|null` | Error del fetcher, o "resource no registrado" si el nombre no existe.     |
| `empty`   | `boolean`     | `true` cuando ya resolvió y el valor es `null`/`undefined`/`[]`.          |

Se vuelve a pedir el dato automáticamente cuando cambian `params` (comparados por
`JSON.stringify`).

### Alternativa: `<ResourceBoundary>` (render prop)

Si prefieres no usar un hook directamente en `render`, `ResourceBoundary` expone el
mismo estado como render prop. Debes pasarle el `ctx` del bloque para que resuelva
contra el `resources` correcto (host en público/preview, `mockResources` en modo
edición):

```jsx
import { ResourceBoundary } from '@raulbellosom/atlas-web-builder'

render: ({ categoryId, limit, ctx }) => (
  <ResourceBoundary ctx={ctx} resource="products" query={{ categoryId, limit }}>
    {({ data: products, loading, error }) => {
      if (loading) return <p>Cargando…</p>
      if (error) return <p>No se pudieron cargar los productos.</p>
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {(products || []).map((p) => (
            <div key={p.id}>{p.name}</div>
          ))}
        </div>
      )
    }}
  </ResourceBoundary>
),
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: fix ctx.resource() example, document its real contract and ResourceBoundary"
```

---

### Task 6: Complete the API reference table

**Files:**
- Modify: `README.md`

The "API de referencia" section documents roughly half of `index.js`'s exports. Add the
missing ones.

- [ ] **Step 1: Insert the new tables**

Find this block in `README.md` (the end of the "Componentes y helpers de efectos" table,
right before the Vite config section):

```
| `resolveTransform(v)` | Función    | Convierte `TransformValue` a string CSS `transform`.                          |

---

## Configuración de Vite (proyecto consumidor)
```

Replace it with:

```
| `resolveTransform(v)` | Función    | Convierte `TransformValue` a string CSS `transform`.                          |

### Contexto y estado del builder

| Export             | Tipo             | Descripción                                                                          |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `useBuilder()`      | Hook             | Lee el contexto del builder (`blocks`, `resources`, `theme`, `actions`, `permissions`). Debe usarse dentro de `<AtlasWebBuilderProvider>`. |
| `BuilderContext`    | `React.Context`  | Contexto crudo, para casos avanzados que no puedan usar el hook.                     |
| `getVersion()`      | Función          | Devuelve la versión instalada del paquete.                                           |
| `version`           | `string`         | Constante con la versión instalada del paquete.                                      |

### Tema (avanzado)

| Export                  | Tipo       | Descripción                                                              |
| ------------------------ | ---------- | --------------------------------------------------------------------------- |
| `ThemeProvider`          | Componente | Provee el tema activo. `AtlasWebBuilderProvider` ya lo envuelve internamente. |
| `useTheme()`             | Hook       | Devuelve el `Theme` activo.                                                |
| `useThemeTokens()`       | Hook       | Devuelve solo los `tokens` del tema activo.                                |
| `applyThemeVars(theme)`  | Función    | Convierte un `Theme` en variables CSS (`--atlas-*`).                       |

### Renderer (avanzado)

| Export             | Tipo       | Descripción                                                                              |
| ------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `BlockRenderer`     | Componente | Renderiza un bloque individual por id. Usado internamente por `AtlasWebRenderer`; expuesto para composición avanzada. |
| `SafeRichText`      | Componente | Renderiza HTML sanitizado (usado por `RichTextBlock`).                                       |
| `ResourceBoundary`  | Componente | Alternativa de render prop a `ctx.resource()`. Ver "Bloque con contenido dinámico" más arriba. |

### Persistencia y schema (avanzado)

| Export                                | Tipo    | Descripción                                                                    |
| --------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `migrateContent(raw)`                   | Función | Migra contenido crudo de página a la versión de esquema actual. Usado internamente por `AtlasWebRenderer` y `parsePage`. |
| `CURRENT_SCHEMA_VERSION`                | `number`| Versión de esquema actual del paquete.                                             |
| `validatePage(page)`                    | Función | Valida la forma de una `Page`. Lanza `PageValidationError` si es inválida.          |
| `garbageCollect(page)`                  | Función | Elimina bloques huérfanos (no referenciados desde ninguna región/slot).             |
| `regenerateIds(page)`                   | Función | Regenera todos los ids de bloques/regiones (útil al duplicar página o plantilla).   |
| `listUnknownBlockTypes(page, blocks)`   | Función | Devuelve los tipos de bloque de la página que no están en el registro dado.         |
| `PageValidationError`                   | Clase   | Error lanzado por `serializePage`/`validatePage` cuando el esquema es inválido.      |

### Templates y layouts (funciones avanzadas)

| Export                                  | Tipo    | Descripción                                                          |
| ------------------------------------------ | ------- | ------------------------------------------------------------------------ |
| `createTemplateRegistry(templates)`     | Función | Crea el registro de plantillas usado internamente por el editor.        |
| `applyTemplate(page, template, opts?)`  | Función | Inserta el resultado de `template.build()` dentro de una página existente. |
| `defineLayout(def)`                     | Función | Define un layout de regiones reutilizable.                              |
| `createLayoutRegistry(layouts)`         | Función | Crea el registro de layouts usado internamente por el editor.           |
| `applyLayoutToDraft(page, layout)`      | Función | Aplica un layout a una página en edición.                               |

### Assets (avanzado)

| Export        | Tipo       | Descripción                                                                                  |
| -------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `AssetPicker`  | Componente | Modal de selección/subida de medios usado internamente por el editor. Expuesto para UI propia. |

### Edición en línea y fondos

| Export                        | Tipo       | Descripción                                                                |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `InlineText`                    | Componente | Envoltorio de edición de texto en línea, usado por bloques de texto en modo `edit`. |
| `createInlineTextHelper(ctx)`   | Función    | Crea el helper `ctx.inlineText` — ya incluido en el `ctx` de cada bloque.       |
| `resolveBackground(value)`      | Función    | Normaliza un valor de campo `background` (sólido, gradiente o imagen).         |
| `resolveBackgroundCss(value)`   | Función    | Convierte un valor de `background` a propiedades CSS.                          |
| `BackgroundField`               | Componente | Control de campo para el tipo `background`.                                    |

### Notificaciones

| Export                   | Tipo       | Descripción                                                                          |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `NotificationsProvider`    | Componente | Provee el sistema de notificaciones del editor (toasts de guardado, errores, etc.).      |
| `useNotifications()`       | Hook       | Dispara notificaciones (`notify`, `dismiss`, `clear`) desde código propio.                |
| `NotificationCenter`       | Componente | Renderiza las notificaciones activas. Ya incluido dentro de `AtlasWebBuilderEditor`.     |

### Editor: store y campos (avanzado)

| Export                       | Tipo       | Descripción                                                                        |
| ------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `EditorStoreProvider`           | Componente | Provee el store de Zustand del editor. Ya incluido dentro de `AtlasWebBuilderEditor`.    |
| `useEditorStore(selector)`      | Hook       | Lee el estado del editor (página en edición, selección, historial, etc.).                |
| `useEditorStoreInstance()`      | Hook       | Devuelve la instancia cruda del store (uso avanzado fuera de un selector).               |
| `useTemporal()`                 | Hook       | Expone undo/redo (`zundo`) del store del editor.                                         |
| `createEditorStore(opts)`       | Función    | Crea una instancia de store de editor fuera de React (uso avanzado/testing).             |
| `DEVICE_WIDTHS`                 | `object`   | Anchos predefinidos para la vista previa responsive del editor (`mobile`, `tablet`, `desktop`). |
| `defaultFields`                 | `object`   | Registro de tipos de campo incluidos de serie. Combínalo con tus campos propios para `fieldTypes`. |
| `defineField(def)`              | Función    | Define un tipo de campo personalizado (alternativa explícita a un componente suelto).    |

### Bloques base (componentes individuales)

Cada bloque de `baseBlocks` también se exporta de forma individual, por si quieres
registrar solo algunos: `SectionBlock`, `ContainerBlock`, `HeadingBlock`, `TextBlock`,
`ImageBlock`, `ButtonBlock`, `SpacerBlock`, `DividerBlock`, `ColumnsBlock`, `GridBlock`,
`HeroBlock`, `RichTextBlock`, `CardBlock`, `TestimonialBlock`, `PricingBlock`,
`NavbarBlock`, `FooterBlock`, `VideoBlock`. `baseBlockCategories` describe las
categorías usadas en la paleta del editor.

---

## Configuración de Vite (proyecto consumidor)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: complete API reference table with previously-undocumented exports"
```

---

### Task 7: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all test files pass, including the new `version.test.js` and `resource.test.jsx`.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: no errors. (The `react-hooks/exhaustive-deps` disable comment in
`useResource.js` is intentional — see Task 3 — confirm lint doesn't flag anything else.)

- [ ] **Step 3: Run the library build**

Run: `pnpm build`
Expected: builds successfully, `dist/atlas-web-builder.js`, `dist/atlas-web-builder.cjs`,
and `dist/style.css` are produced with no errors.

If any of these three steps fail, stop and fix the underlying issue before continuing —
do not proceed to the version bump/publish tasks with a red build.

---

### Task 8: Bump to 0.2.0

**Files:**
- Modify: `package.json:3`
- Modify: `src/index.js:12`

- [ ] **Step 1: Bump `package.json`**

Change:

```json
  "version": "0.1.0",
```

to:

```json
  "version": "0.2.0",
```

- [ ] **Step 2: Bump the exported version constant**

In `src/index.js`, change:

```js
export const version = '0.1.0'
```

to:

```js
export const version = '0.2.0'
```

- [ ] **Step 3: Confirm the drift guard test still passes**

Run: `pnpm vitest run src/__tests__/version.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add package.json src/index.js
git commit -m "chore: bump version to 0.2.0"
```

---

### Task 9: Publish to npm

**Files:** none

**This step publishes publicly to the npm registry and cannot be undone (npm does not
allow re-publishing the same version number again, even after unpublishing). Confirm
with Raul immediately before running the publish command, even though he has already
authorized this task in principle** — a last check that Task 7's verification actually
passed clean on this machine, right before the irreversible step.

- [ ] **Step 1: Rebuild clean**

Run: `pnpm build`
Expected: succeeds (repeat of Task 7 Step 3, run again post-bump to be certain the
published `dist/` reflects the `0.2.0` state).

- [ ] **Step 2: Publish**

Run: `npm publish --access public`
Expected: output ends with `+ @raulbellosom/atlas-web-builder@0.2.0`

- [ ] **Step 3: Verify on the registry**

Run: `npm view @raulbellosom/atlas-web-builder version`
Expected: `0.2.0`

---

### Task 10: Bump the dependency in atlaserp-v2

**Files (in `D:\RacoonDevs\atlaserp-v2`):**
- Modify: `apps/desktop/package.json`
- Modify: `pnpm-lock.yaml` (via `pnpm install`, not by hand)

- [ ] **Step 1: Bump the dependency**

In `D:\RacoonDevs\atlaserp-v2\apps\desktop\package.json`, change:

```json
    "@raulbellosom/atlas-web-builder": "^0.1.0",
```

to:

```json
    "@raulbellosom/atlas-web-builder": "^0.2.0",
```

- [ ] **Step 2: Refresh the lockfile**

Run (from `D:\RacoonDevs\atlaserp-v2`): `pnpm install`
Expected: resolves `@raulbellosom/atlas-web-builder@0.2.0`, lockfile updates, no errors.

- [ ] **Step 3: Sanity check nothing broke**

Run (from `D:\RacoonDevs\atlaserp-v2`): `node --check apps/desktop/src/website/WebsitePageRenderer.jsx`
Expected: no output (syntax OK). No block in `apps/desktop/src/website/atlasBlocks/`
calls `ctx.resource()` or `ResourceBoundary` yet, so no behavior change is expected here
— this bump only makes the capability available for future use.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/package.json pnpm-lock.yaml
git commit -m "chore: bump @raulbellosom/atlas-web-builder to 0.2.0"
```

---

## Self-review notes

- **Spec coverage:** Task 3–4 cover design §1 (`ctx.resource()` hook), Task 3 covers §2
  (`ResourceBoundary`), Task 2 covers §3 (version sync), Tasks 5–6 cover §4 (README
  completeness), Task 3–4 cover §5 (tests), Tasks 8–10 cover §6 (versioning/release).
  Task 1 (npm scope typo) was found during plan-writing, not in the original spec — it's
  a direct instance of the spec's stated goal ("make the published package match its own
  documentation... so anyone can use it") and is included for that reason.
- **Type/name consistency:** `useResource(resourcesMap, name, params)` signature is
  identical everywhere it's called (Task 3 hook definition, Task 3 `ResourceBoundary`,
  Task 4 `BlockRenderer` wiring). Return shape `{ data, loading, error, empty }` is
  consistent across the hook, `ctx.resource()`, `ResourceBoundary`, all tests, and the
  README.
