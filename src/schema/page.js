/**
 * @file JSDoc typedefs for Page documents.
 */

import './block.js' // for BlockInstance typedef

/**
 * @typedef {Object} Region
 * @property {string}   id
 * @property {string[]} children - Ordered root block ids inside this region.
 */

/**
 * @typedef {Object} PageSeo
 * @property {string} [title]
 * @property {string} [description]
 * @property {string|null} [canonical]
 * @property {string|null} [ogImageAssetId]
 */

/**
 * @typedef {Object} Page
 * @property {number}                            schemaVersion
 * @property {string}                            id
 * @property {string}                            [siteId]
 * @property {string}                            slug
 * @property {string}                            title
 * @property {'public'|'private'}                visibility
 * @property {string|null}                       [layoutId]
 * @property {Object<string, Region>}            regions
 * @property {Object<string, import('./block.js').BlockInstance>} blocks
 * @property {PageSeo}                           [seo]
 * @property {string}                            [updatedAt]
 */

export {}
