/**
 * @file JSDoc typedefs for Site documents.
 * @see ../../docs/adr/0003-json-schema.md
 */

/**
 * @typedef {Object} SiteSettings
 * @property {string|null} [faviconAssetId]
 * @property {Object}      [defaultSeo]
 */

/**
 * @typedef {Object} Site
 * @property {number}        schemaVersion
 * @property {string}        id
 * @property {string}        name
 * @property {string}        locale          - BCP-47 locale, e.g. 'es-MX'.
 * @property {string}        themeId
 * @property {string[]}      pages           - Page ids.
 * @property {string[]}      menus           - Menu ids.
 * @property {string|null}   layoutId
 * @property {SiteSettings}  [settings]
 */

export {}
