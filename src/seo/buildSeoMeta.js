/**
 * @file Pure head-metadata builder.
 */
import { resolveSeo, normalizeRobots } from './content.js'
import { buildStructuredData } from './jsonld.js'

export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 160

/** Clamp to `max` chars, cutting at a word boundary and adding an ellipsis. */
export function clamp(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const sp = cut.lastIndexOf(' ')
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trimEnd() + '…'
}

/** Absolute http(s) URL or ''. Relative urls need a baseUrl. */
export function absoluteUrl(url, baseUrl) {
  const u = String(url || '').trim()
  if (!u) return ''
  try {
    const parsed = new URL(u, baseUrl || undefined)
    return /^https?:$/.test(parsed.protocol) ? parsed.href : ''
  } catch {
    return ''
  }
}

/** Resolve the OG image url (string, {url}, or legacy ogImageAssetId via resolveAsset). */
export function resolveOgImage(seo, resolveAsset) {
  const img = seo?.ogImage
  if (typeof img === 'string' && img.trim()) return img.trim()
  if (img && typeof img === 'object') {
    if (img.url) return String(img.url)
    if (img.assetId && resolveAsset) return resolveAsset(img.assetId)?.url || ''
  }
  if (seo?.ogImageAssetId && resolveAsset) return resolveAsset(seo.ogImageAssetId)?.url || ''
  return ''
}

/**
 * @param {import('../schema/page.js').Page} page
 * @param {import('../schema/site.js').Site} [site]
 * @param {{ baseUrl?: string, resolveAsset?: (id:string)=>({url:string}|undefined) }} [opts]
 * @returns {{ title:string, meta:Array<{name?:string,property?:string,content:string}>, link:Array<{rel:string,href:string}>, jsonLd:object[] }}
 */
export function buildSeoMeta(page, site, { baseUrl = '', resolveAsset } = {}) {
  const seo = page?.seo || {}
  const def = site?.settings?.defaultSeo || {}
  const resolved = resolveSeo(page, site)
  const abs = (u) => absoluteUrl(u, baseUrl)

  const title = clamp(resolved.title, TITLE_MAX)
  const description = clamp(resolved.description, DESCRIPTION_MAX)
  const slug = page?.slug ? (String(page.slug).startsWith('/') ? page.slug : `/${page.slug}`) : ''
  const canonical = abs(seo.canonical) || (baseUrl ? abs(slug || '/') : '')
  const image = abs(resolveOgImage(seo, resolveAsset) || resolveOgImage(def, resolveAsset))
  const ogTitle = clamp(seo.ogTitle || resolved.title, 90)
  const ogDescription = clamp(seo.ogDescription || resolved.description, 200)
  const card = seo.twitterCard === 'summary' || seo.twitterCard === 'summary_large_image'
    ? seo.twitterCard
    : (image ? 'summary_large_image' : 'summary')
  const robots = normalizeRobots(seo.robots, page?.visibility)
  const keywords = (Array.isArray(seo.keywords) ? seo.keywords : String(seo.keywords || '').split(','))
    .map((k) => String(k).trim()).filter(Boolean).join(', ')

  const meta = []
  const add = (key, name, content) => { if (content) meta.push({ [key]: name, content }) }
  add('name', 'description', description)
  add('name', 'keywords', keywords)
  if (!robots.index || !robots.follow) {
    add('name', 'robots', `${robots.index ? 'index' : 'noindex'},${robots.follow ? 'follow' : 'nofollow'}`)
  }
  add('property', 'og:title', ogTitle)
  add('property', 'og:description', ogDescription)
  add('property', 'og:type', seo.ogType || 'website')
  add('property', 'og:url', canonical)
  add('property', 'og:image', image)
  add('property', 'og:site_name', site?.name)
  add('property', 'og:locale', site?.locale ? String(site.locale).replace('-', '_') : '')
  add('name', 'twitter:card', card)
  add('name', 'twitter:title', ogTitle)
  add('name', 'twitter:description', ogDescription)
  add('name', 'twitter:image', image)

  const link = canonical ? [{ rel: 'canonical', href: canonical }] : []
  const jsonLd = buildStructuredData(seo.structuredData, abs)
  return { title, meta, link, jsonLd }
}
