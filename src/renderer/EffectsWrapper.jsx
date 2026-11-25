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

import { createContext, useRef, useEffect, useLayoutEffect, useState, useContext } from 'react'
import { resolveFilter } from '../editor/fields/FilterField.jsx'
import {
  EFFECT_SHAPES,
  StaggerContext,
  clampNum,
  parallaxOffset,
  sanitizeAnimation,
  sanitizeFilter,
  sanitizeHover,
  sanitizeKenBurns,
  sanitizeParallax,
  sanitizePressed,
  sanitizeTransform,
  useReducedMotion,
} from './effects.js'
import { observeVisibility } from './RevealObserver.js'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Editor-only: which block should replay its entrance now ({ id, nonce }). Public renders never provide it. */
export const EffectPreviewContext = createContext(null)

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

/** CSS custom properties that tune a preset (distance, start scale, blur). Absent values keep the historic look of each preset. */
export function animationVars(anim) {
  const vars = {}
  if (typeof anim?.distance === 'number') vars['--atlas-anim-distance'] = `${anim.distance}px`
  if (typeof anim?.scaleFrom === 'number') vars['--atlas-anim-scale'] = String(anim.scaleFrom)
  if (typeof anim?.blur === 'number') vars['--atlas-anim-blur'] = `${anim.blur}px`
  return vars
}

const HORIZONTAL = /^(slide-(left|right)|slide-fade-(left|right)|rotate-in|flip-up)$/

/** Ken Burns custom properties: a slow zoom with an optional pan that stays inside the zoomed overflow. */
export function kenBurnsVars(kb) {
  const pan = ((kb.zoom - 1) / (2 * kb.zoom)) * 100
  const vector = { none: [0, 0], center: [0, 0], left: [pan, 0], right: [-pan, 0], up: [0, pan], down: [0, -pan] }[kb.pan] ?? [0, 0]
  const zoomIn = kb.direction === 'in'
  const [x, y] = vector
  return {
    '--kb-from': zoomIn ? 1 : kb.zoom, '--kb-to': zoomIn ? kb.zoom : 1,
    '--kb-fx': `${zoomIn ? x : -x}%`, '--kb-fy': `${zoomIn ? y : -y}%`, '--kb-tx': `${zoomIn ? -x : x}%`, '--kb-ty': `${zoomIn ? -y : y}%`,
    '--kb-duration': `${kb.duration}ms`, '--kb-easing': kb.easing,
  }
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
 * Renders a scoped <style> tag with the interaction states of the block wrapper identified by [data-eid="blockId"]:
 * hover only where a pointer can hover (never sticks after a tap), pressed (:active) everywhere, and no transitions when
 * the visitor prefers reduced motion.
 */
function InteractionStyleTag({ blockId, hover, pressed }) {
  const { scale, shadow, brightness, duration = 200, easing = 'ease' } = hover ?? {}
  const hasScale = scale && scale !== '' && scale !== '1'
  const hasShadow = shadow && shadow !== ''
  const hasBrightness = brightness !== undefined && brightness !== 100
  const hasHover = hasScale || hasShadow || hasBrightness
  if (!hasHover && !pressed) return null

  const sel = `[data-eid="${escapeAttr(blockId)}"]`
  const hoverParts = []
  if (hasScale) hoverParts.push(`transform: scale(${scale})`)
  if (hasShadow) hoverParts.push(`box-shadow: var(--atlas-shadow-${shadow}, none)`)
  if (hasBrightness) hoverParts.push(`filter: brightness(${brightness}%)`)
  const pressedParts = []
  if (pressed) {
    if (pressed.scale !== 1) pressedParts.push(`transform: scale(${pressed.scale})`)
    if (pressed.brightness !== 100) pressedParts.push(`filter: brightness(${pressed.brightness}%)`)
  }

  const transProps = ['transform', 'box-shadow', 'filter'].map((p) => `${p} ${hasHover ? duration : 120}ms ${easing}`).join(', ')
  let css = `${sel} { transition: ${transProps}; }\n`
  if (hoverParts.length) css += `@media (hover: hover) and (pointer: fine) {\n${sel}:hover { ${hoverParts.join('; ')}; }\n}\n`
  if (pressedParts.length) css += `${sel}:active { ${pressedParts.join('; ')}; }\n`
  css += `@media (prefers-reduced-motion: reduce) {\n${sel} { transition: none; }\n}\n`

  // Raw HTML: React would entity-escape the quotes in SSR output, which <style> never decodes.
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────────

/**
 * Entrance on scroll. The server (and the first client render) always show the content: nothing is hidden by markup, so
 * no-JS, slow-script and crawler renders are complete. After mount, only elements that start BELOW the fold are hidden
 * (class `atlas-reveal--pending`, opacity only, so layout never shifts) and revealed with the animation when they enter
 * the viewport. Elements already on screen keep their final state: no flash of hide-then-show.
 */
function ScrollRevealWrapper({ animation, mode, reduced, children, element }) {
  const ref = useRef(null)
  const [phase, setPhase] = useState('idle') // idle = visible | pending = hidden until seen | shown = animating
  const replay = animation?.once === false

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (mode === 'edit' || reduced || !el || typeof IntersectionObserver === 'undefined') { setPhase('idle'); return undefined }
    if (el.getBoundingClientRect().top <= window.innerHeight) return undefined
    setPhase('pending')
    const stop = observeVisibility(el, 0.08, (visible) => {
      if (visible) { setPhase('shown'); if (!replay) stop() } else if (replay) setPhase('pending')
    })
    return stop
  }, [mode, reduced, replay])

  const animStr = phase === 'shown' ? resolveAnimation(animation) : undefined
  const style = animStr ? { animation: animStr, ...animationVars(animation) } : undefined
  return (
    <div ref={ref} className={[element && 'atlas-element-effect-layer', phase === 'pending' && 'atlas-reveal--pending'].filter(Boolean).join(' ') || undefined} style={style}>
      {children}
    </div>
  )
}

// ── Ken Burns ─────────────────────────────────────────────────────────────────

/** Slow zoom/pan inside a clipped frame: the layout box never changes and nothing can cause horizontal scroll. */
function KenBurnsFrame({ kenburns, children, element }) {
  return (
    <div className={`atlas-kenburns${element ? ' atlas-element-effect-layer' : ''}`}>
      <div className={`atlas-kenburns__layer${element ? ' atlas-element-effect-layer' : ''}`} style={kenBurnsVars(kenburns)}>{children}</div>
    </div>
  )
}

// ── Parallax wrapper ──────────────────────────────────────────────────────────

/**
 * Translates its content vertically while in view. Scroll/resize listeners
 * (passive, rAF-throttled) exist only while the IntersectionObserver reports
 * the element on screen, and are removed on unmount.
 */
const PARALLAX_MAX = 160
function ParallaxWrapper({ speed, children, element }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    let raf = 0
    let listening = false
    const update = () => {
      raf = 0
      const offset = parallaxOffset(el.getBoundingClientRect(), window.innerHeight, speed)
      el.style.transform = `translate3d(0, ${Math.max(-PARALLAX_MAX, Math.min(PARALLAX_MAX, offset))}px, 0)`
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
    <div ref={ref} className={element ? 'atlas-element-effect-layer' : undefined} style={{ willChange: 'transform' }}>
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
export function EffectsWrapper({ blockId, props, mode, children, element = false }) {
  const stagger = useContext(StaggerContext)
  const out = (
    <EffectsInner blockId={blockId} props={props} mode={mode} stagger={stagger} element={element}>
      {children}
    </EffectsInner>
  )
  // Stagger applies to direct slot children only; reset it for deeper levels.
  return stagger ? <StaggerContext.Provider value={null}>{out}</StaggerContext.Provider> : out
}

function EffectsInner({ blockId, props, mode, stagger, children, element }) {
  const { _opacity, _cursor, _zIndex, _sticky } = props
  const reduced = useReducedMotion()
  const preview = useContext(EffectPreviewContext)
  const previewing = mode === 'edit' && preview?.id === blockId

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
  const pressed = sanitizePressed(props._pressed)
  const kenburns = reduced || mode === 'edit' ? undefined : sanitizeKenBurns(props._kenburns)
  const parallax = reduced || mode === 'edit' ? undefined : sanitizeParallax(props._parallax)

  const filterVal = resolveFilter(sanitizeFilter(props._filter))
  const transformVal = resolveTransform(sanitizeTransform(props._transform))
  // Animation fires immediately unless scroll-reveal takes over
  const animVal = (scrollReveal && !previewing) || reduced ? undefined : resolveAnimation(anim)

  // Build the wrapper inline style
  const style = {}
  const opacity = clampNum(_opacity, 0, 1, 1)
  if (opacity !== 1) style.opacity = opacity
  if (filterVal) style.filter = filterVal
  if (animVal) { style.animation = animVal; Object.assign(style, animationVars(anim)) }
  if (transformVal) style.transform = transformVal
  if (EFFECT_SHAPES.cursor.includes(_cursor) && _cursor !== 'auto') style.cursor = _cursor
  // Horizontal slides, parallax and Ken Burns move content beyond its box: clip horizontally so the page never scrolls sideways.
  const movesSideways = (anim && HORIZONTAL.test(anim.preset)) || (anim && anim.distance > 0) || !!parallax || !!kenburns
  if (movesSideways) style.overflowX = 'clip'
  if (_sticky) {
    style.position = 'sticky'
    style.top = 0
  }
  const z = clampNum(_zIndex, -1000, 1000, 0)
  if (z) style.zIndex = Math.round(z)

  const hasHover = !!hover && !!(hover.scale || hover.shadow || hover.brightness !== 100)
  const hasInteraction = hasHover || !!pressed
  const hasScrollReveal = scrollReveal && !!anim
  const hasEffects = Object.keys(style).length > 0 || hasInteraction || hasScrollReveal || !!parallax || !!kenburns

  if (!hasEffects) return children

  let content = children
  if (kenburns) content = <KenBurnsFrame kenburns={kenburns} element={element}>{content}</KenBurnsFrame>
  if (parallax) content = <ParallaxWrapper speed={parallax.speed} element={element}>{content}</ParallaxWrapper>
  if (hasScrollReveal) {
    content = (
      <ScrollRevealWrapper animation={anim} mode={mode} reduced={reduced} element={element}>
        {content}
      </ScrollRevealWrapper>
    )
  }

  return (
    <>
      {hasInteraction && <InteractionStyleTag blockId={blockId} hover={hover} pressed={pressed} />}
      <div
        key={previewing ? preview.nonce : undefined}
        data-eid={hasInteraction ? blockId : undefined}
        className={`atlas-wb-effects-wrap${element ? ' atlas-element-effect-layer' : ''}`}
        style={style}
      >
        {content}
      </div>
    </>
  )
}
