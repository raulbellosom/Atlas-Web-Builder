/**
 * @file Client-side image optimization (canvas based). Browser only.
 */

const SKIP = /^image\/(svg\+xml|gif)$/i

function dominant(ctx, w, h) {
  try {
    const d = ctx.getImageData(0, 0, w, h).data
    let r = 0, g = 0, b = 0
    const n = d.length / 4
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2] }
    const hex = (x) => Math.round(x / n).toString(16).padStart(2, '0')
    return `#${hex(r)}${hex(g)}${hex(b)}`
  } catch {
    return undefined
  }
}

function toBlob(canvas, format, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, format, quality))
}

/**
 * Resize an image into responsive variants.
 *
 * @param {File} file
 * @param {{maxWidth?:number, widths?:number[], format?:string, quality?:number}} [opts]
 * @returns {Promise<{original:File, variants:Array<{width:number,height:number,blob:Blob,format:string}>,
 *   width?:number, height?:number, dominantColor?:string}>}
 */
export async function optimizeImageFile(file, opts = {}) {
  const { maxWidth = 2400, widths = [480, 960, 1440, 2400], format = 'image/webp', quality = 0.82 } = opts
  const empty = { original: file, variants: [] }
  if (!file || !file.type || !file.type.startsWith('image/') || SKIP.test(file.type)) return empty
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return empty

  let bitmap
  try { bitmap = await createImageBitmap(file) } catch { return empty }
  const { width, height } = bitmap

  const targets = [...new Set(widths.map((w) => Math.min(w, maxWidth, width)))].sort((a, b) => a - b)
  const variants = []
  let dominantColor
  for (const w of targets) {
    const h = Math.round((height * w) / width)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    ctx.drawImage(bitmap, 0, 0, w, h)
    if (!dominantColor) dominantColor = dominant(ctx, w, h)
    const blob = await toBlob(canvas, format, quality)
    if (blob) variants.push({ width: w, height: h, blob, format })
  }
  if (bitmap.close) bitmap.close()
  return { original: file, variants, width, height, dominantColor }
}
