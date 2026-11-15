# Medios panel and image drag and drop (0.7.0)

## Problem

Putting an image into a block took three steps: open the host's library, wait
for the host to inject the image, then pick it again in the block's media
picker. The picker's library only showed images already inside the document.

## Design

Atlas (generic, any host with an `AssetSource`):

- Left panel tab **Medios**: search, upload (button or file drop), paged list,
  draggable thumbnails. A click uses the image in the selected block when that
  block has an image field (keyboard and touch path).
- Canvas: every `EditableBlock` whose definition has an image field accepts a
  dropped thumbnail (`application/x-atlas-asset`) or an image file. The first
  empty top-level `type: 'image'` field receives the URL (galleries with
  `image1..n` fill slot by slot), otherwise the first; `withAssetMeta` fields also
  get variants and natural size. Blocks without an image field let the event
  bubble to their parent.
- Inspector `ImageField` also accepts dropped thumbnails.
- `AssetSource` additions, all optional and backward compatible:
  `list({ query, cursor })` may return `{ items, next }`; `resolve(asset)`
  turns a listed asset into the stored one; items may carry `thumbnailUrl`.

Runly Developer Hub (host, separate repo):

- The sandboxed website frame cannot call the API, so its `AssetSource`
  proxies `list`, `resolve` and `upload` to the parent over the existing
  MessagePort. The parent lists the publisher library with inline thumbnails,
  downloads the original on `resolve`, and runs prepare/transfer/confirm on
  `upload`. No frame reload.
- New images live in frame state; the page passed as `initialPage` is never
  recomputed (Atlas resets the store when it changes). Snapshots include only
  the added images that the pages reference.
- The toolbar "Biblioteca" button and dialog are removed.

## Out of scope

- Choosing a specific filled slot by dropping on the canvas (drop on that
  field in the inspector instead), images inside list fields, and background
  images.
- Server-side collection/tag facets for the library.

## Verification

- `src/__tests__/mediaPanel.test.jsx`: helpers, click-to-use, drop on image
  block, drop ignored by a block without image, tab hidden without a source.
- Hub: build plus the website editor e2e flow.
