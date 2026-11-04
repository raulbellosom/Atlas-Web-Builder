import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AtlasImage, groupVariants } from '../media/AtlasImage.jsx'
import { optimizeImageFile } from '../media/optimizeImage.js'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { LazyMount } from '../renderer/LazyMount.jsx'
import { createBrandTheme, fontLinks, contrastRatio, ensureContrast } from '../theme/brand.js'

afterEach(() => vi.unstubAllGlobals())

describe('AtlasImage', () => {
  it('reserves space and defaults to lazy async', () => {
    const { container } = render(<AtlasImage src="/a.jpg" alt="a" width={800} height={400} />)
    const img = container.querySelector('img')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('decoding')).toBe('async')
    expect(img.style.aspectRatio).toBe('800 / 400')
  })

  it('priority forces eager + high fetchpriority', () => {
    const { container } = render(<AtlasImage src="/a.jpg" priority />)
    const img = container.querySelector('img')
    expect(img.getAttribute('loading')).toBe('eager')
    expect(img.getAttribute('fetchpriority')).toBe('high')
  })

  it('builds <picture> from asset variants, avif before webp', () => {
    const variants = [
      { width: 960, url: '/a-960.webp', format: 'webp' },
      { width: 480, url: '/a-480.webp', format: 'webp' },
      { width: 480, url: '/a-480.avif', format: 'avif' },
    ]
    const { container } = render(<AtlasImage src="/a.jpg" variants={variants} />)
    const sources = [...container.querySelectorAll('source')]
    expect(sources.map((s) => s.getAttribute('type'))).toEqual(['image/avif', 'image/webp'])
    expect(sources[1].getAttribute('srcset')).toBe('/a-480.webp 480w, /a-960.webp 960w')
    expect(groupVariants([{ width: 1, url: 'x', format: 'webp' }])).toHaveLength(1)
  })

  it('uses imageUrlBuilder with widths', () => {
    const imageUrlBuilder = (src, { width, format }) => `${src}?w=${width}${format ? `&f=${format}` : ''}`
    const { container } = render(
      <AtlasImage src="/a.jpg" widths={[400, 800]} imageUrlBuilder={imageUrlBuilder} />,
    )
    expect(container.querySelector('picture')).not.toBeNull()
    expect(container.querySelector('img').getAttribute('srcset')).toBe('/a.jpg?w=400 400w, /a.jpg?w=800 800w')
  })

  it('renders a plain img when nothing can be transformed', () => {
    const { container } = render(<AtlasImage src="/a.jpg" />)
    expect(container.querySelector('picture')).toBeNull()
    expect(container.querySelector('img').hasAttribute('srcset')).toBe(false)
  })
})

describe('optimizeImageFile', () => {
  it('skips svg and gif', async () => {
    const f = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' })
    const r = await optimizeImageFile(f)
    expect(r.variants).toEqual([])
    expect(r.original).toBe(f)
  })
})

describe('LazyMount', () => {
  it('renders immediately without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { getByText } = render(<LazyMount>hola</LazyMount>)
    expect(getByText('hola')).toBeTruthy()
  })

  it('defers until intersecting', () => {
    let cb
    vi.stubGlobal('IntersectionObserver', class {
      constructor(fn) { cb = fn }
      observe() {}
      disconnect() {}
    })
    const { container, queryByText } = render(<LazyMount minHeight={100}>hola</LazyMount>)
    expect(queryByText('hola')).toBeNull()
    expect(container.firstChild.style.minHeight).toBe('100px')
    act(() => cb([{ isIntersecting: true }]))
    expect(queryByText('hola')).toBeTruthy()
  })
})

describe('brand theme', () => {
  it('derives readable foregrounds and guarantees muted contrast', () => {
    const t = createBrandTheme({ primary: '#FFEB3B', neutral: '#CCCCCC', fontHeading: 'Poppins', fontBody: 'Nunito' })
    const c = t.tokens.color
    expect(contrastRatio(c.primary, c.primaryFg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(c.muted, c.bg)).toBeGreaterThanOrEqual(4.5)
    expect(t.tokens.font.heading).toContain('Poppins')
    expect(t.tokens.radius.md).toBeDefined()
  })

  it('ensureContrast leaves good colors alone', () => {
    expect(ensureContrast('#000000', '#FFFFFF')).toBe('#000000')
  })

  it('fontLinks lists custom families only', () => {
    const t = createBrandTheme({ fontHeading: 'Playfair Display', fontBody: 'Source Sans 3' })
    const href = fontLinks(t)
    expect(href).toContain('family=Playfair+Display')
    expect(href).toContain('family=Source+Sans+3')
    expect(fontLinks({ tokens: { font: { sans: 'system-ui, sans-serif' } } })).toBeNull()
  })
})

describe('lazy blocks in the renderer', () => {
  const Lazy = defineBlock({ type: 'LazyB', lazy: true, render: ({ t }) => <p>{t}</p> })
  const mk = (n) => ({
    schemaVersion: 1, id: 'p', slug: '/', title: 'p', visibility: 'public', layoutId: null,
    regions: { main: { id: 'r', children: Array.from({ length: n }, (_, i) => `b${i}`) } },
    blocks: Object.fromEntries(Array.from({ length: n }, (_, i) => [`b${i}`, { id: `b${i}`, type: 'LazyB', props: { t: `t${i}` }, children: {} }])),
  })
  const view = (mode) => render(
    <AtlasWebBuilderProvider blocks={[Lazy]}><AtlasWebRenderer page={mk(4)} mode={mode} /></AtlasWebBuilderProvider>,
  )

  it('keeps the first 2 root blocks eager and defers the rest', () => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
    const { queryByText, container } = view('public')
    expect(queryByText('t0')).toBeTruthy()
    expect(queryByText('t1')).toBeTruthy()
    expect(queryByText('t2')).toBeNull()
    expect(container.querySelectorAll('[data-atlas-lazy="pending"]')).toHaveLength(2)
  })

  it('never defers in edit mode', () => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
    expect(view('edit').queryByText('t3')).toBeTruthy()
  })
})
