import { describe, it, expect } from 'vitest'
import { buildSeoMeta, analyzeSeo, renderSeoHead, serializeJsonLd, clamp } from '../seo/index.js'

const block = (id, type, props, children) => ({ id, type, props, children: children || {} })
function makePage(blocks, seo, extra) {
  return {
    schemaVersion: 1, id: 'p1', slug: '/hola', title: 'Hola mundo', visibility: 'public',
    regions: { main: { id: 'main', children: blocks.map((b) => b.id) } },
    blocks: Object.fromEntries(blocks.map((b) => [b.id, b])),
    seo, ...extra,
  }
}
const hero = block('h', 'HeroBlock', { title: 'Bienvenido', subtitle: 'Subtitulo de la pagina' })

describe('buildSeoMeta', () => {
  it('falls back page title -> site and content, clamps and absolutizes', () => {
    const page = makePage([hero], { ogImage: '/img/a.png' })
    const site = { name: 'Mi Sitio', locale: 'es-MX', settings: { defaultSeo: { description: 'Desc del sitio' } } }
    const r = buildSeoMeta(page, site, { baseUrl: 'https://ex.com' })
    expect(r.title).toBe('Hola mundo')
    const get = (k, v) => r.meta.find((m) => m[k] === v)?.content
    expect(get('name', 'description')).toBe('Desc del sitio')
    expect(get('property', 'og:image')).toBe('https://ex.com/img/a.png')
    expect(get('property', 'og:locale')).toBe('es_MX')
    expect(get('name', 'twitter:card')).toBe('summary_large_image')
    expect(r.link).toEqual([{ rel: 'canonical', href: 'https://ex.com/hola' }])
    expect(clamp('a'.repeat(80), 60).length).toBe(60)
  })

  it('uses first text when no description anywhere, honors robots and legacy asset id', () => {
    const page = makePage([hero], { robots: { index: false, follow: true }, ogImageAssetId: 'a1' })
    const r = buildSeoMeta(page, null, { baseUrl: 'https://ex.com', resolveAsset: () => ({ url: 'https://cdn/x.jpg' }) })
    const get = (n) => r.meta.find((m) => m.name === n || m.property === n)?.content
    expect(get('description')).toBe('Subtitulo de la pagina')
    expect(get('robots')).toBe('noindex,follow')
    expect(get('og:image')).toBe('https://cdn/x.jpg')
  })

  it('private pages are noindex and unsafe urls are dropped', () => {
    const page = makePage([hero], { ogImage: 'javascript:alert(1)' }, { visibility: 'private' })
    const r = buildSeoMeta(page, null, { baseUrl: 'https://ex.com' })
    expect(r.meta.find((m) => m.name === 'robots').content).toBe('noindex,follow')
    expect(r.meta.find((m) => m.property === 'og:image')).toBeUndefined()
  })

  it('builds only whitelisted structured data', () => {
    const page = makePage([hero], {
      structuredData: [
        { type: 'FAQPage', items: [{ question: 'Q?', answer: 'A' }, { question: '', answer: 'x' }] },
        { type: 'Organization', name: 'Acme', sameAs: 'https://fb.com/acme, javascript:x', evil: '</script>' },
        { type: 'Script', name: 'x' },
        { type: 'constructor' },
      ],
    })
    const { jsonLd } = buildSeoMeta(page, null, { baseUrl: 'https://ex.com' })
    expect(jsonLd).toHaveLength(2)
    expect(jsonLd[0].mainEntity).toHaveLength(1)
    expect(jsonLd[1].sameAs).toEqual(['https://fb.com/acme'])
    expect(jsonLd[1].evil).toBeUndefined()
  })
})

describe('serializeJsonLd / renderSeoHead', () => {
  it('escapes < so a script tag cannot be closed', () => {
    expect(serializeJsonLd({ a: '</script><b>' })).not.toContain('<')
  })

  it('escapes attribute values and title', () => {
    const page = makePage([hero], { title: 'A "q" <b>', description: `x" onload="alert(1)`, structuredData: [{ type: 'WebSite', name: '</script>' }] })
    const html = renderSeoHead(page, null, { baseUrl: 'https://ex.com' })
    expect(html).toContain('<title>A &quot;q&quot; &lt;b&gt;</title>')
    expect(html).toContain('content="x&quot; onload=&quot;alert(1)"')
    expect(html.match(/<\/script>/g)).toHaveLength(1)
  })
})

describe('analyzeSeo', () => {
  const codes = (r) => r.map((c) => c.code)

  it('flags missing h1, alt, og image, heading jumps and noindex', () => {
    const page = makePage([
      block('a', 'HeadingBlock', { text: 'Uno', level: 'h2' }),
      block('b', 'HeadingBlock', { text: 'Tres', level: 'h4' }),
      block('i', 'ImageBlock', { src: '/x.png', alt: '' }),
    ], { robots: 'noindex' }, { title: '' })
    const c = codes(analyzeSeo(page, null))
    expect(c).toEqual(expect.arrayContaining([
      'title-short', 'description-missing', 'h1-missing', 'heading-order', 'img-alt-missing', 'og-image-missing', 'noindex',
    ]))
  })

  it('flags several H1 (including nested and rich text) and duplicate description', () => {
    const page = makePage([
      hero,
      block('s', 'SectionBlock', {}, { default: ['r'] }),
      block('r', 'RichTextBlock', { html: '<h1>Otro</h1><p>texto</p>' }),
    ], { title: 'Un titulo suficientemente largo para SEO ok' })
    const site = { settings: { defaultSeo: { description: 'Subtitulo de la pagina' } } }
    const c = codes(analyzeSeo(page, site))
    expect(c).toContain('h1-multiple')
    expect(c).toContain('description-duplicate')
  })

  it('reports ok for a healthy page', () => {
    const page = makePage([hero], {
      title: 'Un titulo suficientemente largo para SEO ok',
      description: 'd'.repeat(100),
      ogImage: 'https://ex.com/a.png',
    })
    expect(analyzeSeo(page, null).every((c) => c.level === 'ok')).toBe(true)
  })
})
