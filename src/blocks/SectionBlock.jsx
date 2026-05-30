import { defineBlock } from '../registry/createBlockRegistry.js'
import { spacingVar, SPACING_STOPS, RADIUS_TOKENS, MAX_WIDTH_OPTIONS } from './_tokens.js'
import { resolveBackground } from './_background.js'

const BORDER_OPTIONS = [
  { value: '',          label: 'Sin borde' },
  { value: 'top',       label: 'Superior' },
  { value: 'bottom',    label: 'Inferior' },
  { value: 'both',      label: 'Superior e inferior' },
  { value: 'all',       label: 'Todos los lados' },
]

export const SectionBlock = defineBlock({
  type: 'SectionBlock',
  label: 'Sección',
  category: 'layout',
  icon: 'section',
  defaultProps: {
    paddingY: '12',
    paddingX: '6',
    background: { kind: 'color', token: 'bg' },
    fullBleed: true,
    maxWidth: '',
    radius: 'none',
    border: '',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  fields: {
    paddingY:    { type: 'select', label: 'Padding vertical',   options: SPACING_STOPS },
    paddingX:    { type: 'select', label: 'Padding horizontal', options: SPACING_STOPS },
    background:  { type: 'background', label: 'Fondo' },
    fullBleed:   { type: 'toggle', label: 'Ancho completo' },
    maxWidth:    { type: 'select', label: 'Ancho máx. contenido', options: MAX_WIDTH_OPTIONS },
    radius:      { type: 'select', label: 'Bordes redondeados', options: RADIUS_TOKENS },
    border:      { type: 'select', label: 'Borde', options: BORDER_OPTIONS },
    borderColor: { type: 'text',   label: 'Color del borde (CSS)' },
  },
  groups: [
    { label: 'Disposición', fields: ['paddingY', 'paddingX', 'fullBleed', 'maxWidth'] },
    { label: 'Estilo',      fields: ['background', 'radius', 'border', 'borderColor'] },
  ],
  slots: { children: {} },
  render: ({ paddingY, paddingX, background, fullBleed, maxWidth, radius, border, borderColor, ctx }) => {
    const borderVal = borderColor || 'rgba(0,0,0,0.08)'
    const borderTop    = border === 'top'    || border === 'both' || border === 'all' ? `1px solid ${borderVal}` : undefined
    const borderBottom = border === 'bottom' || border === 'both' || border === 'all' ? `1px solid ${borderVal}` : undefined
    const borderSides  = border === 'all' ? `1px solid ${borderVal}` : undefined
    const rVar = radius && radius !== 'none' ? `var(--atlas-radius-${radius}, 0)` : undefined

    const inner = maxWidth
      ? <div style={{ maxWidth, marginInline: 'auto', width: '100%' }}>{ctx.slot('children')}</div>
      : ctx.slot('children')

    return (
      <section
        style={{
          padding: `${spacingVar(paddingY)} ${spacingVar(paddingX)}`,
          width: fullBleed ? '100%' : 'auto',
          borderRadius: rVar,
          borderTop,
          borderBottom,
          borderLeft:  borderSides,
          borderRight: borderSides,
          overflow: rVar ? 'hidden' : undefined,
          ...resolveBackground(background, 'transparent'),
        }}
      >
        {inner}
      </section>
    )
  },
})
