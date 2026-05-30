# ADR 0001 — Custom engine over Craft.js, Puck, GrapesJS

- **Status:** Accepted
- **Date:** 2026-05-30
- **Deciders:** Atlas ERP frontend team

## Context

We need a React website builder that can be embedded in Atlas ERP and reused in any React project. It must support dynamic ERP-aware blocks (products, bookings, blog, forms, payments), controlled styling via theme tokens, full-page templates, draft/publish flow, and Spanish UI — while remaining maintainable and free of vendor lock-in.

We evaluated four foundations:

1. **Craft.js** — React node tree editor (MIT).
2. **Puck** — JSON tree + field schema (MIT).
3. **GrapesJS** — HTML/CSS-first visual editor (BSD-3).
4. **Custom engine** — built on `@dnd-kit/core` + `zustand` + `immer`.

## Decision

**Build a custom engine.** Adopt a Puck-like JSON tree model, Craft.js-like selection ergonomics, and an Odoo-like controlled chrome. Use `@dnd-kit` for drag/drop and accessibility, `zustand` + `immer` for state, `zundo` for history, `nanoid` for ids, and `dompurify` for rich-text sanitization.

## Alternatives considered

### Craft.js

- React-first and ergonomic for free-canvas editing.
- Editor model is coupled to per-node positioning; the section-stacking UX we want needs significant adaptation.
- Upstream activity has slowed; large API surface to learn and debug.
- Still requires us to build the theme system, controlled fields, templates, dynamic resources, ERP shell, Spanish chrome, and publish flow.

### Puck

- Closest philosophical match: JSON tree, registered components, controlled fields, allowlist semantics — all MIT.
- Adopting it as a dependency couples our roadmap and chrome to upstream choices.
- Multi-page/site/route, theme tokens, Atlas ERP panels and Spanish chrome are out of scope upstream and would mean fighting their components or replacing them entirely.
- Has had breaking changes between minor versions.

### GrapesJS

- HTML/CSS-first; embedding live React components is fragile (DOM ownership conflicts).
- "Templates as HTML blobs" conflicts with our JSON-only content rule.
- Wrong paradigm for a React-first, ERP-driven, controlled-design product. Rejected.

### Custom engine

- Total ownership of the JSON schema, editor UX, theme tokens, and ERP integration; no upstream surprises.
- The hard parts (DnD, keyboard a11y, sensors) are delegated to `dnd-kit`.
- Estimated core engine ≈ 3–5k LOC excluding blocks/templates/UI panels — small enough to own.
- License clean (we choose MIT); dependency tree limited to MIT/BSD/Apache/ISC.

## Consequences

### Positive

- Maximum long-term ownership and zero vendor lock-in.
- Smallest dependency surface among the four options.
- Editor UX can be tailored from day one to Odoo-grade controlled composition.
- Clean upgrade path to TypeScript (the public API will be designed with `.d.ts` generation in mind).
- Security model (JSON-only, allowlist renderer, sanitized rich text) is easier to enforce when we own the engine.

### Negative

- We assume responsibility for the editor surface, including bug fixes and a11y.
- We must resist scope creep (no general CSS editor, no query builder UI in MVP, etc.).
- We must invest in disciplined ADRs and schema versioning to avoid painful migrations later.

## Follow-up

- [ADR 0002 — dnd-kit + zustand + immer](./0002-dndkit-zustand.md)
- [ADR 0003 — Flat JSON content schema](./0003-json-schema.md)
