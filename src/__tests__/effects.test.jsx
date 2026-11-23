import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { baseBlocks } from '../blocks/index.js'
import { typewriterStep, parsePhrases } from '../blocks/TypewriterBlock.jsx'
import { formatCounter, counterAt } from '../blocks/CounterBlock.jsx'
import {
  EFFECT_PRESETS,
  sanitizeAnimation,
  sanitizeHover,
  sanitizeParallax,
  parallaxOffset,
} from '../renderer/effects.js'
import { resolveAnimation } from '../renderer/EffectsWrapper.jsx'

function makePage(blocks, rootIds) {
  const dict = {}
  for (const b of blocks) dict[b.id] = { children: {}, props: {}, ...b }
  return {
    schemaVersion: 1,
    id: 'p',
    slug: '/',
    title: 't',
    visibility: 'public',
    layoutId: null,
    regions: { main: { id: 'r', children: rootIds || [blocks[0].id] } },
    blocks: dict,
    seo: {},
    updatedAt: '',
  }
}

const mount = (page, mode = 'public') =>
  render(
    <AtlasWebBuilderProvider blocks={baseBlocks}>
      <AtlasWebRenderer page={page} mode={mode} />
    </AtlasWebBuilderProvider>,
  )

let observers
let reduced
beforeEach(() => {
  observers = []
  reduced = false
  window.matchMedia = (q) => ({
    matches: reduced && q.includes('reduce'),
    addEventListener() {},
    removeEventListener() {},
  })
  globalThis.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb
      this.targets = []
      this.disconnect = vi.fn()
      observers.push(this)
    }
    observe(target) { this.targets.push(target) }
    unobserve(target) { this.targets = this.targets.filter((t) => t !== target) }
  }
})
afterEach(() => vi.useRealTimers())

const fire = (list) => act(() => list.forEach((o) => o.cb(o.targets.map((target) => ({ target, isIntersecting: true })))))

describe('sanitizers', () => {
  it('whitelists presets and clamps numbers', () => {
    expect(EFFECT_PRESETS).toContain('blur-in')
    expect(sanitizeAnimation({ preset: 'evil; x', duration: 1 })).toBeUndefined()
    expect(
      sanitizeAnimation({ preset: 'zoom-in', duration: 99999, delay: -5, easing: 'x' }),
    ).toEqual({ preset: 'zoom-in', duration: 5000, delay: 0, easing: 'ease-out' })
    expect(
      resolveAnimation({ preset: 'flip-up', duration: 300, delay: 50, easing: 'linear' }),
    ).toBe('atlas-anim-flip-up 300ms linear 50ms both')
  })

  it('sanitizes hover and parallax', () => {
    expect(
      sanitizeHover({ scale: '1.05); x', shadow: 'xl', brightness: 500, duration: 9999 }),
    ).toEqual({ scale: '', shadow: '', brightness: 150, duration: 2000, easing: 'ease' })
    expect(sanitizeHover({ scale: '0.97' }).scale).toBe('0.97')
    expect(sanitizeParallax({ speed: 3 })).toEqual({ speed: 0.5 })
    expect(sanitizeParallax({ speed: 0 })).toBeUndefined()
    expect(parallaxOffset({ top: 600, height: 200 }, 800, 0.5)).toBe(150)
  })

  it('drops unsafe values from the rendered wrapper style', () => {
    const page = makePage([
      {
        id: 'h',
        type: 'HeadingBlock',
        props: {
          text: 'x',
          _opacity: 0.5,
          _zIndex: 99999,
          _cursor: 'url(x)',
          _filter: { blur: 999 },
        },
      },
    ])
    const w = mount(page).container.querySelector('.atlas-wb-effects-wrap')
    expect(w.style.opacity).toBe('0.5')
    expect(w.style.zIndex).toBe('1000')
    expect(w.style.cursor).toBe('')
    expect(w.style.filter).toBe('blur(50px)')
  })
})

describe('stagger', () => {
  const page = makePage(
    [
      {
        id: 'g',
        type: 'GridBlock',
        props: { _stagger: 100 },
        children: { children: ['a', 'b', 'c'] },
      },
      { id: 'a', type: 'TextBlock', props: { text: 'a' } },
      { id: 'b', type: 'TextBlock', props: { text: 'b' } },
      {
        id: 'c',
        type: 'TextBlock',
        props: { text: 'c', _animation: { preset: 'fade-in', delay: 50 }, _scrollReveal: true },
      },
    ],
    ['g'],
  )

  it('reveals children in sequence', () => {
    // Only elements that start below the fold are hidden and revealed; jsdom reports top = 0 unless told otherwise.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000, bottom: 5100, left: 0, right: 100, width: 100, height: 100 })
    const { container } = mount(page)
    expect(container.querySelectorAll('.atlas-wb-effects-wrap')).toHaveLength(3)
    fire(observers)
    const anims = [...container.querySelectorAll('.atlas-wb-effects-wrap > div')].map(
      (d) => d.style.animation,
    )
    expect(anims[0]).toContain('atlas-anim-slide-fade-up 600ms ease-out 0ms')
    expect(anims[1]).toContain('100ms both')
    expect(anims[2]).toContain('atlas-anim-fade-in 600ms ease-out 250ms')
  })
})

describe('parallax', () => {
  const page = makePage([
    { id: 'h', type: 'HeadingBlock', props: { text: 'x', _parallax: { speed: 0.3 } } },
  ])

  it('listens only while in view and cleans up', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = mount(page)
    const scrollAdds = () => add.mock.calls.filter((c) => c[0] === 'scroll')
    expect(scrollAdds()).toHaveLength(0)
    fire([observers[0]])
    expect(scrollAdds()).toHaveLength(1)
    expect(scrollAdds()[0][2]).toEqual({ passive: true })
    unmount()
    expect(remove.mock.calls.some((c) => c[0] === 'scroll')).toBe(true)
    expect(observers[0].disconnect).toHaveBeenCalled()
  })

  it('is off with reduced motion', () => {
    reduced = true
    const { container } = mount(page)
    expect(container.querySelector('[style*="will-change"]')).toBeNull()
  })
})

describe('reduced motion', () => {
  it('skips entrance animation and shows scroll-reveal content', () => {
    reduced = true
    const page = makePage([
      {
        id: 'h',
        type: 'HeadingBlock',
        props: { text: 'x', _animation: { preset: 'blur-in' }, _scrollReveal: true },
      },
    ])
    const inner = mount(page).container.querySelector('.atlas-wb-effects-wrap > div')
    expect(inner.style.animation).toBe('')
    expect(inner.style.opacity).toBe('')
  })
})

describe('CounterBlock', () => {
  it('formats and eases', () => {
    expect(formatCounter(1234.5, { decimals: 1, locale: 'en-US' })).toBe('1,234.5')
    expect(formatCounter(1234, { locale: 'en-US', grouping: false })).toBe('1234')
    expect(formatCounter(5, { locale: 'not a locale!!' })).toBe('5')
    expect(counterAt(0, 100, 0)).toBe(0)
    expect(counterAt(0, 100, 2)).toBe(100)
  })

  it('resets to the start value on the client, then counts to the end when visible', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const page = makePage([
      {
        id: 'c',
        type: 'CounterBlock',
        props: { value: 500, prefix: '$', suffix: '+', locale: 'en-US', duration: 1000 },
      },
    ])
    const { container } = mount(page)
    expect(container.textContent).toContain('$0+')
    fire(observers)
    act(() => vi.advanceTimersByTime(2000))
    expect(container.textContent).toContain('$500+')
  })

  it('shows the final value with reduced motion', () => {
    reduced = true
    const page = makePage([{ id: 'c', type: 'CounterBlock', props: { value: 42, suffix: '%' } }])
    expect(mount(page).container.textContent).toContain('42%')
  })
})

describe('TypewriterBlock', () => {
  it('parses phrases and steps through type, hold and delete', () => {
    expect(parsePhrases(' a \n\n b ')).toEqual(['a', 'b'])
    const o = { typeSpeed: 1, deleteSpeed: 2, pause: 3, loop: true }
    const ph = ['ab', 'c']
    expect(typewriterStep({ i: 0, n: 0, del: false }, ph, o)).toEqual({
      state: { i: 0, n: 1, del: false },
      delay: 1,
    })
    expect(typewriterStep({ i: 0, n: 2, del: false }, ph, o)).toEqual({
      state: { i: 0, n: 2, del: true },
      delay: 3,
    })
    expect(typewriterStep({ i: 0, n: 0, del: true }, ph, o).state).toEqual({
      i: 1,
      n: 0,
      del: false,
    })
    expect(typewriterStep({ i: 1, n: 1, del: false }, ph, { ...o, loop: false }).delay).toBeNull()
  })

  it('renders the full first phrase as plain text, and no caret with reduced motion', () => {
    const page = makePage([
      {
        id: 't',
        type: 'TypewriterBlock',
        props: { prefix: 'Hacemos', phrases: 'webs\napps', suffix: 'bonitas' },
      },
    ])
    expect(mount(page).container.textContent).toBe('Hacemos webs bonitas')
    reduced = true
    expect(mount(page).container.querySelector('.atlas-wb-typewriter__caret')).toBeNull()
  })

  it('types over time and clears timers on unmount', () => {
    vi.useFakeTimers()
    const page = makePage([
      {
        id: 't',
        type: 'TypewriterBlock',
        props: { prefix: '', phrases: 'ab\ncd', pause: 200, typeSpeed: 20, deleteSpeed: 10 },
      },
    ])
    const { container, unmount } = mount(page)
    // hold 200, delete 2 chars (hold step + 2 deletes), then first char of next phrase
    act(() => vi.advanceTimersByTime(200 + 10 + 10 + 20))
    expect(container.textContent).toBe('c')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
