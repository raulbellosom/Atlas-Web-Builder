import { optimizeImageFile } from '../../media/optimizeImage.js'

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
  if (typeof assets.uploadVariants === 'function') {
    const optimized = await optimizeImageFile(file)
    if (optimized.variants.length) return assets.uploadVariants(file, optimized)
  }
  return assets.upload(file)
}

/** First top-level image field of a block definition (the one a dropped image replaces). */
export function imageFieldKey(definition) {
  return Object.entries(definition?.fields ?? {}).find(([, field]) => field?.type === 'image')?.[0] ?? null
}

/** Props patch that puts `asset` into the block's image field, or null when it has none. */
export function assetProps(definition, asset) {
  const key = imageFieldKey(definition)
  if (!key || !asset?.url) return null
  const props = { [key]: asset.url }
  if (definition.fields[key].withAssetMeta) {
    Object.assign(props, { variants: asset.variants, dominantColor: asset.dominantColor || '', naturalWidth: asset.width, naturalHeight: asset.height })
  }
  return props
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
