import { defineBlock } from '../registry/createBlockRegistry.js'
import { spacingVar, SPACING_STOPS } from './_tokens.js'

/**
 * Grid — CSS grid with a configurable column count and minimum item width.
 * Items flow auto-fit so the layout collapses gracefully on small viewports.
 */
export const GridBlock = defineBlock({
  type: 'GridBlock',
  icon: 'grid',
  label: 'Cuadrícula',
  category: 'layout',
  defaultProps: { minItemWidth: 240, gap: '4' },
  fields: {
    minItemWidth: { type: 'number', label: 'Ancho mínimo (px)', min: 120, max: 600, step: 10 },
    gap: { type: 'select', label: 'Separación', options: SPACING_STOPS },
  },
  slots: { children: {} },
  render: ({ minItemWidth, gap, ctx }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${Number(minItemWidth) || 240}px, 1fr))`,
        gap: spacingVar(gap),
        width: '100%',
      }}
    >
      {ctx.slot('children')}
    </div>
  ),
})
