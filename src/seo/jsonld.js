/**
 * @file Whitelisted JSON-LD presets built from simple fields (never raw user JSON).
 */

export const STRUCTURED_DATA_TYPES = [
  'Organization', 'LocalBusiness', 'WebSite', 'Article', 'Product', 'FAQPage', 'BreadcrumbList',
]

const s = (v, max = 500) => (v == null ? '' : String(v).trim().slice(0, max))
const list = (v) => (Array.isArray(v) ? v : String(v || '').split(/[\n,]/)).map((x) => s(x)).filter(Boolean)

/** Drop empty values so the output stays compact. */
function compact(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v == null || (Array.isArray(v) && !v.length)) continue
    out[k] = v
  }
  return out
}

const PRESETS = {
  Organization: (e, abs) => compact({ name: s(e.name), url: abs(e.url), logo: abs(e.logo), sameAs: list(e.sameAs).map(abs).filter(Boolean) }),
  LocalBusiness: (e, abs) => compact({
    name: s(e.name), url: abs(e.url), image: abs(e.image), telephone: s(e.telephone, 40),
    priceRange: s(e.priceRange, 20), address: e.address ? { '@type': 'PostalAddress', streetAddress: s(e.address) } : '',
  }),
  WebSite: (e, abs) => compact({ name: s(e.name), url: abs(e.url) }),
  Article: (e, abs) => compact({
    headline: s(e.headline, 110), image: abs(e.image), datePublished: s(e.datePublished, 40),
    author: e.author ? { '@type': 'Person', name: s(e.author) } : '',
  }),
  Product: (e, abs) => compact({
    name: s(e.name), description: s(e.description), image: abs(e.image), sku: s(e.sku, 60),
    offers: e.price !== '' && e.price != null
      ? { '@type': 'Offer', price: s(e.price, 20), priceCurrency: s(e.priceCurrency || 'MXN', 3).toUpperCase() }
      : '',
  }),
  FAQPage: (e) => {
    const items = (Array.isArray(e.items) ? e.items : []).filter((i) => s(i?.question) && s(i?.answer))
    return compact({
      mainEntity: items.map((i) => ({
        '@type': 'Question', name: s(i.question),
        acceptedAnswer: { '@type': 'Answer', text: s(i.answer, 2000) },
      })),
    })
  },
  BreadcrumbList: (e, abs) => {
    const items = (Array.isArray(e.items) ? e.items : []).filter((i) => s(i?.name))
    return compact({
      itemListElement: items.map((i, n) => compact({ '@type': 'ListItem', position: n + 1, name: s(i.name), item: abs(i.url) })),
    })
  },
}

/**
 * @param {Array<{type:string}>} entries
 * @param {(url:string)=>string} abs - absolute-URL resolver (returns '' for unsafe urls).
 * @returns {object[]} JSON-LD objects (unknown types and empty presets are dropped).
 */
export function buildStructuredData(entries, abs = (u) => s(u)) {
  const out = []
  for (const e of Array.isArray(entries) ? entries : []) {
    const build = e && Object.hasOwn(PRESETS, e.type) ? PRESETS[e.type] : null
    if (!build) continue
    const body = build(e, abs)
    if (Object.keys(body).length) out.push({ '@context': 'https://schema.org', '@type': e.type, ...body })
  }
  return out
}

/** JSON string safe to inline in a <script type="application/ld+json"> element. */
export function serializeJsonLd(obj) {
  const esc = (code) => String.fromCharCode(92) + 'u' + code.toString(16).padStart(4, '0')
  return JSON.stringify(obj).replace(/[<>&]/g, (c) => esc(c.charCodeAt(0)))
    .split(String.fromCharCode(8232)).join(esc(8232))
    .split(String.fromCharCode(8233)).join(esc(8233))
}
