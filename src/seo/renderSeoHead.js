/**
 * @file HTML <head> string for SSR / static publishing.
 */
import { buildSeoMeta } from './buildSeoMeta.js'
import { serializeJsonLd } from './jsonld.js'

/** Escape text for HTML content and quoted attributes. */
export function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${escapeHtml(v)}"`).join(' ')

/**
 * @param {import('../schema/page.js').Page} page
 * @param {import('../schema/site.js').Site} [site]
 * @param {Parameters<typeof buildSeoMeta>[2]} [opts]
 * @returns {string} Newline-separated head tags.
 */
export function renderSeoHead(page, site, opts) {
  const { title, meta, link, jsonLd } = buildSeoMeta(page, site, opts)
  const lines = []
  if (title) lines.push(`<title>${escapeHtml(title)}</title>`)
  for (const m of meta) lines.push(`<meta ${attrs(m)}>`)
  for (const l of link) lines.push(`<link ${attrs(l)}>`)
  for (const j of jsonLd) lines.push(`<script type="application/ld+json">${serializeJsonLd(j)}</script>`)
  return lines.join('\n')
}
