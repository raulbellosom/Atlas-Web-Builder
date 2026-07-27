# ctx.resource() real implementation + docs completeness — design

Date: 2026-07-27
Status: Approved

## Problem

The published README (`@raulbellosom/atlas-web-builder@0.1.0`) documents a data-fetching
API (`ctx.resource(name, params)` → `{ data, loading }`) that does not exist in the
shipped code. `BlockRenderer.jsx` only exposes the raw `ctx.resources` map (whatever
fetcher object the host passed in) — there is no wrapper that returns `data`/`loading`.

`ResourceBoundary` — exported publicly from `index.js` — is also a dead stub. Its own
file comment says "Phase-2 placeholder... Real implementation arrives in Phase 7", but
Phase 7 shipped as Notifications instead (per `index.js` section comments), and the
resources work described in `docs/architecture.md` ("Phase 7: Dynamic resources and
dynamic blocks") never landed. `ResourceBoundary` always returns
`{ data: null, loading: false, error: null, empty: true }` regardless of props.

Separately, `src/index.js` exports `version = '0.0.2'` with a comment claiming it's
"kept in lockstep with package.json" — but `package.json` says `0.1.0`. `getVersion()`
returns a stale/wrong value.

None of this currently breaks atlaserp-v2 (no block in `apps/desktop/src/website/atlasBlocks`
calls `ctx.resource()`), but it breaks the documented contract for any future block author
who follows the README, and misrepresents the package's completeness on npm.

## Goal

Make the published package match its own documentation: implement the resource-fetching
API for real, fix the version drift, complete the API reference table, and ship it as a
new npm version — without changing any API surface atlaserp-v2 currently depends on.

## Design

### 1. `ctx.resource(name, params)` — real hook

- New internal hook `useResource(resourcesMap, name, params)` in
  `src/renderer/useResource.js`. Uses `useState`/`useEffect`.
- `BlockRenderer.jsx` wires `ctx.resource = (name, params) => useResource(ctx.resources, name, params)`.
  This is valid because `def.render` is invoked via JSX (`<Component {...props} ctx={ctx} />`),
  making it a real function component — hooks called unconditionally in its body are legal,
  including ones reached through a prop-provided closure. This constraint (call
  `ctx.resource()` unconditionally, same as any hook) is documented in the README.
- Returns `{ data, loading, error, empty }`:
  - `loading: true` while the fetch is in flight.
  - `error`: populated if the fetcher throws/rejects, or if `resources[name]` doesn't exist
    (clear message in the latter case, not a silent no-op).
  - `empty`: `true` when settled with `null`/`undefined`/`[]`.
- Refetches when `params` change (`JSON.stringify` shallow comparison).
- Stale-response guard: ignores a resolving promise if the component unmounted or params
  changed since that fetch was issued (no setState-after-unmount, no race conditions
  overwriting newer data with an older in-flight response).

### 2. `ResourceBoundary` — real implementation

- Reimplemented on top of the same `useResource` hook.
- Takes `ctx` as an explicit prop (`<ResourceBoundary ctx={ctx} resource="products" query={...}>`)
  rather than reading `BuilderContext` directly, because `BuilderContext` has no concept of
  edit/public mode — `ctx.resources` (built per-render in `BlockRenderer`) is already the
  correctly-resolved map (`mockResources` in edit mode, `resources` in public mode).
  Documented as the render-prop alternative to the hook for authors who prefer it.

### 3. Version sync

- Fix `src/index.js`'s `version` constant to `0.1.0` now (matching `package.json` before
  this release's bump).
- Add `src/__tests__/version.test.js` asserting the exported `version` equals
  `package.json`'s `version`, so this can't silently drift again.

### 4. README completeness

- Fix the broken `ctx.resource()` example in "Bloque con contenido dinámico (resources)"
  to reflect the real hook contract (including the unconditional-call note).
- Add `ResourceBoundary` usage as the alternative pattern.
- Fill in the "API de referencia" table with every export currently missing from it:
  `useBuilder`/`BuilderContext`, `getVersion`/`version`, `useThemeTokens`/`applyThemeVars`,
  `SafeRichText`, schema/persistence helpers (`validatePage`, `garbageCollect`,
  `regenerateIds`, `listUnknownBlockTypes`, `migrateContent`, `CURRENT_SCHEMA_VERSION`),
  `createTemplateRegistry`/`applyTemplate`, layouts (`defineLayout`, `createLayoutRegistry`,
  `applyLayoutToDraft`), `AssetPicker`, inline editing (`InlineText`,
  `createInlineTextHelper`), background helpers (`resolveBackground`,
  `resolveBackgroundCss`, `BackgroundField`), notifications
  (`NotificationsProvider`/`useNotifications`/`NotificationCenter`), editor store
  (`EditorStoreProvider`/`useEditorStore`/`useEditorStoreInstance`/`useTemporal`/
  `createEditorStore`/`DEVICE_WIDTHS`), `defaultFields`/`defineField`, and the individual
  base block component exports.

### 5. Tests

- `src/__tests__/resource.test.jsx` (new): initial `loading` state, transition to `data`,
  error when the named resource doesn't exist, refetch on param change, no state update
  after unmount.
- Update `src/__tests__/renderer.test.jsx` if it asserts on the shape of `ctx`.
- `src/__tests__/version.test.js` (new, see §3).

### 6. Versioning & release

- Bump to `0.2.0` (not a patch): `ctx.resource()` goes from non-functional to a real
  capability — worth signaling as more than a bugfix even under 0.x semver.
- No API surface removed or renamed — existing consumers (including atlaserp-v2, which
  doesn't touch these APIs) are unaffected.
- Raul runs `npm publish` after build + tests are green. **No AI/Claude co-authorship
  in any commit or metadata** — this is Raul's own published package.
- After publish, bump `apps/desktop/package.json` in atlaserp-v2 to `^0.2.0`, run
  `pnpm install` to refresh the lockfile, verify nothing breaks (no current consumer of
  the changed APIs in this repo).

## Out of scope

- Caching/dedup across multiple blocks requesting the same resource+params (single-block
  scope is enough for this release).
- Changing `AssetSource`, theme, template, or layout APIs — untouched by this release.
- Any atlaserp-v2 block actually adopting `ctx.resource()` — this release only makes the
  capability real; using it in a website block is a separate future task.
