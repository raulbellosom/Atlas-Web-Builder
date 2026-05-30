import { defineBlock } from '../registry/createBlockRegistry.js'
import { spacingVar, SPACING_STOPS } from './_tokens.js'

/**
 * Spacer — vertical gap measured in spacing-scale stops.
 */
export const SpacerBlock = defineBlock({
  type: 'SpacerBlock',
  icon: 'spacer',
  label: 'Espaciador',
  category: 'layout',
  defaultProps: { size: '6' },
  fields: {
    size: { type: 'select', label: 'Altura', options: SPACING_STOPS },
  },
  render: ({ size }) => (
    <div aria-hidden="true" style={{ height: spacingVar(size), width: '100%' }} />
  ),
})
