import { defineBlock } from '../registry/createBlockRegistry.js'
import { spacingVar, SPACING_STOPS, VALIGN_OPTIONS, COLUMN_LAYOUT_OPTIONS } from './_tokens.js'

const COUNT_OPTIONS = [
  { value: '2', label: '2 columnas' },
  { value: '3', label: '3 columnas' },
  { value: '4', label: '4 columnas' },
]

const LAYOUT_TEMPLATES = {
  equal: (n) => `repeat(${n}, minmax(0, 1fr))`,
  '2-1':  () => '2fr 1fr',
  '1-2':  () => '1fr 2fr',
  '3-1':  () => '3fr 1fr',
  '1-3':  () => '1fr 3fr',
}

export const ColumnsBlock = defineBlock({
  type: 'ColumnsBlock',
  label: 'Columnas',
  category: 'layout',
  icon: 'columns',
  defaultProps: {
    count: '2',
    gap: '4',
    valign: 'start',
    layout: 'equal',
    stackOnMobile: true,
    paddingY: '0',
  },
  fields: {
    count:         { type: 'select', label: 'Número de columnas', options: COUNT_OPTIONS },
    layout:        { type: 'select', label: 'Distribución',       options: COLUMN_LAYOUT_OPTIONS },
    gap:           { type: 'select', label: 'Separación',         options: SPACING_STOPS },
    valign:        { type: 'select', label: 'Alineación vertical', options: VALIGN_OPTIONS },
    paddingY:      { type: 'select', label: 'Padding vertical',   options: SPACING_STOPS },
    stackOnMobile: { type: 'toggle', label: 'Apilar en mobile' },
  },
  groups: [
    { label: 'Columnas',   fields: ['count', 'layout'] },
    { label: 'Espaciado',  fields: ['gap', 'paddingY'] },
    { label: 'Opciones',   fields: ['valign', 'stackOnMobile'] },
  ],
  slots: { col0: {}, col1: {}, col2: {}, col3: {} },
  render: ({ count, gap, valign, layout, paddingY, ctx }) => {
    const n = Math.max(1, Math.min(4, Number(count) || 2))
    const slots = Array.from({ length: n }, (_, i) => `col${i}`)

    const templateFn = LAYOUT_TEMPLATES[layout] || LAYOUT_TEMPLATES.equal
    const gridTemplate = n === 2 ? templateFn(n) : LAYOUT_TEMPLATES.equal(n)

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridTemplate,
          gap: spacingVar(gap),
          alignItems: valign || 'start',
          width: '100%',
          paddingTop:    paddingY && paddingY !== '0' ? spacingVar(paddingY) : undefined,
          paddingBottom: paddingY && paddingY !== '0' ? spacingVar(paddingY) : undefined,
        }}
      >
        {slots.map((slotName) => (
          <div key={slotName} style={{ minWidth: 0 }}>
            {ctx.slot(slotName)}
          </div>
        ))}
      </div>
    )
  },
})
