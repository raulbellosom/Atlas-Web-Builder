import { optimizeImageFile } from '../../media/optimizeImage.js'
import { vectorImageDefaults } from '../../media/vector.js'

// MIME type carried by a library thumbnail dragged onto a block or image field.
export const ASSET_DRAG_TYPE = 'application/x-atlas-asset'

/** `AssetSource.list()` may return an array or a page `{ items, next }`. */
export function normalizeAssetList(result) {
  if (Array.isArray(result)) return { items: result, next: null }
  return { items: Array.isArray(result?.items) ? result.items : [], next: result?.next ?? null }
}

/** Optional `AssetSource.resolve(asset)` turns a listed asset into the one a block stores. */
export async function resolveAsset(assets, asset) {
  return typeof assets?.resolve === 'function' ? await assets.resolve(asset) : asset
}

export async function uploadAsset(assets, file) {
  // Only images get client-side variants; audio/video go up as is and the host processes them.
  if (typeof assets.uploadVariants === 'function' && String(file?.type ?? '').startsWith('image/')) {
    const optimized = await optimizeImageFile(file)
    if (optimized.variants.length) return assets.uploadVariants(file, optimized)
  }
  return assets.upload(file)
}

/** Media kind of a listed asset: hosts may set `kind`, otherwise it follows the MIME. */
export function assetKind(asset) {
  if (asset?.kind === 'video' || asset?.kind === 'audio' || asset?.kind === 'image') return asset.kind
  const mime = String(asset?.mime ?? asset?.type ?? '')
  return mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : 'image'
}

/**
 * Field of `kind` ('image' | 'video' | 'audio') a dropped asset goes to: the first empty one (so galleries
 * fill slot by slot), otherwise the first. Null when the block has no top-level field of that kind.
 */
export function mediaFieldKey(definition, kind = 'image', props = {}) {
  const keys = Object.entries(definition?.fields ?? {}).filter(([, field]) => field?.type === kind).map(([key]) => key)
  return keys.find((key) => !props[key]) ?? keys[0] ?? null
}

export const imageFieldKey = (definition, props = {}) => mediaFieldKey(definition, 'image', props)

/** Props patch that puts `asset` into the block's image field, or null when it has none. */
export function assetProps(definition, asset, current = {}) {
  const kind = assetKind(asset), key = mediaFieldKey(definition, kind, current)
  if (!key || !asset?.url) return null
  const patch = { [key]: asset.url }
  if (kind === 'image' && definition.fields[key].withAssetMeta) {
    Object.assign(patch, { variants: asset.variants, dominantColor: asset.dominantColor || '', naturalWidth: asset.width, naturalHeight: asset.height, ...vectorImageDefaults(asset) })
  }
  return patch
}

export function isMediaDrag(event) {
  const types = Array.from(event.dataTransfer?.types ?? [])
  return types.includes(ASSET_DRAG_TYPE) || types.includes('Files')
}

export function readDraggedAsset(event) {
  const raw = event.dataTransfer?.getData(ASSET_DRAG_TYPE)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}
