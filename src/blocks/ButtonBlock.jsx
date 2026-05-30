import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar, radiusVar, RADIUS_TOKENS } from './_tokens.js'

const VARIANTS = [
  { value: 'solid', label: 'Sólido' },
  { value: 'outline', label: 'Contorno' },
  { value: 'ghost', label: 'Fantasma' },
]

const SIZES = [
  { value: 'sm', label: 'Pequeño' },
  { value: 'md', label: 'Mediano' },
  { value: 'lg', label: 'Grande' },
]

const SIZE_PADDING = {
  sm: '6px 12px',
  md: '10px 18px',
  lg: '14px 24px',
}

const SIZE_FONT = {
  sm: 'var(--atlas-fontSize-sm)',
  md: 'var(--atlas-fontSize-md)',
  lg: 'var(--atlas-fontSize-lg)',
}

function isSafeHref(href) {
  if (typeof href !== 'string') return false
  if (href === '') return true
  return /^(https?:|mailto:|tel:|\/|#)/i.test(href)
}

/**
 * Button — anchor styled as a button. Uses semantic color tokens so it
 * follows the active theme.
 */
const ALIGN_OPTIONS = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
  { value: 'full', label: 'Ancho completo' },
]

export const ButtonBlock = defineBlock({
  type: 'ButtonBlock',
  label: 'Botón',
  category: 'content',
  icon: 'button',
  defaultProps: {
    label: 'Acción',
    href: '#',
    variant: 'solid',
    size: 'md',
    color: 'primary',
    radius: 'md',
    align: 'left',
    newTab: false,
  },
  fields: {
    label: { type: 'text', label: 'Etiqueta' },
    href: { type: 'link', label: 'Enlace' },
    variant: { type: 'select', label: 'Variante', options: VARIANTS },
    size: { type: 'select', label: 'Tamaño', options: SIZES },
    color: { type: 'select', label: 'Color', options: ['primary', 'accent', 'fg', 'danger'] },
    radius: { type: 'select', label: 'Bordes', options: RADIUS_TOKENS },
    align: { type: 'select', label: 'Alineación', options: ALIGN_OPTIONS },
    newTab: { type: 'toggle', label: 'Abrir en nueva pestaña' },
  },
  groups: [
    { label: 'Contenido', fields: ['label', 'href', 'newTab'] },
    { label: 'Estilo', fields: ['variant', 'size', 'color', 'radius', 'align'] },
  ],
  render: ({ label, href, variant, size, color, radius, align, newTab, ctx }) => {
    const bg = variant === 'solid' ? colorVar(color, '#0F62FE') : 'transparent'
    const fg = variant === 'solid' ? colorVar(`${color}Fg`, '#FFFFFF') : colorVar(color, '#0F62FE')
    const border = variant === 'outline' ? `1px solid ${colorVar(color, '#0F62FE')}` : 'none'
    const safe = isSafeHref(href)
    const isFullWidth = align === 'full'
    const textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'
    const btn = (
      <a
        href={safe ? href || '#' : '#'}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        style={{
          display: isFullWidth ? 'block' : 'inline-block',
          textAlign: isFullWidth ? 'center' : undefined,
          background: bg,
          color: fg,
          border,
          padding: SIZE_PADDING[size] || SIZE_PADDING.md,
          fontSize: SIZE_FONT[size] || SIZE_FONT.md,
          borderRadius: radiusVar(radius, '8px'),
          fontFamily: 'var(--atlas-font-sans)',
          textDecoration: 'none',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {ctx.inlineText({
          propName: 'label',
          value: label,
          as: 'span',
          placeholder: 'Acción',
          style: { color: 'inherit' },
        })}
      </a>
    )
    if (isFullWidth) return btn
    return <div style={{ textAlign }}>{btn}</div>
  },
})
