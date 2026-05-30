/**
 * @file Asset source contract + in-memory implementation. An asset source
 * is the minimal async interface the editor uses to list, upload and remove
 * media (images, files). Hosts plug their own (S3, CDN, Atlas REST...).
 *
 * Contract:
 *   list(): Promise<Asset[]>
 *   upload?(file: File): Promise<Asset>
 *   remove?(id: string): Promise<void>
 *   getById?(id: string): Promise<Asset | null>
 *   subscribe?(listener: () => void): () => void  // optional change feed
 *
 * The editor degrades gracefully when a method is missing (e.g. read-only
 * sources omit `upload` and `remove`).
 */

import { newId } from '../utils/id.js'

/**
 * @typedef {import('../schema/asset.js').Asset} Asset
 * @typedef {{
 *   list: () => Promise<Asset[]>,
 *   upload?: (file: File) => Promise<Asset>,
 *   remove?: (id: string) => Promise<void>,
 *   getById?: (id: string) => Promise<Asset | null>,
 *   subscribe?: (listener: () => void) => () => void,
 * }} AssetSource
 */

/**
 * Build a simple in-memory asset source useful for tests, demos and
 * playgrounds. Files are converted to data URLs via `FileReader` so
 * the editor can render thumbnails without any backend.
 *
 * @param {Asset[]} [initial]
 * @returns {AssetSource}
 */
export function createInMemoryAssetSource(initial = []) {
  const items = [...initial]
  const listeners = new Set()

  function notify() {
    for (const l of listeners) l()
  }

  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error || new Error('read error'))
      reader.readAsDataURL(file)
    })
  }

  return {
    async list() {
      return items.slice()
    },
    async upload(file) {
      if (!file) throw new Error('upload: file is required')
      const url = await readAsDataURL(file)
      const asset = {
        id: newId('asset'),
        kind: file.type && file.type.startsWith('image/') ? 'image' : 'file',
        url,
        name: file.name || 'sin-nombre',
        mimeType: file.type || undefined,
        size: file.size || undefined,
        createdAt: new Date().toISOString(),
      }
      items.unshift(asset)
      notify()
      return asset
    },
    async remove(id) {
      const i = items.findIndex((a) => a.id === id)
      if (i >= 0) {
        items.splice(i, 1)
        notify()
      }
    },
    async getById(id) {
      return items.find((a) => a.id === id) || null
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
