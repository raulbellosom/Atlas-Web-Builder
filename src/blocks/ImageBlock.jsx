import { defineBlock } from '../registry/createBlockRegistry.js'
import {
  radiusVar,
  shadowVar,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  ALIGN_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  IMAGE_WIDTH_OPTIONS,
} from './_tokens.js'

const OBJECT_FIT_OPTIONS = [
  { value: 'cover',   label: 'Cubrir (recortar)' },
  { value: 'contain', label: 'Contener (completa)' },
  { value: 'fill',    label: 'Estirar' },
  { value: 'none',    label: 'Sin ajuste (original)' },
]

const LOADING_OPTIONS = [
  { value: 'lazy',  label: 'Diferida (recomendada)' },
  { value: 'eager', label: 'Inmediata' },
]

function isSafeImageUrl(url) {
  if (typeof url !== 'string' || url === '') return false
  return /^(https?:|\/|data:image\/)/i.test(url)
}
function isSafeHref(u) {
  return typeof u === 'string' && u !== '' && /^(https?:|mailto:|tel:|\/|#)/i.test(u)
}

export const ImageBlock = defineBlock({
  type: 'ImageBlock',
  label: 'Imagen',
  category: 'media',
  icon: 'image',
  defaultProps: {
    src: '',
    alt: '',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    width: '100%',
    align: 'left',
    radius: 'none',
    shadow: 'none',
    caption: '',
    link: '',
    loading: 'lazy',
    draggable: false,
  },
  fields: {
    src:         { type: 'image',  label: 'Imagen' },
    alt:         { type: 'text',   label: 'Texto alternativo (SEO / accesibilidad)' },
    caption:     { type: 'text',   label: 'Pie de foto (opcional)' },
    link:        { type: 'link',   label: 'Enlace al hacer clic (opcional)' },
    aspectRatio: { type: 'select', label: 'Proporción', options: ASPECT_RATIO_OPTIONS },
    objectFit:   { type: 'select', label: 'Ajuste de imagen', options: OBJECT_FIT_OPTIONS },
    width:       { type: 'select', label: 'Ancho', options: IMAGE_WIDTH_OPTIONS },
    align:       { type: 'select', label: 'Alineación', options: ALIGN_OPTIONS },
    radius:      { type: 'select', label: 'Bordes redondeados', options: RADIUS_TOKENS },
    shadow:      { type: 'select', label: 'Sombra', options: SHADOW_TOKENS },
    loading:     { type: 'select', label: 'Carga', options: LOADING_OPTIONS },
    draggable:   { type: 'toggle', label: 'Arrastrable por el usuario' },
  },
  groups: [
    { label: 'Imagen',        fields: ['src', 'alt', 'caption', 'link', 'loading'] },
    { label: 'Presentación',  fields: ['aspectRatio', 'objectFit', 'width', 'align'] },
    { label: 'Estilo',        fields: ['radius', 'shadow'] },
  ],
  render: ({ src, alt, aspectRatio, objectFit, width, align, radius, shadow, caption, link, loading, draggable }) => {
    const safeRatio = aspectRatio && aspectRatio !== 'auto' ? aspectRatio : undefined
    const safeLink  = isSafeHref(link) ? link : ''
    const radiusVal = radius && radius !== 'none' ? radiusVar(radius) : undefined
    const shadowVal = shadow && shadow !== 'none' ? shadowVar(shadow) : undefined

    const wrapStyle = {
      display: 'block',
      width,
      ...(align === 'center' ? { marginInline: 'auto' } :
          align === 'right'  ? { marginLeft: 'auto', marginRight: 0 } : null),
    }

    const imgStyle = {
      display: 'block',
      width: '100%',
      height: 'auto',
      aspectRatio: safeRatio,
      objectFit,
      borderRadius: radiusVal,
      boxShadow: shadowVal,
      draggable: draggable ? undefined : 'false',
    }

    const placeholder = (
      <div
        style={{
          width: '100%',
          aspectRatio: safeRatio || '16 / 9',
          background: 'var(--atlas-color-muted, #e5e7eb)',
          borderRadius: radiusVal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--atlas-color-bg, #fff)',
          fontFamily: 'var(--atlas-font-sans)',
          fontSize: 'var(--atlas-fontSize-sm)',
        }}
        aria-label={alt || 'Imagen sin cargar'}
      >
        Sin imagen
      </div>
    )

    const img = isSafeImageUrl(src)
      ? <img src={src} alt={alt || ''} loading={loading || 'lazy'} decoding="async" style={imgStyle} />
      : placeholder

    const wrapped = safeLink
      ? <a href={safeLink} style={{ display: 'block', borderRadius: radiusVal, overflow: radiusVal ? 'hidden' : undefined }}>{img}</a>
      : img

    if (!caption) {
      return <div style={wrapStyle}>{wrapped}</div>
    }

    return (
      <figure style={{ ...wrapStyle, margin: 0 }}>
        {wrapped}
        <figcaption style={{
          marginTop: 6,
          fontSize: 'var(--atlas-fontSize-sm)',
          color: 'var(--atlas-color-muted, #6b7280)',
          fontFamily: 'var(--atlas-font-sans)',
          textAlign: align || 'left',
          lineHeight: 1.4,
        }}>
          {caption}
        </figcaption>
      </figure>
    )
  },
})
