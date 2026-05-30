import { defineBlock } from '../registry/createBlockRegistry.js'
import { spacingVar, colorVar, COLOR_TOKENS, SPACING_STOPS } from './_tokens.js'

/**
 * Divider — horizontal rule with token-driven color and vertical margin.
 */
export const DividerBlock = defineBlock({
  type: 'DividerBlock',
  icon: 'divider',
  label: 'Separador',
  category: 'layout',
  defaultProps: { color: 'muted', thickness: 1, marginY: '4' },
  fields: {
    color: { type: 'select', label: 'Color', options: COLOR_TOKENS },
    thickness: { type: 'number', label: 'Grosor (px)', min: 1, max: 8, step: 1 },
    marginY: { type: 'select', label: 'Margen vertical', options: SPACING_STOPS },
  },
  render: ({ color, thickness, marginY }) => (
    <hr
      style={{
        border: 0,
        borderTopWidth: `${Number(thickness) || 1}px`,
        borderTopStyle: 'solid',
        borderTopColor: colorVar(color, 'currentColor'),
        marginBlock: spacingVar(marginY),
        opacity: 0.5,
      }}
    />
  ),
})
