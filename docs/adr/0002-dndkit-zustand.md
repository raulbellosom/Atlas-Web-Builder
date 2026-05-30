# ADR 0002 — dnd-kit + zustand + immer for the editor core

- **Status:** Accepted
- **Date:** 2026-05-30
- **Deciders:** Atlas ERP frontend team

## Context

The custom engine ([ADR 0001](./0001-custom-engine.md)) needs three foundational pieces:

1. A **drag-and-drop layer** with accessible keyboard support and modern sensors.
2. A **state container** for the editor tree that is fast under high-frequency mutations, supports undo/redo, and stays simple to subscribe to from React.
3. An **immutable update strategy** that keeps the flat block dictionary cheap to clone.

## Decision

- **Drag & drop:** `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (MIT).
- **State:** `zustand` (MIT), one editor store created per `<AtlasWebBuilderEditor>` instance.
- **Immutability:** `immer` (MIT) via `zustand`'s `immer` middleware.
- **History:** `zundo` (MIT) middleware on the same store, capped at 50 entries.
- **IDs:** `nanoid` (MIT) for new block ids and snapshot fingerprints.

## Alternatives considered

| Concern   | Alternative                | Why rejected                                                            |
| --------- | -------------------------- | ----------------------------------------------------------------------- |
| DnD       | `react-dnd`                | Mature but heavier API, weaker keyboard a11y story than dnd-kit.        |
| DnD       | HTML5 native DnD           | Inconsistent across browsers, poor a11y, painful for nested zones.      |
| DnD       | `react-grid-layout`        | Free-positioning paradigm — wrong fit for section-stacking UX.          |
| State     | Redux Toolkit              | Overkill for a self-contained editor; boilerplate not justified.        |
| State     | React Context + useReducer | Re-renders the whole subtree; poor perf at the layers/properties scale. |
| State     | Jotai / Recoil             | Fine, but atom granularity adds friction for a single document tree.    |
| Immutable | Manual spreads             | Verbose and error-prone for nested updates.                             |
| History   | Hand-rolled stack          | We'd reinvent zundo; zundo integrates cleanly with zustand.             |

## Consequences

### Positive

- Accessible drag/drop out of the box (keyboard, screen reader, touch).
- One store per editor → multiple editors can coexist (rare but useful for previews).
- Subscriptions are fine-grained (`useStore(s => s.selectedId)`) → properties panel only re-renders on its own slice.
- `immer` makes nested updates read like mutable code while staying immutable.
- All deps are MIT and actively maintained.

### Negative

- `dnd-kit` requires careful sensor configuration to feel native; we will need integration tests for drag/drop edge cases.
- `zundo` snapshots the whole store by default — we will configure it to track only the content tree, not transient UI state (panel toggles, hover ids).
- `immer` can be slow on very deep trees; mitigated by our **flat block dictionary** (see [ADR 0003](./0003-json-schema.md)).

## Implementation notes

- Place the store factory in `src/provider/createBuilderStore.js` and expose it via `BuilderContext`.
- Configure `zundo` with a `partialize` that returns only `{ site, draftPages, theme }` and a `equality` function that ignores `updatedAt` to avoid duplicate undo entries on identical edits.
- Use `dnd-kit`'s `useSortable` for the layers panel and section reordering, and `useDraggable` + `useDroppable` for palette-to-canvas drags.
- Provide `PointerSensor`, `KeyboardSensor`, and a constrained `TouchSensor` (long-press activation) by default.
