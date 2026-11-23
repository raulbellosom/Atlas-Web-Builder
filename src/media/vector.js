// SVG assets are vector masters: never cropped by default, and recolorable through a CSS mask.
const SVG_URL = /^data:image\/svg\+xml|\.svg(?:[?#]|$)/i

/** True when a block's image is an SVG (explicit `vector` flag set by the asset picker, or recognizable URL). */
export function isVectorAsset({ vector, src, mimeType } = {}) {
  return vector === true || mimeType === 'image/svg+xml' || (typeof src === 'string' && SVG_URL.test(src))
}

/** Block props to apply when the picked asset is an SVG: show it whole, flag it, clear stale state otherwise. */
export function vectorImageDefaults(asset) {
  return isVectorAsset({ mimeType: asset?.mimeType, src: asset?.url })
    ? { vector: true, aspectRatio: 'auto', objectFit: 'contain' }
    : { vector: false, tint: 'none' }
}

/** A quoted CSS url() with the characters that could close the string or the function removed. */
export function cssUrl(value) {
  const clean = [...String(value)].filter((char) => !['"', '\\', '\n', '\r'].includes(char)).join('')
  return `url("${clean}")`
}
