# Atlas Web Builder — Architecture Overview

This document is the canonical reference for the architecture of `@racoondevs/atlas-web-builder`. It summarizes the master plan and links to the Architecture Decision Records (ADRs).

## Vision

A React-first, controlled website composer designed to be embedded in Atlas ERP and reused in any React project. Inspired by Odoo's controlled UX, Puck's JSON tree model, Craft.js's selection ergonomics, and Webstudio's instance model.

The builder is **not** a free-form HTML/CSS editor. Developers register polished blocks, templates, resources, and actions; users compose pages by choosing templates, sections, and safe controlled props.

## Non-goals

- Universal CSS editor.
- Arbitrary JavaScript execution.
- Owning persistence, routing, or authentication (host's responsibility).
- Vendor-coupled SaaS integration (Plasmic Cloud, Builder.io, Framer, Webflow).

## High-level architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Host App (atlaserp-v2)                      │
│  ┌────────────────────────┐    ┌──────────────────────────────┐   │
│  │ AtlasWebBuilderEditor  │    │      AtlasWebRenderer        │   │
│  │  (admin / authoring)   │    │   (public / SSR rendering)   │   │
│  └───────────┬────────────┘    └──────────────┬───────────────┘   │
│              │                                │                    │
│  ┌───────────┴────────────────────────────────┴───────────────┐    │
│  │             AtlasWebBuilderProvider                         │    │
│  │   blocks · templates · themes · resources · actions ·       │    │
│  │   permissions · router · plugins · mockResources            │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                       │
            JSON content (Site, Page, Theme, Snapshot)
                       │
                       ▼
               Host persistence layer
```

## Core principles

1. **Content is JSON.** Pages are flat trees: `{ regions, blocks: { [id]: {id,type,props,children} } }`. Never functions, never HTML blobs.
2. **Renderer enforces an allowlist.** Unknown block types render a safe fallback.
3. **Controlled fields only.** Block props are edited through registered field types (`text`, `select`, `color-token`, `resource-query`, etc.). No raw style editor.
4. **Theme tokens drive style.** A `<ThemeProvider>` injects CSS variables; blocks consume them.
5. **Host owns data.** Dynamic blocks declare `resources`; the host registers accessors; the package never hardcodes APIs.
6. **Stateless package.** No DB, no router, no auth. Save/publish are callbacks.
7. **Versioned schema.** Every JSON document has `schemaVersion`; `migrate.js` upgrades older snapshots.

## Tech stack

| Concern      | Choice                                | Rationale                                |
| ------------ | ------------------------------------- | ---------------------------------------- |
| Language     | JavaScript + JSX (ESM)                | Host (`atlaserp-v2`) does not use TS yet |
| Types/Docs   | JSDoc typedefs                        | Autocomplete without TS toolchain        |
| Build        | Vite library mode → ESM + CJS         | Modern, tree-shakeable                   |
| State        | `zustand` + `immer` + `zundo`         | Tiny, immutable, undo built-in           |
| Drag & drop  | `@dnd-kit/core` + `@dnd-kit/sortable` | Accessible, modern, MIT                  |
| IDs          | `nanoid`                              | Small, URL-safe                          |
| Sanitization | `dompurify`                           | Industry standard XSS defense            |
| Styling      | CSS variables + scoped class names    | CSP-friendly, no CSS-in-JS dep           |
| Tests        | `vitest` + `@testing-library/react`   | Fast, native ESM                         |
| Lint/Format  | `eslint` + `prettier`                 | Standard                                 |

All runtime dependencies are MIT / BSD / Apache-2.0 / ISC. No AGPL/GPL.

## Package layout

See [`../README.md`](../README.md) for the public API and the master plan saved in session memory for the full folder tree.

## Decision records

- [ADR 0001 — Custom engine over Craft.js / Puck / GrapesJS](./adr/0001-custom-engine.md)
- [ADR 0002 — dnd-kit + zustand + immer for the editor core](./adr/0002-dndkit-zustand.md)
- [ADR 0003 — Flat JSON content schema with versioning](./adr/0003-json-schema.md)

## Implementation phases

Implementation follows the phased roadmap in the master plan:

- Phase 0: Architecture and ADRs.
- Phase 1: Package skeleton (build, lint, test, playground).
- Phase 2: Provider, registry, ThemeProvider, Renderer.
- Phase 3: Editor shell (store, chrome, DnD, properties).
- Phase 4: Six static blocks.
- Phase 5: Theme system.
- Phase 6: Templates.
- Phase 7: Dynamic resources and dynamic blocks.
- Phase 8: Pages, routes, navigation.
- Phase 9: Draft / publish.
- Phase 10: Atlas ERP integration.
- Phase 11: Advanced UX and polish.

Each phase has explicit acceptance criteria and an explicit "do not do" list to prevent scope creep.
