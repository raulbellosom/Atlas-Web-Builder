// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { renderToString } from 'react-dom/server'
import { baseBlocks } from '../blocks/index.js'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'

const effects = {
  _hover: { scale: '1.05', shadow: 'md', brightness: 110 },
  _animation: { preset: 'fade-in', duration: 500, delay: 0, easing: 'ease' },
  _scrollReveal: true,
  _parallax: { speed: 0.3 },
}

function pageWith(blocks) {
  return {
    schemaVersion: 1, id: 'p', slug: '/', title: 't', visibility: 'public', layoutId: null,
    regions: { main: { id: 'r', children: Object.keys(blocks) } },
    blocks, seo: {}, updatedAt: '',
  }
}

const ssr = (page, mode = 'public') =>
  renderToString(
    <AtlasWebBuilderProvider blocks={baseBlocks}>
      <AtlasWebRenderer page={page} mode={mode} />
    </AtlasWebBuilderProvider>,
  )

describe('server-side rendering', () => {
  beforeAll(() => vi.stubGlobal('CSS', undefined))
  afterAll(() => vi.unstubAllGlobals())

  it('runs without browser globals', () => {
    expect(typeof window).toBe('undefined')
    expect(globalThis.CSS).toBeUndefined()
  })

  it('renders a _hover block with a quote-safe selector', () => {
    const id = 'b"1'
    const html = ssr(pageWith({ [id]: { id, type: 'HeadingBlock', props: { text: 'Hola', ...effects }, children: {} } }))
    expect(html).toContain('Hola')
    expect(html).toContain('data-eid="b&quot;1"')
    expect(html).toContain('[data-eid="b\\"1"]:hover')
  })

  it('renders every base block type', () => {
    const blocks = {}
    baseBlocks.forEach((def, i) => {
      const id = `b${i}`
      blocks[id] = { id, type: def.type, props: { ...(i % 2 ? effects : {}) }, children: {} }
    })
    for (const mode of ['public', 'preview']) {
      const html = ssr(pageWith(blocks), mode)
      expect(html.length).toBeGreaterThan(0)
    }
  })
})
