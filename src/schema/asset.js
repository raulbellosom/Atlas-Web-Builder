/**
 * @file Asset typedefs.
 */

/**
 * @typedef {Object} Asset
 * @property {string}  id
 * @property {'image'|'file'} kind
 * @property {string}  url
 * @property {string}  name
 * @property {string}  [mimeType]
 * @property {number}  [size]
 * @property {number}  [width]
 * @property {number}  [height]
 * @property {string}  [alt]
 * @property {Array<{width:number,url:string,format?:string}>} [variants] Responsive renditions (format: 'webp' | 'avif' | mime).
 * @property {string}  [dominantColor] CSS color used as placeholder while loading.
 * @property {string}  [blurhash]
 * @property {string}  [createdAt]
 */

export {}
