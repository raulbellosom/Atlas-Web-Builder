import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { baseBlocks } from '../blocks/index.js'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'

const text = id => ({ id, type: 'TextBlock', props: { text: `Contenido ${id}` } })
function pageWith(props) {
  const n = Number(props.count) || 2
  const cols = Object.fromEntries(Array.from({ length: n }, (_, i) => [`col${i}`, [`t${i}`]]))
  return {
    schemaVersion: 1, id: 'p', slug: '/', title: 't', visibility: 'public', layoutId: null,
    regions: { main: { id: 'r', children: ['c'] } },
    blocks: { c: { id: 'c', type: 'ColumnsBlock', props, children: cols }, ...Object.fromEntries(Object.keys(cols).map((_, i) => [`t${i}`, text(`t${i}`)])) },
    seo: {}, updatedAt: '',
  }
}
const tree = page => <AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={page} mode="public" /></AtlasWebBuilderProvider>
const parse = html => { const host = document.createElement('div'); host.innerHTML = html; return host }

describe('ColumnsBlock stacking', () => {
  it.each([['2', 'repeat(2, minmax(0, 1fr))'], ['3', 'repeat(3, minmax(0, 1fr))'], ['4', 'repeat(4, minmax(0, 1fr))']])(
    '%s columns: stacks only when stackOnMobile is on, keeping the configured template inline', (count, template) => {
      for (const stackOnMobile of [true, false, undefined]) {
        const props = { count, ...(stackOnMobile === undefined ? {} : { stackOnMobile }) }
        const root = parse(renderToString(tree(pageWith(props))))
        const wrapper = root.querySelector('.atlas-cols'), grid = root.querySelector('.atlas-cols__grid')
        expect(wrapper).toBeTruthy()
        // Historical documents without the prop inherit the declared default (true).
        expect(wrapper.classList.contains('atlas-cols--stack')).toBe(stackOnMobile !== false)
        expect(grid.style.gridTemplateColumns).toBe(template)
        expect(grid.children).toHaveLength(Number(count))
      }
    })

  it('keeps the asymmetric two-column layouts', () => {
    const grid = parse(renderToString(tree(pageWith({ count: '2', layout: '1-2', stackOnMobile: false })))).querySelector('.atlas-cols__grid')
    expect(grid.style.gridTemplateColumns).toBe('1fr 2fr')
  })

  it('hydrates the server markup without mismatches', async () => {
    const page = pageWith({ count: '3', stackOnMobile: true })
    const container = document.createElement('div')
    container.innerHTML = renderToString(tree(page))
    document.body.appendChild(container)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    let root
    await act(async () => { root = hydrateRoot(container, tree(page), { onRecoverableError: e => { throw e } }) })
    expect(error).not.toHaveBeenCalled()
    expect(container.querySelector('.atlas-cols--stack .atlas-cols__grid')).toBeTruthy()
    act(() => root.unmount()); container.remove(); error.mockRestore()
  })
})

describe('SectionBlock width', () => {
  it('includes its horizontal padding in a full-bleed width (no page overflow without a host reset)', () => {
    const page = { schemaVersion: 1, id: 'p', slug: '/', title: 't', visibility: 'public', layoutId: null, regions: { main: { id: 'r', children: ['s'] } }, blocks: { s: { id: 's', type: 'SectionBlock', props: { paddingX: '4' }, children: { children: [] } } }, seo: {}, updatedAt: '' }
    // Raw server markup: jsdom's CSS parser rewrites/drops declarations next to var() shorthands.
    const style = renderToString(tree(page)).match(/<section[^>]*style="([^"]*)"/)[1]
    expect(style).toContain('width:100%')
    expect(style).toContain('box-sizing:border-box')
  })
})
