/**
 * @file Prefixed nanoid generator. All ids in editor state are short, URL-safe
 * strings prefixed by kind to aid debugging in dev tools.
 */
import { nanoid } from 'nanoid'

/**
 * @param {string} prefix - e.g. 'blk', 'region', 'page'.
 * @param {number} [size=8]
 * @returns {string}
 */
export function newId(prefix, size = 8) {
  return `${prefix}_${nanoid(size)}`
}
