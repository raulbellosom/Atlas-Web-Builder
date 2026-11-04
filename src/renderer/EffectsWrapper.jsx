/**
 * @file EffectsWrapper — universal effects layer applied to every block instance.
 *
 * Handles five effect categories stored as underscore-prefixed props:
 *   _opacity     : number 0-1
 *   _animation   : { preset, duration, delay, easing }
 *   _filter      : { blur, brightness, contrast, grayscale, sepia }
 *   _transform   : { rotate, skewX, skewY }
 *   _hover       : { scale, shadow, brightness, duration, easing }
 *   _scrollReveal: boolean — triggers _animation when block enters viewport
 *   _cursor      : CSS cursor keyword
 *   _sticky      : boolean — position:sticky + top:0
 *   _zIndex      : number
 *
 * When no effects are set the children are returned unwrapped so the DOM
 * stays clean for blocks without effects.
 *
 * Hover CSS is injected via a <style> tag using the unique blockId as a
 * data-attribute selector, avoiding any runtime class injection libraries.
 *
 * ScrollReveal uses IntersectionObserver (gracefully degraded to immediate
 * in edit mode or unsupported environments).
 */

import { useRef, useEffect, useState, useContext } from 'react'
import { resolveFilter } from '../editor/fields/FilterField.jsx'
import {
  EFFECT_SHAPES,
  StaggerContext,
  clampNum,
  parallaxOffset,
  sanitizeAnimation,
  sanitizeFilter,
  sanitizeHover,
  sanitizeParallax,
  sanitizeTransform,
  useReducedMotion,
} from './effects.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a CSS `animation` shorthand string from the stored animation object.
 * @param {{ preset:string, duration:number, delay:number, easing:string }|undefined} anim
 * @returns {string|undefined}
 */
export function resolveAnimation(anim) {
  if (!anim || !anim.preset || anim.preset === 'none') return undefined
  const dur = anim.duration ?? 600
  const del = anim.delay ?? 0
  const ease = anim.easing || 'ease-out'
  return `atlas-anim-${anim.preset} ${dur}ms ${ease} ${del}ms both`
}

/**
 * Build a CSS `transform` string from the stored transform object.
 * @param {{ rotate:number, skewX:number, skewY:number }|undefined} t
 * @returns {string|undefined}
 */
export function resolveTransform(t) {
  if (!t) return undefined
  const parts = []
  if (t.rotate) parts.push(`rotate(${t.rotate}deg)`)
  if (t.skewX) parts.push(`skewX(${t.skewX}deg)`)
  if (t.skewY) parts.push(`skewY(${t.skewY}deg)`)
  return parts.length ? parts.join(' ') : undefined
}

// CSS.escape does not exist in Node (SSR); escaping backslash and quote is enough inside a quoted attribute value.
const escapeAttr = (v) => String(v).replace(/[\\"<\n\r]/g, (c) => (c === '<' ? '\\3c ' : c === '\n' || c === '\r' ? ' ' : `\\${c}`))

// ── Hover style tag ───────────────────────────────────────────────────────────

/**
 * Renders a scoped <style> tag that applies hover CSS to the block wrapper
 * identified by [data-eid="blockId"].
 */
function HoverStyleTag({ blockId, hover }) {
  if (!hover) return null
  const { scale, shadow, brightness, duration = 200, easing = 'ease' } = hover
  const hasScale = scale && scale !== '' && scale !== '1'
  const hasShadow = shadow && shadow !== ''
  const hasBrightness = brightness !== undefined && brightness !== 100

  if (!hasScale && !hasShadow && !hasBrightness) return null

  const sel = `[data-eid="${escapeAttr(blockId)}"]`
  const hoverParts = []
  if (hasScale) hoverParts.push(`transform: scale(${scale})`)
  if (hasShadow) hoverParts.push(`box-shadow: var(--atlas-shadow-${shadow}, none)`)
  if (hasBrightness) hoverParts.push(`filter: brightness(${brightness}%)`)

  const transProps = ['transform', 'box-shadow', 'filter']
    .map((p) => `${p} ${duration}ms ${easing}`)
    .join(', ')

  const css =
    `${sel} { transition: ${transProps}; }\n` + `${sel}:hover { ${hoverParts.join('; ')}; }\n`

  // Raw HTML: React would entity-escape the quotes in SSR output, which <style> never decodes.
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────────

/**
 * Wraps children and triggers the entrance animation when the element enters
 * the viewport. In edit mode the block is always visible immediately.
 */
function ScrollRevealWrapper({ animation, mode, reduced, children }) {
  const ref = useRef(null)
  // Edit mode → always visible; public/preview → hidden until intersecting
  const [visible, setVisible] = useState(mode === 'edit' || reduced)

  useEffect(() => {
    if (mode === 'edit' || reduced) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.08 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [mode, reduced])

  const animStr = reduced ? undefined : resolveAnimation(animation)
  const style = visible && animStr ? { animation: animStr } : !visible ? { opacity: 0 } : {}

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  )
}

// ── Parallax wrapper ──────────────────────────────────────────────────────────

/**
 * Translates its content vertically while in view. Scroll/resize listeners
 * (passive, rAF-throttled) exist only while the IntersectionObserver reports
 * the element on screen, and are removed on unmount.
 */
function ParallaxWrapper({ speed, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    let raf = 0
    let listening = false
    const update = () => {
      raf = 0
      el.style.transform = `translate3d(0, ${parallaxOffset(el.getBoundingClientRect(), window.innerHeight, speed)}px, 0)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const listen = (on) => {
      if (on === listening) return
      listening = on
      const fn = on ? 'addEventListener' : 'removeEventListener'
      window[fn]('scroll', onScroll, { passive: true })
      window[fn]('resize', onScroll, { passive: true })
      if (on) update()
    }
    const obs = new IntersectionObserver(([entry]) => listen(entry.isIntersecting))
    obs.observe(el)
    return () => {
      obs.disconnect()
      listen(false)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [speed])

  return (
    <div ref={ref} style={{ willChange: 'transform' }}>
      {children}
    </div>
  )
}

// ── Main wrapper ──────────────────────────────────────────────────────────────

/**
 * Apply all universal effects to a rendered block.
 *
 * @param {{
 *   blockId : string,
 *   props   : Record<string,any>,
 *   mode    : 'edit'|'preview'|'public',
 *   children: React.ReactNode,
 * }} param0
 */
export function EffectsWrapper({ blockId, props, mode, children }) {
  const stagger = useContext(StaggerContext)
  const out = (
    <EffectsInner blockId={blockId} props={props} mode={mode} stagger={stagger}>
      {children}
    </EffectsInner>
  )
  // Stagger applies to direct slot children only; reset it for deeper levels.
  return stagger ? <StaggerContext.Provider value={null}>{out}</StaggerContext.Provider> : out
}

function EffectsInner({ blockId, props, mode, stagger, children }) {
  const { _opacity, _cursor, _zIndex, _sticky } = props
  const reduced = useReducedMotion()

  const ownAnim = sanitizeAnimation(props._animation)
  // A child of a `_stagger` parent without its own animation inherits the
  // parent's, always scroll-revealed; with its own, only the delay is added.
  const inherited = !ownAnim && stagger ? stagger.animation : undefined
  const baseAnim = ownAnim || inherited
  const anim =
    baseAnim && stagger
      ? { ...baseAnim, delay: Math.min(5000, baseAnim.delay + stagger.delay) }
      : baseAnim
  const scrollReveal = (!!props._scrollReveal && !!ownAnim) || !!inherited
  const hover = sanitizeHover(props._hover)
  const parallax = reduced || mode === 'edit' ? undefined : sanitizeParallax(props._parallax)

  const filterVal = resolveFilter(sanitizeFilter(props._filter))
  const transformVal = resolveTransform(sanitizeTransform(props._transform))
  // Animation fires immediately unless scroll-reveal takes over
  const animVal = scrollReveal || reduced ? undefined : resolveAnimation(anim)

  // Build the wrapper inline style
  const style = {}
  const opacity = clampNum(_opacity, 0, 1, 1)
  if (opacity !== 1) style.opacity = opacity
  if (filterVal) style.filter = filterVal
  if (animVal) style.animation = animVal
  if (transformVal) style.transform = transformVal
  if (EFFECT_SHAPES.cursor.includes(_cursor) && _cursor !== 'auto') style.cursor = _cursor
  if (_sticky) {
    style.position = 'sticky'
    style.top = 0
  }
  const z = clampNum(_zIndex, -1000, 1000, 0)
  if (z) style.zIndex = Math.round(z)

  const hasHover = !!hover && !!(hover.scale || hover.shadow || hover.brightness !== 100)
  const hasScrollReveal = scrollReveal && !!anim
  const hasEffects = Object.keys(style).length > 0 || hasHover || hasScrollReveal || !!parallax

  if (!hasEffects) return children

  let content = children
  if (parallax) content = <ParallaxWrapper speed={parallax.speed}>{content}</ParallaxWrapper>
  if (hasScrollReveal) {
    content = (
      <ScrollRevealWrapper animation={anim} mode={mode} reduced={reduced}>
        {content}
      </ScrollRevealWrapper>
    )
  }

  return (
    <>
      {hasHover && <HoverStyleTag blockId={blockId} hover={hover} />}
      <div
        data-eid={hasHover ? blockId : undefined}
        className="atlas-wb-effects-wrap"
        style={style}
      >
        {content}
      </div>
    </>
  )
}
