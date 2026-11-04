/**
 * @file Page content extraction and SEO fallback resolution (pure).
 */

const HEADING_RE = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi

/** Strip tags and collapse whitespace. */
export function stripTags(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Walk the page in document order and collect headings, images and text.
 *
 * @param {import('../schema/page.js').Page} page
 * @returns {{ headings: {level:number,text:string}[], images: {src:string,alt:string}[], firstText: string }}
 */
export function collectPageContent(page) {
  const headings = []
  const images = []
  let firstText = ''
  const seen = new Set()
  const blocks = page?.blocks || {}

  function visit(id) {
    const block = blocks[id]
    if (!block || seen.has(id)) return
    seen.add(id)
    const p = block.props || {}
    switch (block.type) {
      case 'HeadingBlock': {
        const level = Number(String(p.level || 'h2').slice(1)) || 2
        if (p.text) headings.push({ level, text: stripTags(p.text) })
        break
      }
      case 'HeroBlock':
        if (p.title) headings.push({ level: 1, text: stripTags(p.title) })
        if (!firstText && p.subtitle) firstText = stripTags(p.subtitle)
        break
      case 'ImageBlock':
        images.push({ src: p.src || '', alt: p.alt || '' })
        break
      case 'TextBlock':
        if (!firstText && p.text) firstText = stripTags(p.text)
        break
      case 'RichTextBlock': {
        const html = String(p.html || '')
        for (const m of html.matchAll(HEADING_RE)) headings.push({ level: Number(m[1]), text: stripTags(m[2]) })
        if (!firstText) firstText = stripTags(html.replace(HEADING_RE, ' '))
        break
      }
      default:
    }
    for (const ids of Object.values(block.children || {})) (ids || []).forEach(visit)
  }

  for (const region of Object.values(page?.regions || {})) (region.children || []).forEach(visit)
  return { headings, images, firstText }
}

const str = (v) => (typeof v === 'string' ? v.trim() : '')

/** Normalize robots: object, "noindex,nofollow" string, or missing. Private pages are noindex. */
export function normalizeRobots(robots, visibility) {
  let index = true
  let follow = true
  if (typeof robots === 'string') {
    index = !/noindex/i.test(robots)
    follow = !/nofollow/i.test(robots)
  } else if (robots && typeof robots === 'object') {
    if (robots.index === false) index = false
    if (robots.follow === false) follow = false
  }
  if (visibility === 'private') index = false
  return { index, follow }
}

/**
 * Resolve unclamped SEO values: page -> site default -> page content.
 *
 * @returns {{title:string, description:string, content:ReturnType<typeof collectPageContent>}}
 */
export function resolveSeo(page, site) {
  const seo = page?.seo || {}
  const def = site?.settings?.defaultSeo || {}
  const content = collectPageContent(page)
  const title = str(seo.title) || str(page?.title) || str(def.title) || str(site?.name) || content.headings[0]?.text || ''
  const description = str(seo.description) || str(def.description) || content.firstText
  return { title, description, content }
}
