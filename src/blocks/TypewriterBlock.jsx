import { useEffect, useState } from 'react'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { useReducedMotion, clampNum } from '../renderer/effects.js'
import { colorVar, fontSizeVar, COLOR_TOKENS, FONT_SIZE_TOKENS, ALIGN_OPTIONS } from './_tokens.js'

/** One phrase per line, blanks dropped, capped so a bad prop cannot explode the loop. */
export function parsePhrases(text) {
  return String(text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20)
}

/**
 * Pure state machine. state = { i: phrase index, n: visible chars, del: deleting }.
 * Returns the next state and the delay (ms) before the following step
 * (null = stop).
 */
export function typewriterStep(state, phrases, { typeSpeed, deleteSpeed, pause, loop }) {
  const len = phrases[state.i].length
  if (!state.del) {
    if (state.n < len) return { state: { ...state, n: state.n + 1 }, delay: typeSpeed }
    // Fully typed: hold, then delete (loop=false stays on the last phrase).
    if (!loop && state.i === phrases.length - 1) return { state, delay: null }
    return { state: { ...state, del: true }, delay: pause }
  }
  if (state.n > 0) return { state: { ...state, n: state.n - 1 }, delay: deleteSpeed }
  return { state: { i: (state.i + 1) % phrases.length, n: 0, del: false }, delay: typeSpeed }
}

function Typewriter({
  prefix,
  phrases: raw,
  suffix,
  typeSpeed,
  deleteSpeed,
  pause,
  loop,
  color,
  size,
  align,
  mode,
}) {
  const reduced = useReducedMotion()
  const phrases = parsePhrases(raw)
  const key = phrases.join('\n')
  const [st, setSt] = useState({ i: 0, n: phrases[0]?.length ?? 0, del: false })
  const animate = !reduced && mode !== 'edit' && phrases.length > 1

  useEffect(() => {
    if (!animate) return
    const opts = {
      typeSpeed: clampNum(typeSpeed, 20, 1000, 80),
      deleteSpeed: clampNum(deleteSpeed, 10, 1000, 40),
      pause: clampNum(pause, 200, 10000, 1600),
      loop: loop !== false,
    }
    let cur = { i: 0, n: phrases[0].length, del: true }
    let timer
    const run = () => {
      const { state, delay } = typewriterStep(cur, phrases, opts)
      cur = state
      setSt(state)
      if (delay !== null) timer = setTimeout(run, delay)
    }
    // Hold the server-rendered first phrase, then delete it and carry on.
    timer = setTimeout(run, opts.pause)
    return () => clearTimeout(timer)
    // phrases is derived from `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, key, typeSpeed, deleteSpeed, pause, loop])

  const text = animate ? (phrases[st.i] || '').slice(0, st.n) : phrases[0] || ''
  return (
    <div
      style={{
        textAlign: align,
        color: colorVar(color, 'inherit'),
        fontSize: fontSizeVar(size || '2xl'),
        fontFamily: 'var(--atlas-font-sans)',
        fontWeight: 600,
        lineHeight: 1.25,
      }}
    >
      {prefix ? `${prefix} ` : null}
      <span>{text}</span>
      {animate ? <span className="atlas-wb-typewriter__caret" aria-hidden="true" /> : null}
      {suffix ? ` ${suffix}` : null}
    </div>
  )
}

/** Typewriter — rotating phrases typed and deleted between a static prefix and suffix. */
export const TypewriterBlock = defineBlock({
  type: 'TypewriterBlock',
  label: 'Texto animado',
  category: 'content',
  icon: 'type',
  defaultProps: {
    prefix: 'Creamos',
    phrases: 'sitios web\ntiendas en línea\nexperiencias únicas',
    suffix: '',
    typeSpeed: 80,
    deleteSpeed: 40,
    pause: 1600,
    loop: true,
    color: 'fg',
    size: '2xl',
    align: 'center',
  },
  fields: {
    prefix: { type: 'text', label: 'Texto antes' },
    phrases: { type: 'textarea', label: 'Frases (una por línea)' },
    suffix: { type: 'text', label: 'Texto después' },
    typeSpeed: {
      type: 'number',
      label: 'Velocidad al escribir (ms)',
      min: 20,
      max: 1000,
      step: 10,
    },
    deleteSpeed: {
      type: 'number',
      label: 'Velocidad al borrar (ms)',
      min: 10,
      max: 1000,
      step: 10,
    },
    pause: { type: 'number', label: 'Pausa entre frases (ms)', min: 200, max: 10000, step: 100 },
    loop: { type: 'toggle', label: 'Repetir en bucle' },
    color: { type: 'select', label: 'Color', options: COLOR_TOKENS },
    size: { type: 'select', label: 'Tamaño', options: FONT_SIZE_TOKENS },
    align: { type: 'select', label: 'Alineación', options: ALIGN_OPTIONS },
  },
  groups: [
    { label: 'Contenido', fields: ['prefix', 'phrases', 'suffix'] },
    { label: 'Animación', fields: ['typeSpeed', 'deleteSpeed', 'pause', 'loop'] },
    { label: 'Estilo', fields: ['color', 'size', 'align'] },
  ],
  render: ({ ctx, ...props }) => <Typewriter {...props} mode={ctx.mode} />,
})
