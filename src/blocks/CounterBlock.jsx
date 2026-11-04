import { useEffect, useRef, useState } from 'react'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { useReducedMotion, clampNum } from '../renderer/effects.js'
import { colorVar, fontSizeVar, COLOR_TOKENS, FONT_SIZE_TOKENS, ALIGN_OPTIONS } from './_tokens.js'

/** Format a number with Intl; falls back to the default locale on a bad tag. */
export function formatCounter(n, { decimals = 0, locale = '', grouping = true } = {}) {
  const opts = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: !!grouping,
  }
  try {
    return new Intl.NumberFormat(locale || undefined, opts).format(n)
  } catch {
    return new Intl.NumberFormat(undefined, opts).format(n)
  }
}

/** Value at progress t (0-1) with ease-out-cubic. */
export function counterAt(from, to, t) {
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)
  return from + (to - from) * e
}

function Counter({
  value,
  from,
  prefix,
  suffix,
  label,
  duration,
  decimals,
  locale,
  grouping,
  color,
  size,
  align,
  mode,
}) {
  const reduced = useReducedMotion()
  const to = clampNum(value, -1e12, 1e12, 0)
  const start = clampNum(from, -1e12, 1e12, 0)
  const dec = Math.round(clampNum(decimals, 0, 6, 0))
  const fmt = { decimals: dec, locale, grouping }
  const ref = useRef(null)
  // SSR / no-JS / reduced motion / edit all show the final value.
  const [shown, setShown] = useState(to)

  useEffect(() => {
    if (reduced || mode === 'edit' || typeof IntersectionObserver === 'undefined') {
      setShown(to)
      return
    }
    const ms = clampNum(duration, 0, 10000, 1500)
    let raf = 0
    setShown(start)
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      const t0 = performance.now()
      const tick = (now) => {
        const t = ms ? (now - t0) / ms : 1
        setShown(counterAt(start, to, t))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    obs.observe(ref.current)
    return () => {
      obs.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [to, start, duration, reduced, mode])

  return (
    <div
      ref={ref}
      style={{
        textAlign: align,
        color: colorVar(color, 'inherit'),
        fontFamily: 'var(--atlas-font-sans)',
      }}
    >
      <div style={{ fontSize: fontSizeVar(size || '3xl'), fontWeight: 700, lineHeight: 1.1 }}>
        {prefix}
        {formatCounter(shown, fmt)}
        {suffix}
      </div>
      {label ? (
        <div style={{ fontSize: fontSizeVar('sm'), opacity: 0.75, marginTop: 4 }}>{label}</div>
      ) : null}
    </div>
  )
}

/** Counter — animated count-up number that starts when it scrolls into view. */
export const CounterBlock = defineBlock({
  type: 'CounterBlock',
  label: 'Contador',
  category: 'content',
  icon: 'hash',
  defaultProps: {
    value: 1200,
    from: 0,
    prefix: '',
    suffix: '+',
    label: 'Clientes satisfechos',
    duration: 1500,
    decimals: 0,
    locale: '',
    grouping: true,
    color: 'fg',
    size: '3xl',
    align: 'center',
  },
  fields: {
    value: { type: 'number', label: 'Valor final', step: 1 },
    from: { type: 'number', label: 'Valor inicial', step: 1 },
    prefix: { type: 'text', label: 'Prefijo' },
    suffix: { type: 'text', label: 'Sufijo' },
    label: { type: 'text', label: 'Etiqueta' },
    duration: { type: 'number', label: 'Duración (ms)', min: 0, max: 10000, step: 100 },
    decimals: { type: 'number', label: 'Decimales', min: 0, max: 6, step: 1 },
    locale: { type: 'text', label: 'Idioma de formato (ej. es-MX)' },
    grouping: { type: 'toggle', label: 'Separador de miles' },
    color: { type: 'select', label: 'Color', options: COLOR_TOKENS },
    size: { type: 'select', label: 'Tamaño', options: FONT_SIZE_TOKENS },
    align: { type: 'select', label: 'Alineación', options: ALIGN_OPTIONS },
  },
  groups: [
    { label: 'Contenido', fields: ['value', 'from', 'prefix', 'suffix', 'label'] },
    { label: 'Animación', fields: ['duration', 'decimals', 'locale', 'grouping'] },
    { label: 'Estilo', fields: ['color', 'size', 'align'] },
  ],
  render: ({ ctx, ...props }) => <Counter {...props} mode={ctx.mode} />,
})
