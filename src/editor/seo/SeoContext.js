import { createContext, useContext } from 'react'

/**
 * Site-level data the SEO panel needs for previews and fallbacks.
 * @typedef {{ site?: import('../../schema/site.js').Site, baseUrl?: string }} SeoContextValue
 */
export const SeoContext = createContext(/** @type {SeoContextValue} */ ({}))

export const useSeoContext = () => useContext(SeoContext)
