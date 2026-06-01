import { defineBlock } from '../registry/createBlockRegistry.js'
import {
  spacingVar,
  colorVar,
  fontSizeVar,
  shadowVar,
  SPACING_STOPS,
  ALIGN_OPTIONS,
  FONT_SIZE_TOKENS,
  MIN_HEIGHT_OPTIONS,
  MAX_WIDTH_OPTIONS,
  SHADOW_TOKENS,
} from './_tokens.js'
import { resolveBackground } from './_background.js'

const VARIANTS = [
  { value: 'centered', label: 'Centrado' },
  { value: 'split', label: 'Dividido' },
  { value: 'image-bg', label: 'Imagen de fondo' },
]

/**
 * Hero — title + subtitle + optional CTA + optional image. Three variants.
 * All colors and spacing pull from theme tokens. Texts are inline-editable
 * on the canvas (double click).
 */
export const HeroBlock = defineBlock({
  type: 'HeroBlock',
  label: 'Hero',
  category: 'hero',
  icon: 'hero',
  variants: VARIANTS.map((v) => v.value),
  defaultProps: {
    variant: 'centered',
    eyebrow: '',
    title: 'Título principal',
    subtitle: '',
    ctaLabel: '',
    ctaHref: '#',
    ctaVariant: 'solid',
    ctaSecondLabel: '',
    ctaSecondHref: '#',
    imageSrc: '',
    background: { kind: 'color', token: 'bg' },
    align: 'center',
    paddingY: '16',
    minHeight: '',
    titleSize: '3xl',
    contentMaxWidth: '65ch',
    shadow: 'none',
  },
  fields: {
    variant: { type: 'select', label: 'Variante', options: VARIANTS },
    eyebrow: { type: 'text', label: 'Antetítulo' },
    title: { type: 'text', label: 'Título' },
    titleSize: { type: 'select', label: 'Tamaño del título', options: FONT_SIZE_TOKENS },
    subtitle: { type: 'textarea', label: 'Subtítulo' },
    ctaLabel: { type: 'text', label: 'Botón primario' },
    ctaHref: { type: 'link', label: 'Enlace botón primario' },
    ctaVariant: {
      type: 'select',
      label: 'Estilo botón',
      options: [
        { value: 'solid', label: 'Sólido' },
        { value: 'outline', label: 'Contorno' },
        { value: 'ghost', label: 'Fantasma' },
      ],
    },
    ctaSecondLabel: { type: 'text', label: 'Botón secundario (opcional)' },
    ctaSecondHref: { type: 'link', label: 'Enlace botón secundario' },
    imageSrc: { type: 'image', label: 'Imagen' },
    background: { type: 'background', label: 'Fondo' },
    align: { type: 'select', label: 'Alineación', options: ALIGN_OPTIONS },
    paddingY: { type: 'select', label: 'Padding vertical', options: SPACING_STOPS },
    minHeight: { type: 'select', label: 'Altura mínima', options: MIN_HEIGHT_OPTIONS },
    contentMaxWidth: { type: 'select', label: 'Ancho máx. contenido', options: MAX_WIDTH_OPTIONS },
    shadow: { type: 'select', label: 'Sombra', options: SHADOW_TOKENS },
  },
  groups: [
    {
      label: 'Contenido',
      fields: [
        'title',
        'titleSize',
        'subtitle',
        'eyebrow',
        'ctaLabel',
        'ctaHref',
        'ctaVariant',
        'ctaSecondLabel',
        'ctaSecondHref',
        'imageSrc',
      ],
    },
    {
      label: 'Estilo',
      fields: [
        'variant',
        'align',
        'paddingY',
        'minHeight',
        'contentMaxWidth',
        'background',
        'shadow',
      ],
    },
  ],
  render: ({
    variant,
    eyebrow,
    title,
    titleSize,
    subtitle,
    ctaLabel,
    ctaHref,
    ctaVariant,
    ctaSecondLabel,
    ctaSecondHref,
    imageSrc,
    background,
    align,
    paddingY,
    minHeight,
    contentMaxWidth,
    shadow,
    ctx,
  }) => {
    const safeCta =
      typeof ctaHref === 'string' && /^(https?:|mailto:|tel:|\/|#)/i.test(ctaHref || '')
        ? ctaHref
        : '#'
    const safeCta2 =
      typeof ctaSecondHref === 'string' && /^(https?:|mailto:|tel:|\/|#)/i.test(ctaSecondHref || '')
        ? ctaSecondHref
        : '#'
    const safeImage =
      typeof imageSrc === 'string' && /^(https?:|\/|data:image\/)/i.test(imageSrc || '')
        ? imageSrc
        : ''
    const isEdit = ctx.mode === 'edit'
    const tSize = titleSize || '3xl'
    const maxW = contentMaxWidth || '65ch'

    function ctaBg(v) {
      return v === 'solid' ? colorVar('primary', '#0F62FE') : 'transparent'
    }
    function ctaFg(v) {
      return v === 'solid' ? colorVar('primaryFg', '#fff') : colorVar('primary', '#0F62FE')
    }
    function ctaBorder(v) {
      return v === 'outline' ? `1px solid ${colorVar('primary', '#0F62FE')}` : 'none'
    }

    const ctaStyle = {
      display: 'inline-block',
      background: ctaBg(ctaVariant),
      color: ctaFg(ctaVariant),
      border: ctaBorder(ctaVariant),
      padding: '11px 22px',
      borderRadius: 'var(--atlas-radius-md, 8px)',
      fontFamily: 'var(--atlas-font-sans)',
      fontWeight: 600,
      textDecoration: 'none',
      fontSize: fontSizeVar('md'),
    }

    const Cta =
      ctaLabel || isEdit ? (
        <a href={safeCta} style={ctaStyle}>
          {ctx.inlineText({
            propName: 'ctaLabel',
            value: ctaLabel,
            as: 'span',
            placeholder: 'Botón',
            style: { color: 'inherit' },
          })}
        </a>
      ) : null

    const CtaSecond = ctaSecondLabel ? (
      <a
        href={safeCta2}
        style={{
          ...ctaStyle,
          background: 'transparent',
          color: colorVar('fg', 'inherit'),
          border: `1px solid ${colorVar('muted', '#6b7280')}`,
        }}
      >
        {ctaSecondLabel}
      </a>
    ) : null

    const CtaGroup =
      Cta || CtaSecond ? (
        <div
          style={{
            display: 'flex',
            gap: spacingVar('3'),
            flexWrap: 'wrap',
            marginTop: spacingVar('6'),
            justifyContent:
              align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          {Cta}
          {CtaSecond}
        </div>
      ) : null

    const Eyebrow =
      eyebrow || isEdit
        ? ctx.inlineText({
            propName: 'eyebrow',
            value: eyebrow,
            as: 'span',
            placeholder: 'Antetítulo',
            style: {
              display: 'block',
              color: colorVar('accent', 'inherit'),
              fontFamily: 'var(--atlas-font-sans)',
              fontSize: fontSizeVar('sm'),
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: spacingVar('3'),
              fontWeight: 600,
            },
          })
        : null

    const Title = ctx.inlineText({
      propName: 'title',
      value: title,
      as: 'h1',
      placeholder: 'Título',
      style: {
        margin: 0,
        color: colorVar('fg', 'inherit'),
        fontFamily: 'var(--atlas-font-sans)',
        fontSize: fontSizeVar(tSize),
        lineHeight: 1.1,
        overflowWrap: 'break-word',
      },
    })

    const Subtitle =
      subtitle || isEdit
        ? ctx.inlineText({
            propName: 'subtitle',
            value: subtitle,
            as: 'p',
            multiline: true,
            placeholder: 'Subtítulo',
            style: {
              color: colorVar('muted', 'inherit'),
              fontFamily: 'var(--atlas-font-sans)',
              fontSize: fontSizeVar('lg'),
              margin: 0,
              marginTop: spacingVar('4'),
              maxWidth: maxW,
              overflowWrap: 'break-word',
              ...(align === 'center' ? { marginInline: 'auto' } : null),
            },
          })
        : null

    const sectionBase = {
      padding: `${spacingVar(paddingY)} ${spacingVar('6')}`,
      ...(minHeight ? { minHeight } : null),
      ...(shadow && shadow !== 'none' ? { boxShadow: shadowVar(shadow) } : null),
    }

    if (variant === 'split') {
      return (
        <section
          style={{
            ...sectionBase,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacingVar('8'),
            alignItems: 'center',
            ...resolveBackground(background, 'transparent'),
          }}
        >
          <div style={{ textAlign: align, minWidth: 0 }}>
            {Eyebrow}
            {Title}
            {Subtitle}
            {CtaGroup}
          </div>
          <div>
            {safeImage ? (
              <img
                src={safeImage}
                alt=""
                loading="lazy"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 'var(--atlas-radius-lg,16px)',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  aspectRatio: '4/3',
                  background: colorVar('muted', '#e5e7eb'),
                  borderRadius: 'var(--atlas-radius-lg,16px)',
                }}
              />
            )}
          </div>
        </section>
      )
    }

    if (variant === 'image-bg') {
      const imgBg = safeImage
        ? resolveBackground(
            { kind: 'image', url: safeImage, overlay: 'rgba(0,0,0,0.45)', size: 'cover' },
            '#1f2937',
          )
        : resolveBackground(background, '#1f2937')
      return (
        <section
          style={{
            ...sectionBase,
            position: 'relative',
            color: '#fff',
            textAlign: align,
            ...imgBg,
          }}
        >
          {Eyebrow}
          {ctx.inlineText({
            propName: 'title',
            value: title,
            as: 'h1',
            placeholder: 'Título',
            style: {
              margin: 0,
              color: '#fff',
              fontFamily: 'var(--atlas-font-sans)',
              fontSize: fontSizeVar(tSize),
              lineHeight: 1.1,
              overflowWrap: 'break-word',
            },
          })}
          {subtitle || isEdit
            ? ctx.inlineText({
                propName: 'subtitle',
                value: subtitle,
                as: 'p',
                multiline: true,
                placeholder: 'Subtítulo',
                style: {
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'var(--atlas-font-sans)',
                  fontSize: fontSizeVar('lg'),
                  margin: 0,
                  marginTop: spacingVar('4'),
                  maxWidth: maxW,
                  overflowWrap: 'break-word',
                  marginInline: align === 'center' ? 'auto' : undefined,
                },
              })
            : null}
          {CtaGroup}
        </section>
      )
    }

    // centered (default)
    return (
      <section
        style={{
          ...sectionBase,
          textAlign: align,
          ...resolveBackground(background, 'transparent'),
        }}
      >
        {Eyebrow}
        {Title}
        {Subtitle}
        {CtaGroup}
      </section>
    )
  },
})
