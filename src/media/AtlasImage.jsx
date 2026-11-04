import { useContext } from 'react'
import { BuilderContext } from '../provider/BuilderContext.js'

const MIME = { webp: 'image/webp', avif: 'image/avif', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png' }
const toMime = (f) => (f && f.includes('/') ? f : MIME[f] || undefined)

/**
 * Build `srcset` strings from asset variants, grouped by mime type.
 * @param {Array<{width:number,url:string,format?:string}>} variants
 * @returns {Array<{type?:string, srcSet:string}>} AVIF first, then WebP, then the rest.
 */
export function groupVariants(variants) {
  const groups = new Map()
  for (const v of variants || []) {
    if (!v || !v.url || !(v.width > 0)) continue
    const type = toMime(v.format)
    if (!groups.has(type)) groups.set(type, [])
    groups.get(type).push(v)
  }
  const rank = (t) => (t === 'image/avif' ? 0 : t === 'image/webp' ? 1 : 2)
  return [...groups.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([type, list]) => ({
      type,
      srcSet: list
        .sort((a, b) => a.width - b.width)
        .map((v) => `${v.url} ${v.width}w`)
        .join(', '),
    }))
}

/**
 * Shared image primitive: reserves layout space, lazy-loads, and builds
 * `srcSet` / `<picture>` from an `imageUrlBuilder` or asset `variants`.
 *
 * @param {{
 *   src: string, alt?: string, width?: number, height?: number,
 *   aspectRatio?: string, loading?: 'lazy'|'eager', fetchPriority?: 'high'|'low'|'auto',
 *   priority?: boolean, sizes?: string, widths?: number[], formats?: string[],
 *   variants?: Array<{width:number,url:string,format?:string}>,
 *   asset?: import('../schema/asset.js').Asset,
 *   dominantColor?: string, imageUrlBuilder?: (src:string, o:{width?:number,format?:string})=>string,
 *   style?: object, className?: string,
 * }} props
 */
/* eslint-disable jsx-a11y/alt-text -- alt is forwarded from props (defaults to "") */
export function AtlasImage({
  src,
  alt = '',
  width,
  height,
  aspectRatio,
  loading,
  fetchPriority,
  priority = false,
  sizes = '100vw',
  widths,
  formats = ['avif', 'webp'],
  variants,
  asset,
  dominantColor,
  imageUrlBuilder,
  style,
  ...rest
}) {
  const ctx = useContext(BuilderContext)
  const build = imageUrlBuilder || ctx?.imageUrlBuilder
  const vars = variants || asset?.variants
  const w = width ?? asset?.width
  const h = height ?? asset?.height
  const color = dominantColor ?? asset?.dominantColor
  const url = src || asset?.url

  const imgProps = {
    src: url,
    alt,
    width: w,
    height: h,
    loading: priority ? 'eager' : loading || 'lazy',
    fetchpriority: priority ? 'high' : fetchPriority, // lowercase: React 18 warns on the camelCase DOM prop
    decoding: 'async',
    style: {
      aspectRatio: aspectRatio || (w && h ? `${w} / ${h}` : undefined),
      backgroundColor: color,
      ...style,
    },
    ...rest,
  }

  let sources = []
  if (vars && vars.length) {
    sources = groupVariants(vars)
  } else if (build && widths && widths.length) {
    sources = formats.map((f) => ({
      type: toMime(f),
      srcSet: widths.map((x) => `${build(url, { width: x, format: f })} ${x}w`).join(', '),
    }))
  }

  // Plain-format variants (no type, or the original type) feed the <img> srcset.
  const fallback = sources.find((s) => !s.type || (s.type !== 'image/avif' && s.type !== 'image/webp'))
  const pictureSources = sources.filter((s) => s !== fallback && s.type)
  if (fallback) imgProps.srcSet = fallback.srcSet
  else if (!(vars && vars.length) && build && widths?.length) {
    imgProps.srcSet = widths.map((x) => `${build(url, { width: x })} ${x}w`).join(', ')
  }
  if (imgProps.srcSet || pictureSources.length) imgProps.sizes = sizes

  if (!pictureSources.length) return <img {...imgProps} />
  return (
    <picture>
      {pictureSources.map((s) => (
        <source key={s.type} type={s.type} srcSet={s.srcSet} sizes={sizes} />
      ))}
      <img {...imgProps} />
    </picture>
  )
}
