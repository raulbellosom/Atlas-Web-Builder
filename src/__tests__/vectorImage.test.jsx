import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { baseBlocks } from '../blocks/index.js'
import { assetProps } from '../editor/assets/assetSource.js'
import { cssUrl, isVectorAsset, vectorImageDefaults } from '../media/vector.js'

const def = baseBlocks.find((block) => block.type === 'ImageBlock')
const markup = (props) => renderToStaticMarkup(def.render({ ...def.defaultProps, ctx: { mode: 'public' }, ...props }))

describe('SVG images', () => {
  it('detects vectors by flag, mime or URL and never by raster URLs', () => {
    expect(isVectorAsset({ vector: true })).toBe(true)
    expect(isVectorAsset({ mimeType: 'image/svg+xml' })).toBe(true)
    expect(isVectorAsset({ src: 'https://cdn.test/logo.svg?v=2' })).toBe(true)
    expect(isVectorAsset({ src: 'data:image/svg+xml;base64,AAAA' })).toBe(true)
    expect(isVectorAsset({ src: 'https://cdn.test/photo.png' })).toBe(false)
    expect(isVectorAsset({ src: 'https://cdn.test/not.svg.png' })).toBe(false)
  })

  it('picking an SVG shows it whole; picking a raster clears vector state', () => {
    const svg = assetProps(def, { url: 'https://cdn.test/a', mimeType: 'image/svg+xml', width: 24, height: 24 }, {})
    expect(svg).toMatchObject({ src: 'https://cdn.test/a', vector: true, aspectRatio: 'auto', objectFit: 'contain', naturalWidth: 24 })
    expect(assetProps(def, { url: 'https://cdn.test/p.png', mimeType: 'image/png' }, {})).toMatchObject({ vector: false, tint: 'none' })
    expect(vectorImageDefaults(undefined)).toEqual({ vector: false, tint: 'none' })
  })

  it('untinted SVG stays a plain <img>; tinted SVG becomes a token-colored CSS mask', () => {
    const plain = markup({ src: 'https://cdn.test/logo.svg', alt: 'Logo', vector: true })
    expect(plain).toContain('<img')
    expect(plain).not.toContain('mask')
    const tinted = markup({ src: 'https://cdn.test/icon.svg', alt: 'Icono', vector: true, tint: 'primary', aspectRatio: 'auto', naturalWidth: 24, naturalHeight: 12 })
    expect(tinted).not.toContain('<img')
    expect(tinted).toContain('role="img"')
    expect(tinted).toContain('aria-label="Icono"')
    expect(tinted).toContain('--atlas-color-primary')
    expect(tinted).toContain('mask:url(&quot;https://cdn.test/icon.svg&quot;)')
    expect(tinted).toContain('aspect-ratio:24 / 12')
  })

  it('tint is ignored for rasters, unknown tokens and decorative icons hide from assistive tech', () => {
    expect(markup({ src: 'https://cdn.test/p.png', tint: 'primary' })).toContain('<img')
    expect(markup({ src: 'https://cdn.test/i.svg', vector: true, tint: 'javascript:alert(1)' })).toContain('<img')
    expect(markup({ src: 'https://cdn.test/i.svg', vector: true, tint: 'fg' })).toContain('aria-hidden="true"')
  })

  it('cssUrl cannot be closed from inside the value', () => {
    expect(cssUrl('https://x.test/a.svg")};background:url(https://evil')).toBe('url("https://x.test/a.svg)};background:url(https://evil")')
    expect(cssUrl('a\\b\nc\r')).toBe('url("abc")')
  })
})
