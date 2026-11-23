import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { baseBlocks } from '../blocks/index.js'
import { animationVars, kenBurnsVars } from '../renderer/EffectsWrapper.jsx'
import { observerCount } from '../renderer/RevealObserver.js'

const pageWith = (props) => ({ schemaVersion: 1, id: 'p', slug: '/', title: 't', visibility: 'public', regions: { main: { id: 'r', children: ['a'] } }, blocks: { a: { id: 'a', type: 'HeadingBlock', props: { text: 'Hola', ...props }, children: {} } }, seo: {} })
const tree = (page, mode = 'public') => <AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={page} mode={mode} /></AtlasWebBuilderProvider>

let observers, reduced
beforeEach(() => {
  observers = []; reduced = false
  window.matchMedia = (query) => ({ matches: reduced && query.includes('reduce'), addEventListener() {}, removeEventListener() {} })
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = []; this.disconnect = vi.fn(); observers.push(this) }
    observe(target) { this.targets.push(target) }
    unobserve(target) { this.targets = this.targets.filter((t) => t !== target) }
  }
})
afterEach(() => { vi.restoreAllMocks() })
const below = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000, bottom: 5100, left: 0, right: 100, width: 100, height: 100 })
const see = (visible = true) => act(() => observers.forEach((o) => o.callback(o.targets.map((target) => ({ target, isIntersecting: visible })))))

describe('server-rendered motion is always visible', () => {
  const effectProps = [
    { _animation: { preset: 'slide-up', duration: 800 }, _scrollReveal: true },
    { _animation: { preset: 'blur-in', blur: 20 }, _scrollReveal: true, _stagger: 100 },
    { _animation: { preset: 'zoom-in', scaleFrom: 0.7 } },
    { _kenburns: { zoom: 1.2, pan: 'left' } },
    { _parallax: { speed: 0.3 } },
    { _hover: { scale: '1.05' }, _pressed: { scale: 0.95 } },
  ]
  it.each(effectProps)('no markup hides content for %j', (props) => {
    const html = renderToString(tree(pageWith(props)))
    expect(html).toContain('Hola')
    expect(html).not.toMatch(/opacity:\s*0(?![.\d])/)
    expect(html).not.toContain('atlas-reveal--pending')
    expect(html).not.toMatch(/visibility:\s*hidden/)
  })
})

describe('scroll reveal', () => {
  const props = { _animation: { preset: 'slide-up', distance: 60, duration: 700 }, _scrollReveal: true }

  it('hides only elements below the fold, after mount, and reveals them once with the tuned animation', () => {
    below()
    const { container } = render(tree(pageWith(props)))
    const reveal = container.querySelector('.atlas-wb-effects-wrap > div')
    expect(reveal.className).toBe('atlas-reveal--pending')
    expect(observerCount()).toBeGreaterThan(0)
    see(true)
    expect(reveal.className).toBe('')
    expect(reveal.style.animation).toContain('atlas-anim-slide-up 700ms')
    expect(reveal.style.getPropertyValue('--atlas-anim-distance')).toBe('60px')
    expect(observerCount()).toBe(0)
  })

  it('leaves elements that start on screen untouched (no hide-then-show flash)', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 100, bottom: 200, left: 0, right: 100, width: 100, height: 100 })
    const { container } = render(tree(pageWith(props)))
    const reveal = container.querySelector('.atlas-wb-effects-wrap > div')
    expect(reveal.className).toBe('')
    expect(reveal.style.animation).toBe('')
  })

  it('replays on re-entry only when once is false', () => {
    below()
    const { container } = render(tree(pageWith({ ...props, _animation: { ...props._animation, once: false } })))
    const reveal = container.querySelector('.atlas-wb-effects-wrap > div')
    see(true); expect(reveal.className).toBe('')
    see(false); expect(reveal.className).toBe('atlas-reveal--pending')
    see(true); expect(reveal.style.animation).toContain('atlas-anim-slide-up')
  })

  it('never hides or animates under reduced motion', () => {
    below(); reduced = true
    const { container } = render(tree(pageWith(props)))
    expect(container.querySelector('.atlas-reveal--pending')).toBeNull()
    expect(container.querySelector('.atlas-wb-effects-wrap > div').style.animation).toBe('')
  })

  it('one shared observer serves many animated blocks', () => {
    below()
    const blocks = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`b${i}`, { id: `b${i}`, type: 'HeadingBlock', props: { text: `H${i}`, ...props }, children: {} }]))
    const many = { ...pageWith({}), regions: { main: { id: 'r', children: Object.keys(blocks) } }, blocks }
    render(tree(many))
    expect(observerCount()).toBe(1)
  })
})

describe('horizontal containment', () => {
  it('clips sideways movement so the page cannot scroll horizontally', () => {
    for (const props of [{ _animation: { preset: 'slide-left' } }, { _animation: { preset: 'slide-up', distance: 80 } }, { _parallax: { speed: 0.3 } }, { _kenburns: { zoom: 1.2 } }]) {
      expect(renderToString(tree(pageWith(props)))).toContain('overflow-x:clip')
    }
    expect(renderToString(tree(pageWith({ _animation: { preset: 'fade-in' } })))).not.toContain('overflow-x')
  })
})

describe('Ken Burns', () => {
  it('renders a clipped frame with a moving layer and exact custom properties', () => {
    const html = renderToString(tree(pageWith({ _kenburns: { zoom: 1.2, direction: 'in', pan: 'left', duration: 9000, easing: 'linear' } })))
    expect(html).toContain('class="atlas-kenburns"')
    expect(html).toContain('class="atlas-kenburns__layer"')
    expect(html).toContain('--kb-duration:9000ms')
    expect(html).toContain('--kb-to:1.2')
  })
  it('computes pan inside the zoomed overflow and swaps ends for zoom-out', () => {
    const inVars = kenBurnsVars({ zoom: 1.2, direction: 'in', pan: 'left', duration: 1, easing: 'linear' })
    const outVars = kenBurnsVars({ zoom: 1.2, direction: 'out', pan: 'left', duration: 1, easing: 'linear' })
    expect(inVars['--kb-from']).toBe(1); expect(inVars['--kb-to']).toBe(1.2)
    expect(outVars['--kb-from']).toBe(1.2); expect(outVars['--kb-to']).toBe(1)
    expect(parseFloat(inVars['--kb-fx'])).toBeCloseTo(8.333, 2)
    expect(parseFloat(inVars['--kb-tx'])).toBeCloseTo(-8.333, 2)
    expect(parseFloat(outVars['--kb-fx'])).toBeCloseTo(-8.333, 2)
    expect(kenBurnsVars({ zoom: 1.5, direction: 'in', pan: 'none', duration: 1, easing: 'linear' })['--kb-fx']).toBe('0%')
  })
  it('is off under reduced motion', () => {
    reduced = true
    const { container } = render(tree(pageWith({ _kenburns: { zoom: 1.2 } })))
    expect(container.querySelector('.atlas-kenburns')).toBeNull()
  })
})

describe('interaction states', () => {
  const css = (props) => renderToString(tree(pageWith(props))).match(/<style>([\s\S]*?)<\/style>/)?.[1].replaceAll('&quot;', '"') ?? ''
  it('applies hover only where a pointer can hover, pressed everywhere, and no transition under reduced motion', () => {
    const out = css({ _hover: { scale: '1.05', brightness: 110 }, _pressed: { scale: 0.95, brightness: 90 } })
    expect(out).toMatch(/@media \(hover: hover\) and \(pointer: fine\) \{[^}]*:hover \{ transform: scale\(1\.05\); filter: brightness\(110%\); \}/)
    expect(out).toContain(':active { transform: scale(0.95); filter: brightness(90%); }')
    expect(out).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^}]*transition: none/)
    const outsideMedia = out.replace(/@media[^{]*\{[^}]*\}[^}]*\}/g, '')
    expect(outsideMedia).not.toContain(':hover')
  })
  it('pressed works without any hover effect', () => {
    const out = css({ _pressed: { scale: 0.9 } })
    expect(out).toContain(':active { transform: scale(0.9); }')
    expect(out).not.toContain(':hover')
  })
  it('animation custom properties only appear when set', () => {
    expect(animationVars({ preset: 'slide-up' })).toEqual({})
    expect(animationVars({ distance: 40, scaleFrom: 0.8, blur: 6 })).toEqual({ '--atlas-anim-distance': '40px', '--atlas-anim-scale': '0.8', '--atlas-anim-blur': '6px' })
  })
})
