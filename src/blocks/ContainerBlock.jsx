import { defineBlock } from '../registry/createBlockRegistry.js'
import { spacingVar } from './_tokens.js'
import { resolveBackground } from './_background.js'

const MAX_WIDTH_OPTIONS = [
  { value: 'sm', label: 'Pequeño (640px)' },
  { value: 'md', label: 'Mediano (768px)' },
  { value: 'lg', label: 'Grande (1024px)' },
  { value: 'xl', label: 'Extra (1280px)' },
  { value: 'full', label: 'Completo' },
]

const MAX_WIDTHS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  full: '100%',
}

/**
 * Container — centers content with a configurable max-width and horizontal
 * gutter. Renders the `children` slot. Optional background (color, gradient
 * or image).
 */
export const ContainerBlock = defineBlock({
  type: 'ContainerBlock',
  label: 'Contenedor',
  category: 'layout',
  icon: 'container',
  defaultProps: { maxWidth: 'lg', paddingX: '6', background: null },
  fields: {
    maxWidth: { type: 'select', label: 'Ancho máximo', options: MAX_WIDTH_OPTIONS },
    paddingX: {
      type: 'select',
      label: 'Padding horizontal',
      options: ['0', '2', '4', '6', '8'],
    },
    background: { type: 'background', label: 'Fondo' },
  },
  slots: { children: {} },
  render: ({ maxWidth, paddingX, background, ctx }) => (
    <div
      style={{
        maxWidth: MAX_WIDTHS[maxWidth] || MAX_WIDTHS.lg,
        marginInline: 'auto',
        paddingInline: spacingVar(paddingX),
        width: '100%',
        ...(background ? resolveBackground(background, 'transparent') : null),
      }}
    >
      {ctx.slot('children')}
    </div>
  ),
})
