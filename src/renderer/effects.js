/**
 * @file Effect whitelist + sanitizers + reduced-motion hook.
 *
 * Every `_*` effect prop is clamped/whitelisted here before it reaches an
 * inline style or the scoped hover <style> tag. A consuming server can mirror
 * the same shapes through EFFECT_PRESETS / EFFECT_SHAPES.
 */
import { createContext, useEffect, useState } from 'react'

import { ANIMATION_EASINGS, EFFECT_PRESETS, HOVER_EASINGS, CURSORS, KENBURNS_PANS } from './universalProps.js'

export { EFFECT_PRESETS }

export const EFFECT_SHAPES = Object.freeze({
  animation: {
    preset: EFFECT_PRESETS,
    duration: [0, 5000],
    delay: [0, 5000],
    easing: ANIMATION_EASINGS,
    distance: [0, 400],
    scaleFrom: [0.5, 1.5],
    blur: [0, 40],
  },
  kenburns: { zoom: [1, 1.5], direction: ['in', 'out'], pan: KENBURNS_PANS, duration: [3000, 30000], easing: ANIMATION_EASINGS },
  pressed: { scale: [0.9, 1], brightness: [50, 150] },
  hover: {
    scale: 'string "0.xx" or "1.xx" (or empty)',
    shadow: ['', 'sm', 'md', 'lg'],
    brightness: [50, 150],
    duration: [0, 2000],
    easing: HOVER_EASINGS,
  },
  opacity: [0, 1],
  zIndex: [-1000, 1000],
  stagger: [0, 1000],
  parallax: { speed: [-0.5, 0.5] },
  cursor: CURSORS,
})

/** Finite number clamped to [min, max]; `fallback` when not numeric. */
export function clampNum(v, min, max, fallback) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

const pick = (v, list, fallback) => (list.includes(v) ? v : fallback)

/** @returns {{preset,duration,delay,easing}|undefined} */
export function sanitizeAnimation(a) {
  if (!a || typeof a !== 'object' || !EFFECT_PRESETS.includes(a.preset) || a.preset === 'none') {
    return undefined
  }
  const s = EFFECT_SHAPES.animation
  const out = {
    preset: a.preset,
    duration: clampNum(a.duration, 0, 5000, 600),
    delay: clampNum(a.delay, 0, 5000, 0),
    easing: pick(a.easing, s.easing, 'ease-out'),
  }
  // Optional intensity knobs: absent keeps the historic look of each preset.
  if (a.distance !== undefined) out.distance = clampNum(a.distance, 0, 400, undefined)
  if (a.scaleFrom !== undefined) out.scaleFrom = clampNum(a.scaleFrom, 0.5, 1.5, undefined)
  if (a.blur !== undefined) out.blur = clampNum(a.blur, 0, 40, undefined)
  if (a.once === false) out.once = false
  return out
}

/** @returns {{zoom:number,direction:'in'|'out',pan:string,duration:number,easing:string}|undefined} */
export function sanitizeKenBurns(k) {
  if (!k || typeof k !== 'object') return undefined
  const s = EFFECT_SHAPES.kenburns
  const zoom = clampNum(k.zoom, 1, 1.5, 1.15)
  if (zoom <= 1) return undefined
  return { zoom, direction: pick(k.direction, s.direction, 'in'), pan: pick(k.pan, s.pan, 'none'), duration: clampNum(k.duration, 3000, 30000, 12000), easing: pick(k.easing, s.easing, 'ease-in-out') }
}

/** @returns {{scale:number,brightness:number}|undefined} */
export function sanitizePressed(p) {
  if (!p || typeof p !== 'object') return undefined
  const scale = clampNum(p.scale, 0.9, 1, 1), brightness = clampNum(p.brightness, 50, 150, 100)
  return scale === 1 && brightness === 100 ? undefined : { scale, brightness }
}

/** @returns {object|undefined} */
export function sanitizeHover(h) {
  if (!h || typeof h !== 'object') return undefined
  const s = EFFECT_SHAPES.hover
  const scale = typeof h.scale === 'string' && /^[01]\.\d{1,2}$/.test(h.scale) ? h.scale : ''
  return {
    scale,
    shadow: pick(h.shadow, s.shadow, ''),
    brightness: clampNum(h.brightness, 50, 150, 100),
    duration: clampNum(h.duration, 0, 2000, 200),
    easing: pick(h.easing, s.easing, 'ease'),
  }
}

/** Clamp rotate/skew/filter numbers so they are safe to template into CSS. */
export function sanitizeTransform(t) {
  if (!t || typeof t !== 'object') return undefined
  return {
    rotate: clampNum(t.rotate, -360, 360, 0),
    skewX: clampNum(t.skewX, -89, 89, 0),
    skewY: clampNum(t.skewY, -89, 89, 0),
  }
}

export function sanitizeFilter(f) {
  if (!f || typeof f !== 'object') return undefined
  return {
    blur: clampNum(f.blur, 0, 50, 0),
    brightness: clampNum(f.brightness, 0, 300, 100),
    contrast: clampNum(f.contrast, 0, 300, 100),
    grayscale: clampNum(f.grayscale, 0, 100, 0),
    sepia: clampNum(f.sepia, 0, 100, 0),
  }
}

export const sanitizeStagger = (v) => clampNum(v, 0, 1000, 0)

/** @returns {{speed:number}|undefined} */
export function sanitizeParallax(p) {
  const speed = clampNum(p && p.speed, -0.5, 0.5, 0)
  return speed ? { speed } : undefined
}

/** Vertical offset (px) for an element given its rect, the viewport height and the speed. */
export function parallaxOffset(rect, viewportHeight, speed) {
  return Math.round((rect.top + rect.height / 2 - viewportHeight / 2) * speed * 100) / 100
}

/** {delay, animation} provided by a parent with `_stagger` to each slot child. */
export const StaggerContext = createContext(null)

/** Tracks `prefers-reduced-motion: reduce`. False when matchMedia is unavailable. */
export function useReducedMotion() {
  // False on the server and on the first client render so hydration matches; the effect below adopts the real value.
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}
