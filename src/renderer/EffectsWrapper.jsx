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

import { useRef, useEffect, useState } from 'react'
import { resolveFilter } from '../editor/fields/FilterField.jsx'

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

  const sel = `[data-eid="${CSS.escape(blockId)}"]`
  const hoverParts = []
  if (hasScale) hoverParts.push(`transform: scale(${scale})`)
  if (hasShadow) hoverParts.push(`box-shadow: var(--atlas-shadow-${shadow}, none)`)
  if (hasBrightness) hoverParts.push(`filter: brightness(${brightness}%)`)

  const transProps = ['transform', 'box-shadow', 'filter']
    .map((p) => `${p} ${duration}ms ${easing}`)
    .join(', ')

  const css =
    `${sel} { transition: ${transProps}; }\n` + `${sel}:hover { ${hoverParts.join('; ')}; }\n`

  return <style>{css}</style>
}

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────────

/**
 * Wraps children and triggers the entrance animation when the element enters
 * the viewport. In edit mode the block is always visible immediately.
 */
function ScrollRevealWrapper({ animation, mode, children }) {
  const ref = useRef(null)
  // Edit mode → always visible; public/preview → hidden until intersecting
  const [visible, setVisible] = useState(mode === 'edit')

  useEffect(() => {
    if (mode === 'edit') {
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
  }, [mode])

  const animStr = resolveAnimation(animation)
  const style = visible && animStr ? { animation: animStr } : !visible ? { opacity: 0 } : {}

  return (
    <div ref={ref} style={style}>
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
  const {
    _opacity,
    _animation,
    _filter,
    _hover,
    _scrollReveal,
    _cursor,
    _zIndex,
    _sticky,
    _transform,
  } = props

  const filterVal = resolveFilter(_filter)
  const transformVal = resolveTransform(_transform)
  // Animation fires immediately unless scroll-reveal takes over
  const animVal = _scrollReveal ? undefined : resolveAnimation(_animation)

  // Build the wrapper inline style
  const style = {}
  if (_opacity !== undefined && _opacity !== null && _opacity !== 1) style.opacity = _opacity
  if (filterVal) style.filter = filterVal
  if (animVal) style.animation = animVal
  if (transformVal) style.transform = transformVal
  if (_cursor && _cursor !== 'auto') style.cursor = _cursor
  if (_sticky) {
    style.position = 'sticky'
    style.top = 0
  }
  if (_zIndex) style.zIndex = _zIndex

  const hasHover =
    _hover && (_hover.scale || _hover.shadow || (_hover.brightness && _hover.brightness !== 100))
  const hasScrollReveal = _scrollReveal && _animation && _animation.preset !== 'none'
  const hasEffects = Object.keys(style).length > 0 || hasHover || hasScrollReveal

  if (!hasEffects) return children

  let content = children
  if (hasScrollReveal) {
    content = (
      <ScrollRevealWrapper animation={_animation} mode={mode}>
        {content}
      </ScrollRevealWrapper>
    )
  }

  return (
    <>
      {hasHover && <HoverStyleTag blockId={blockId} hover={_hover} />}
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
