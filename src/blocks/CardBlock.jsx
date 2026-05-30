import { defineBlock } from '../registry/createBlockRegistry.js'
import {
  colorVar,
  radiusVar,
  shadowVar,
  spacingVar,
  fontSizeVar,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  SPACING_STOPS,
  ALIGN_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  FONT_SIZE_TOKENS,
} from './_tokens.js'

const VARIANTS = [
  { value: 'default',    label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'ghost',      label: 'Sin fondo' },
]

function isSafeUrl(u)  { return typeof u === 'string' && u !== '' && /^(https?:|\/|data:image\/)/i.test(u) }
function isSafeHref(u) { return typeof u === 'string' && /^(https?:|mailto:|tel:|\/|#)/i.test(u) }

export const CardBlock = defineBlock({
  type: 'CardBlock',
  label: 'Tarjeta',
  category: 'content',
  icon: 'card',
  defaultProps: {
    variant: 'default',
    imageSrc: '',
    imageAlt: '',
    imageRatio: '16 / 9',
    title: 'Título de la tarjeta',
    titleSize: 'lg',
    titleWeight: '700',
    description: 'Descripción de la tarjeta. Añade aquí el texto que quieras mostrar.',
    descSize: 'sm',
    ctaLabel: '',
    ctaHref: '#',
    ctaStyle: 'link',
    align: 'left',
    padding: '6',
    radius: 'lg',
    shadow: 'md',
    background: 'bg',
    borderColor: '',
  },
  fields: {
    variant:      { type: 'select', label: 'Variante', options: VARIANTS },
    imageSrc:     { type: 'image',  label: 'Imagen' },
    imageAlt:     { type: 'text',   label: 'Texto alternativo' },
    imageRatio:   { type: 'select', label: 'Proporción imagen', options: ASPECT_RATIO_OPTIONS },
    title:        { type: 'text',   label: 'Título' },
    titleSize:    { type: 'select', label: 'Tamaño título',  options: FONT_SIZE_TOKENS },
    titleWeight:  { type: 'select', label: 'Peso título',    options: FONT_WEIGHT_OPTIONS },
    description:  { type: 'textarea', label: 'Descripción' },
    descSize:     { type: 'select', label: 'Tamaño descripción', options: FONT_SIZE_TOKENS },
    ctaLabel:     { type: 'text',   label: 'Texto del botón' },
    ctaHref:      { type: 'link',   label: 'Enlace del botón' },
    ctaStyle:     { type: 'select', label: 'Estilo del botón', options: [
      { value: 'link',    label: 'Enlace subrayado' },
      { value: 'solid',   label: 'Botón sólido' },
      { value: 'outline', label: 'Botón contorno' },
    ]},
    align:        { type: 'select', label: 'Alineación',    options: ALIGN_OPTIONS },
    padding:      { type: 'select', label: 'Padding',       options: SPACING_STOPS },
    radius:       { type: 'select', label: 'Bordes',        options: RADIUS_TOKENS },
    shadow:       { type: 'select', label: 'Sombra',        options: SHADOW_TOKENS },
    background:   { type: 'select', label: 'Fondo',         options: ['bg', 'primary', 'muted', 'accent'] },
    borderColor:  { type: 'text',   label: 'Color borde (CSS, opcional)' },
  },
  groups: [
    { label: 'Contenido',  fields: ['title', 'titleSize', 'titleWeight', 'description', 'descSize', 'ctaLabel', 'ctaHref', 'ctaStyle'] },
    { label: 'Imagen',     fields: ['imageSrc', 'imageAlt', 'imageRatio'] },
    { label: 'Estilo',     fields: ['variant', 'align', 'padding', 'radius', 'shadow', 'background', 'borderColor'] },
  ],
  render: ({ variant, imageSrc, imageAlt, imageRatio, title, titleSize, titleWeight, description, descSize, ctaLabel, ctaHref, ctaStyle, align, padding, radius, shadow, background, borderColor, ctx }) => {
    const safeImg = isSafeUrl(imageSrc) ? imageSrc : ''
    const safeCta = isSafeHref(ctaHref) ? ctaHref : '#'
    const rVar    = radius && radius !== 'none' ? radiusVar(radius, '16px') : '0'
    const sVar    = shadow && shadow !== 'none' ? shadowVar(shadow, '0 4px 12px rgba(0,0,0,0.08)') : 'none'

    const imgTopRadius = variant === 'default' ? `${rVar} ${rVar} 0 0` : rVar

    const ImageSlot = safeImg ? (
      <img
        src={safeImg}
        alt={imageAlt || ''}
        loading="lazy"
        style={{
          width: '100%',
          aspectRatio: imageRatio && imageRatio !== 'auto' ? imageRatio : '16 / 9',
          objectFit: 'cover',
          display: 'block',
          borderRadius: imgTopRadius,
          flexShrink: 0,
          ...(variant === 'horizontal' ? { width: '200px', aspectRatio: '1' } : null),
        }}
      />
    ) : (
      <div
        aria-hidden="true"
        style={{
          width: variant === 'horizontal' ? '200px' : '100%',
          aspectRatio: variant === 'horizontal' ? '1' : (imageRatio && imageRatio !== 'auto' ? imageRatio : '16 / 9'),
          background: colorVar('muted', '#e5e7eb'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          borderRadius: imgTopRadius,
          color: 'var(--atlas-color-bg, #fff)',
          fontSize: fontSizeVar('sm'),
          fontFamily: 'var(--atlas-font-sans)',
        }}
      >
        Sin imagen
      </div>
    )

    const CtaEl = ctaLabel ? (
      <div style={{ marginTop: spacingVar('2') }}>
        {ctaStyle === 'link' ? (
          <a href={safeCta} style={{
            display: 'inline-block',
            color: colorVar('primary', '#0F62FE'),
            fontSize: fontSizeVar(descSize || 'sm'),
            fontFamily: 'var(--atlas-font-sans)',
            fontWeight: 600,
            textDecoration: 'none',
            borderBottom: `1px solid ${colorVar('primary', '#0F62FE')}`,
          }}>
            {ctaLabel} →
          </a>
        ) : (
          <a href={safeCta} style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: ctaStyle === 'solid' ? colorVar('primary', '#0F62FE') : 'transparent',
            color: ctaStyle === 'solid' ? 'white' : colorVar('primary', '#0F62FE'),
            border: `1px solid ${colorVar('primary', '#0F62FE')}`,
            borderRadius: rVar,
            fontSize: fontSizeVar('sm'),
            fontFamily: 'var(--atlas-font-sans)',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            {ctaLabel}
          </a>
        )}
      </div>
    ) : null

    const Body = (
      <div style={{ padding: spacingVar(padding), flex: 1, textAlign: align, display: 'flex', flexDirection: 'column', gap: spacingVar('2') }}>
        {ctx.inlineText({
          propName: 'title',
          value: title,
          as: 'h3',
          placeholder: 'Título',
          style: {
            margin: 0,
            color: colorVar('fg', 'inherit'),
            fontSize: fontSizeVar(titleSize || 'lg'),
            fontFamily: 'var(--atlas-font-sans)',
            fontWeight: titleWeight || '700',
            lineHeight: 1.25,
          },
        })}
        {description ? (
          <p style={{
            margin: 0,
            color: colorVar('muted', 'inherit'),
            fontSize: fontSizeVar(descSize || 'sm'),
            fontFamily: 'var(--atlas-font-sans)',
            lineHeight: 1.6,
          }}>
            {description}
          </p>
        ) : null}
        {CtaEl}
      </div>
    )

    return (
      <div style={{
        background: colorVar(background, 'white'),
        borderRadius: rVar,
        boxShadow: sVar,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: variant === 'horizontal' ? 'row' : 'column',
        border: borderColor ? `1px solid ${borderColor}` : variant === 'ghost' ? 'none' : '1px solid rgba(0,0,0,0.06)',
        height: '100%',
      }}>
        {ImageSlot}
        {Body}
      </div>
    )
  },
})
