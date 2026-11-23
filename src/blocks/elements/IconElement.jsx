import { defineBlock } from '../../registry/createBlockRegistry.js'
import { COLOR_TOKENS, colorVar } from '../_tokens.js'
import { ICON_OPTIONS, iconFor } from '../../icons/registry.js'
import { designFields, designGroups, elementSurfaceStyle, elementClass } from './design.js'
import { responsiveFields } from './responsive.js'

const TONES = [{ value: 'inherit', label: 'Heredar del texto' }, ...COLOR_TOKENS.map((value) => ({ value, label: value }))]
const clamp = (value, min, max, fallback) => (typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback)

// Native icon: inline SVG that follows the text color or a theme token. With `label` it is an image for assistive
// technology; without it, decorative (hidden), which is the right default next to a visible caption.
export const IconElementBlock = defineBlock({
  type: 'IconElementBlock', label: 'Icono', category: 'elements', kind: 'element', icon: 'star',
  defaultProps: { icon: 'star', label: '', size: 32, strokeWidth: 2, tone: 'inherit', stylePreset: 'none', widthMode: 'auto' },
  fields: responsiveFields({
    icon: { type: 'select', label: 'Icono', options: ICON_OPTIONS },
    label: { type: 'text', label: 'Descripción accesible (vacía = decorativo)' },
    size: { type: 'number', label: 'Tamaño (px)', min: 8, max: 256 },
    strokeWidth: { type: 'number', label: 'Grosor del trazo', min: 0.5, max: 4, step: 0.5 },
    tone: { type: 'select', label: 'Color', options: TONES },
    ...designFields,
  }, []),
  groups: [{ label: 'Icono', fields: ['icon', 'label', 'size', 'strokeWidth', 'tone'] }, ...designGroups],
  render: ({ ctx, ...props }) => {
    const Icon = iconFor(props.icon)
    const size = clamp(props.size, 8, 256, 32)
    const tone = COLOR_TOKENS.includes(props.tone) ? colorVar(props.tone) : undefined
    const label = typeof props.label === 'string' ? props.label.trim() : ''
    const style = { display: 'inline-flex', lineHeight: 0, ...elementSurfaceStyle(props, ctx), ...(tone ? { color: tone } : null) }
    return (
      <span data-atlas-block={ctx?.blockId} className={elementClass(ctx, 'atlas-element-icon')} style={style}
        role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
        {Icon
          ? <Icon width={size} height={size} strokeWidth={clamp(props.strokeWidth, 0.5, 4, 2)} aria-hidden="true" focusable="false" />
          : <span style={{ width: size, height: size, display: 'inline-block' }} />}
      </span>
    )
  },
})
