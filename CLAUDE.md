# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Library build (ESM + CJS + CSS → dist/)
pnpm build

# Watch mode for local development of the library
pnpm dev

# Lint
pnpm lint

# Tests (all, single run)
pnpm test

# Tests (watch mode)
pnpm test:watch

# Run a single test file
pnpm test -- --run src/__tests__/store.test.js

# Playground (demo app, from examples/playground/)
cd examples/playground && pnpm dev
```

## Architecture

This is a **React library** (`@racoondevs/atlas-web-builder`) built with Vite in library mode. It ships as `dist/atlas-web-builder.{js,cjs}` + `dist/style.css`. All runtime dependencies (`zustand`, `immer`, `zundo`, `@dnd-kit/*`, `clsx`, etc.) are externalized — they're peer deps of the consuming app.

### Data model

A **Page** document is the core unit of persistence:
```
Page
  └─ regions: { [name]: { id, children: string[] } }   ← ordered block IDs per region
  └─ blocks:  { [id]: { id, type, props, children } }  ← flat block map
```
Blocks can nest by storing child IDs in `block.children[slotName][]`. Layouts (Phase 8A) are declarative definitions of which regions exist; applying one mutates `page.regions`. The page schema lives in `src/schema/` and is versioned via `src/schema/migrate.js`.

### State management

`createEditorStore` (`src/editor/store/createEditorStore.js`) uses **Zustand** with the **zundo** temporal middleware for undo/redo. Only `page` is tracked in history; `selectedId`, `device`, `theme`, `activeRegion` are transient UI state. `EditorStoreProvider` wraps the store in React context and exposes `useEditorStore(selector)`, `useTemporal(selector)`, and `useEditorStoreInstance()`.

### Block system

Blocks are defined with `defineBlock({ type, label, category, defaultProps, fields, render, variants? })`. The `fields` map drives the right-panel property editor — each key is a prop name and each value is a field spec `{ type: string, label, options? }`. Built-in field types are in `src/editor/fields/`. The `render` function is a pure component receiving merged props; it must output JSX using CSS variables from the theme (`colorVar`, `spacingVar`, `fontSizeVar` from `src/blocks/_tokens.js`).

Block registry is created by `createBlockRegistry()` and populated from the `blocks` prop of `AtlasWebBuilderEditor`. Templates (`defineTemplate`) and layouts (`defineLayout`) follow the same pattern.

### Editor chrome layout

The editor is a CSS Grid: `280px (left panel) | 1fr (canvas) | 320px (right panel)` with a `56px` top bar row. Everything lives under `atlas-wb-` prefixed class names (defined in `src/styles/editor.css`) to avoid host collisions. The canvas renders a responsive frame (1280 / 834 / 390 px) with DnD drop zones per region and per block slot.

### Theme system

Themes are objects with a `tokens` map. `applyThemeVars` writes CSS custom properties onto a DOM element (`--atlas-color-primary`, `--atlas-spacing-4`, etc.). `ThemeProvider` wraps a subtree and applies these vars. The editor stores the live theme in the store (`theme` state, outside undo history) so the ThemeTab can mutate tokens in real time.

### Key file locations

| Concern | Path |
|---|---|
| Public API surface | `src/index.js` |
| Editor entry component | `src/editor/AtlasWebBuilderEditor.jsx` |
| Zustand store | `src/editor/store/createEditorStore.js` |
| All editor CSS | `src/styles/editor.css` |
| Block definitions | `src/blocks/*.jsx` |
| Field controls | `src/editor/fields/*.jsx` |
| Tree mutation utils | `src/utils/tree.js` |
| Page schema + migration | `src/schema/` + `src/schema/migrate.js` |
| i18n strings (ES) | `src/editor/i18n/es.js` |
| Playground demo | `examples/playground/src/App.jsx` |

### Adding a new block

1. Create `src/blocks/MyBlock.jsx` using `defineBlock({ type, label, category, defaultProps, fields, render })`.
2. Export it from `src/blocks/index.js` and add it to the `baseBlocks` array.
3. Export from `src/index.js`.

### Adding a new field type

1. Create `src/editor/fields/MyField.jsx` — a controlled component receiving `{ value, onChange, label, spec }`.
2. Register it in `src/editor/fields/index.js` under `defaultFields`.
