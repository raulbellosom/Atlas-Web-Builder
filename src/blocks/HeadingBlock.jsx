import { defineBlock } from '../registry/createBlockRegistry.js'
import {
  colorVar,
  fontSizeVar,
  COLOR_TOKENS,
  FONT_SIZE_TOKENS,
  ALIGN_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  LETTER_SPACING_OPTIONS,
  MAX_WIDTH_OPTIONS,
  SPACING_STOPS,
} from './_tokens.js'

const LEVELS = [
  { value: 'h1', label: 'H1' },
  { value: 'h2', label: 'H2' },
  { value: 'h3', label: 'H3' },
  { value: 'h4', label: 'H4' },
  { value: 'h5', label: 'H5' },
  { value: 'h6', label: 'H6' },
]

const DEFAULT_SIZE_BY_LEVEL = {
  h1: '3xl', h2: '2xl', h3: 'xl', h4: 'lg', h5: 'md', h6: 'sm',
}

export const HeadingBlock = defineBlock({
  type: 'HeadingBlock',
  label: 'Encabezado',
  category: 'content',
  icon: 'heading',
  defaultProps: {
    text: 'Encabezado',
    level: 'h2',
    color: 'fg',
    size: '',
    align: 'left',
    weight: '700',
    lineHeight: '1.2',
    letterSpacing: '0',
    maxWidth: '',
    paddingY: '0',
    textTransform: 'none',
  },
  fields: {
    text:          { type: 'text',   label: 'Texto' },
    level:         { type: 'select', label: 'Nivel',             options: LEVELS },
    color:         { type: 'select', label: 'Color',             options: COLOR_TOKENS },
    size:          { type: 'select', label: 'Tamaño (opcional)', options: FONT_SIZE_TOKENS, allowEmpty: true },
    align:         { type: 'select', label: 'Alineación',        options: ALIGN_OPTIONS },
    weight:        { type: 'select', label: 'Peso',              options: FONT_WEIGHT_OPTIONS },
    lineHeight:    { type: 'select', label: 'Altura de línea',   options: LINE_HEIGHT_OPTIONS },
    letterSpacing: { type: 'select', label: 'Espaciado letra',   options: LETTER_SPACING_OPTIONS },
    textTransform: { type: 'select', label: 'Mayúsculas',        options: [
      { value: 'none',       label: 'Normal' },
      { value: 'uppercase',  label: 'MAYÚSCULAS' },
      { value: 'capitalize', label: 'Primera Letra' },
      { value: 'lowercase',  label: 'minúsculas' },
    ]},
    maxWidth:      { type: 'select', label: 'Ancho máximo',      options: MAX_WIDTH_OPTIONS },
    paddingY:      { type: 'select', label: 'Padding vertical',  options: SPACING_STOPS },
  },
  groups: [
    { label: 'Contenido',   fields: ['text', 'level'] },
    { label: 'Tipografía',  fields: ['size', 'color', 'weight', 'lineHeight', 'letterSpacing', 'textTransform'] },
    { label: 'Disposición', fields: ['align', 'maxWidth', 'paddingY'] },
  ],
  render: ({ text, level, color, size, align, weight, lineHeight, letterSpacing, textTransform, maxWidth, paddingY, ctx }) => {
    const Tag = LEVELS.find((l) => l.value === level) ? level : 'h2'
    const sizeKey = size || DEFAULT_SIZE_BY_LEVEL[Tag] || 'xl'
    const style = {
      margin: 0,
      color: colorVar(color, 'inherit'),
      fontSize: fontSizeVar(sizeKey),
      textAlign: align,
      fontFamily: 'var(--atlas-font-sans)',
      fontWeight: weight || '700',
      lineHeight: lineHeight || 1.2,
      letterSpacing: letterSpacing !== '0' ? letterSpacing : undefined,
      textTransform: textTransform !== 'none' ? textTransform : undefined,
      overflowWrap: 'break-word',
      ...(maxWidth ? { maxWidth, marginInline: align === 'center' ? 'auto' : undefined } : null),
      ...(paddingY && paddingY !== '0' ? { paddingTop: `var(--atlas-spacing-${paddingY})`, paddingBottom: `var(--atlas-spacing-${paddingY})` } : null),
    }
    return ctx.inlineText({ propName: 'text', value: text, as: Tag, placeholder: 'Encabezado', style })
  },
})
