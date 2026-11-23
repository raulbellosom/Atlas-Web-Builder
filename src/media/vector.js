import { useEffect, useState } from 'react'

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

const isRelativeOrData = (src) => typeof src === 'string' && (/^data:/i.test(src) || (/^\//.test(src) && !/^\/\//.test(src)))

/**
 * Whether a CSS mask over `src` will render. Same-origin and data: URLs always can. For an absolute URL the first render
 * (server and client alike) says no, so content is visible as a plain image; after mount, a same-origin URL upgrades
 * immediately and a cross-origin one upgrades only if an anonymous CORS image load succeeds.
 */
export function useMaskReadable(src) {
  const [state, setState] = useState(isRelativeOrData(src) ? 'ok' : 'unknown')
  useEffect(() => {
    if (isRelativeOrData(src)) { setState('ok'); return undefined }
    if (typeof window === 'undefined') return undefined
    let alive = true
    try { if (new URL(src, window.location.href).origin === window.location.origin) { setState('ok'); return undefined } } catch { setState('no'); return undefined }
    const probe = new window.Image()
    probe.crossOrigin = 'anonymous'
    probe.onload = () => { if (alive) setState('ok') }
    probe.onerror = () => { if (alive) setState('no') }
    probe.src = src
    return () => { alive = false; probe.onload = null; probe.onerror = null }
  }, [src])
  return state === 'ok'
}
