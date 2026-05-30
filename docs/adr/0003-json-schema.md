# ADR 0003 — Flat JSON content schema with versioning

- **Status:** Accepted
- **Date:** 2026-05-30
- **Deciders:** Atlas ERP frontend team

## Context

Page content must be:

- **Serializable** to JSON (no functions, no JSX).
- **Safe** to render (allowlist enforced).
- **Cheap to mutate** under high-frequency editor operations.
- **Versioned** so we can evolve the schema without breaking existing snapshots.
- **Renderable** identically by the editor (`mode: 'edit'`) and the public renderer (`mode: 'public'`).

## Decision

Adopt a **flat block dictionary** per page, keyed by id, with **regions** holding ordered arrays of root block ids. Every persistable document carries a `schemaVersion: number`.

### Page shape

```jsonc
{
  "schemaVersion": 1,
  "id": "page_home",
  "siteId": "site_xxx",
  "slug": "/",
  "title": "Inicio",
  "visibility": "public",
  "layoutId": "layout_default",
  "regions": {
    "main": { "id": "region_main", "children": ["blk_hero_1", "blk_features_1"] },
  },
  "blocks": {
    "blk_hero_1": {
      "id": "blk_hero_1",
      "type": "HeroBlock",
      "props": { "title": "Hola", "variant": "centered" },
      "children": {},
    },
    "blk_features_1": {
      "id": "blk_features_1",
      "type": "FeatureGridBlock",
      "props": { "columns": 3 },
      "children": {},
    },
  },
  "seo": { "title": "...", "description": "...", "canonical": null, "ogImageAssetId": null },
  "updatedAt": "2026-05-30T00:00:00Z",
}
```

Nested children (slots) are referenced the same way: `block.children[slotName] = [blockId, ...]`. Every block id is unique inside a page.

### Versioning

- `schemaVersion` starts at `1`.
- `src/schema/migrate.js` exports `migrateContent(input)` that applies migrations in order until `input.schemaVersion === CURRENT_SCHEMA_VERSION`.
- Migrations are pure functions `(doc) => doc`. Each release that changes the schema adds a numbered migration and bumps `CURRENT_SCHEMA_VERSION`.
- Published snapshots carry their own `schemaVersion`; the renderer migrates on load.

### Why flat?

| Property                            | Flat dict        | Nested tree         |
| ----------------------------------- | ---------------- | ------------------- |
| Mutate one block (immer)            | O(1)             | O(depth)            |
| Lookup by id                        | O(1)             | O(n) traversal      |
| Move a subtree                      | Rewire ids array | Splice + reparent   |
| Serialize / diff                    | Stable, simple   | Order-dependent     |
| Memoization key for `BlockRenderer` | `block.id`       | path-based, brittle |

## Alternatives considered

- **Nested tree (Craft.js style):** elegant for free positioning, but expensive to mutate and harder to memoize per-block.
- **Single JSON blob without ids:** breaks selection, breaks history granularity, breaks references from menus.
- **No `schemaVersion`:** future migrations would require sniffing field shapes — a known footgun. Rejected.

## Consequences

### Positive

- Editor mutations are O(1) per block (immer + flat dict).
- `BlockRenderer` memoizes on `block.id`, drastically reducing renders.
- Migrations are explicit and testable.
- Snapshots are diffable, which simplifies the host's versioning UI.

### Negative

- Slightly more verbose JSON than a nested tree.
- Tree operations (move, duplicate) must rewire ids in two places (regions and children) — encapsulated in `src/utils/tree.js`.

## Implementation notes

- `src/schema/page.js`, `site.js`, `theme.js`, `menu.js`, `version.js` hold JSDoc typedefs for each document.
- `src/utils/tree.js` exposes `insertBlock`, `removeBlock`, `moveBlock`, `duplicateSubtree`, `stampTemplate` — all pure, all returning new state via immer.
- The renderer never mutates; it only reads from the dictionary.
- IDs use `nanoid(10)` prefixed by the document kind (`blk_`, `region_`, `page_`, `site_`, etc.) to aid debugging.
