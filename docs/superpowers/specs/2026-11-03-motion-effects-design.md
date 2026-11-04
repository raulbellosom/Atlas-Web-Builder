# Motion and effects (2026-11-03)

## Goal
Premium-feeling sites: richer entrance presets, stagger, parallax, count-up and typewriter blocks, all safe by construction and reduced-motion aware.

## Safety model
Every `_*` effect prop is passed through `src/renderer/effects.js` before reaching the DOM: numbers are clamped, enums whitelisted, anything else dropped. `EFFECT_PRESETS` / `EFFECT_SHAPES` (exported from the package) expose the same whitelist so a consuming server can mirror it. Values only land in inline styles or the scoped hover `<style>`.

## Props
- `_animation {preset, duration 0-5000, delay 0-5000, easing}`. New presets: `blur-in`, `rotate-in`, `flip-up`, `slide-fade-up|down|left|right`. Old names unchanged.
- `_stagger` (ms, 0-1000) on blocks with slots. `BlockRenderer.slot()` wraps each child in a `StaggerContext` ({delay: index*step, animation}). A child without its own `_animation` inherits the parent's preset (default `slide-fade-up`) and always scroll-reveals; a child with its own `_animation` just gets the delay added. Disabled in edit mode.
- `_parallax {speed -0.5..0.5}`: inner wrapper translateY = (element centre - viewport centre) * speed, updated in a rAF-throttled passive scroll listener, attached only while an IntersectionObserver reports the element in view; removed on unmount.
- Blocks: `CounterBlock` (value, from, prefix, suffix, label, duration, decimals, locale, grouping) and `TypewriterBlock` (prefix, phrases one per line, suffix, typeSpeed, deleteSpeed, pause, loop). Both render their final/first-phrase text on the server and in edit mode.

## Reduced motion
`useReducedMotion()` (matchMedia) disables animation, scroll-reveal hiding, parallax; counter shows the final value, typewriter stays static. A CSS media rule also kills `atlas-anim-*` before hydration.

## Editor
Properties panel "Efectos" section gets: stagger slider (only for blocks with slots), parallax slider, and the new presets in AnimationField. Spanish labels.

## Tests
Unit tests in `src/__tests__/effects.test.jsx` for sanitizers, stagger, parallax maths and cleanup, counter, typewriter, reduced motion.
