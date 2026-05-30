import { defineBlock } from '../registry/createBlockRegistry.js'
import {
  colorVar,
  fontSizeVar,
  COLOR_TOKENS,
  FONT_SIZE_TOKENS,
  ALIGN_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  MAX_WIDTH_OPTIONS,
  SPACING_STOPS,
} from './_tokens.js'

export const TextBlock = defineBlock({
  type: 'TextBlock',
  icon: 'text',
  label: 'Texto',
  category: 'content',
  defaultProps: {
    text: 'Escribe tu contenido aquí…',
    size: 'md',
    color: 'fg',
    align: 'left',
    weight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
    maxWidth: '',
    paddingY: '0',
    paddingX: '0',
    italic: false,
  },
  fields: {
    text:          { type: 'textarea',  label: 'Texto' },
    size:          { type: 'select',    label: 'Tamaño',          options: FONT_SIZE_TOKENS },
    color:         { type: 'select',    label: 'Color',           options: COLOR_TOKENS },
    align:         { type: 'select',    label: 'Alineación',      options: ALIGN_OPTIONS },
    weight:        { type: 'select',    label: 'Peso',            options: FONT_WEIGHT_OPTIONS },
    lineHeight:    { type: 'select',    label: 'Altura de línea', options: LINE_HEIGHT_OPTIONS },
    letterSpacing: { type: 'select',    label: 'Espaciado letra', options: [
      { value: '0',      label: 'Normal' },
      { value: '0.03em', label: 'Amplio' },
      { value: '0.08em', label: 'Muy amplio' },
    ]},
    maxWidth:      { type: 'select',    label: 'Ancho máximo',    options: MAX_WIDTH_OPTIONS },
    paddingY:      { type: 'select',    label: 'Padding vertical',    options: SPACING_STOPS },
    paddingX:      { type: 'select',    label: 'Padding horizontal',  options: SPACING_STOPS },
    italic:        { type: 'toggle',    label: 'Cursiva' },
  },
  groups: [
    { label: 'Contenido',   fields: ['text'] },
    { label: 'Tipografía',  fields: ['size', 'color', 'weight', 'lineHeight', 'letterSpacing', 'italic'] },
    { label: 'Disposición', fields: ['align', 'maxWidth', 'paddingY', 'paddingX'] },
  ],
  render: ({ text, size, color, align, weight, lineHeight, letterSpacing, maxWidth, paddingY, paddingX, italic, ctx }) => {
    const style = {
      margin: 0,
      color: colorVar(color, 'inherit'),
      fontSize: fontSizeVar(size),
      textAlign: align,
      fontFamily: 'var(--atlas-font-sans)',
      fontWeight: weight || '400',
      lineHeight: lineHeight || 1.5,
      letterSpacing: letterSpacing || undefined,
      fontStyle: italic ? 'italic' : undefined,
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      ...(maxWidth ? { maxWidth, marginInline: align === 'center' ? 'auto' : align === 'right' ? '0 auto' : undefined } : null),
      ...(paddingY && paddingY !== '0' ? { paddingTop: `var(--atlas-spacing-${paddingY})`, paddingBottom: `var(--atlas-spacing-${paddingY})` } : null),
      ...(paddingX && paddingX !== '0' ? { paddingLeft: `var(--atlas-spacing-${paddingX})`, paddingRight: `var(--atlas-spacing-${paddingX})` } : null),
    }
    return ctx.inlineText({ propName: 'text', value: text, as: 'p', multiline: true, placeholder: 'Escribe tu contenido aquí…', style })
  },
})
