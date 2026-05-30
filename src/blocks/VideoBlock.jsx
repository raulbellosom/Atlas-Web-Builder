import { defineBlock } from '../registry/createBlockRegistry.js'
import { radiusVar, shadowVar, RADIUS_TOKENS, SHADOW_TOKENS, ALIGN_OPTIONS, ASPECT_RATIO_OPTIONS, IMAGE_WIDTH_OPTIONS } from './_tokens.js'

function detectKind(url) {
  if (!url) return 'empty'
  if (/youtube\.com|youtu\.be/i.test(url))  return 'youtube'
  if (/vimeo\.com/i.test(url))              return 'vimeo'
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return 'mp4'
  return 'unknown'
}

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/\s]+)/)
  return m?.[1] ?? null
}

function getVimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m?.[1] ?? null
}

function buildYouTubeEmbed(id, { autoplay, controls, loop, muted }) {
  const params = new URLSearchParams({
    ...(autoplay  ? { autoplay: '1' } : {}),
    ...(loop      ? { loop: '1', playlist: id } : {}),
    ...(muted     ? { mute: '1' } : {}),
    controls: controls ? '1' : '0',
    rel: '0',
    modestbranding: '1',
  })
  return `https://www.youtube.com/embed/${id}?${params}`
}

function buildVimeoEmbed(id, { autoplay, controls, loop, muted }) {
  const params = new URLSearchParams({
    ...(autoplay ? { autoplay: '1' } : {}),
    ...(loop     ? { loop: '1' } : {}),
    ...(muted    ? { muted: '1' } : {}),
    controls: controls ? '1' : '0',
    title: '0',
    byline: '0',
    portrait: '0',
  })
  return `https://player.vimeo.com/video/${id}?${params}`
}

function isSafeUrl(u) {
  return typeof u === 'string' && u !== '' && /^(https?:|\/)/i.test(u)
}

export const VideoBlock = defineBlock({
  type: 'VideoBlock',
  label: 'Video',
  category: 'media',
  icon: 'video',
  defaultProps: {
    src: '',
    poster: '',
    caption: '',
    aspectRatio: '16 / 9',
    width: '100%',
    align: 'left',
    radius: 'none',
    shadow: 'none',
    autoplay: false,
    controls: true,
    loop: false,
    muted: false,
  },
  fields: {
    src:         { type: 'link',   label: 'URL del video (YouTube, Vimeo o .mp4)' },
    poster:      { type: 'image',  label: 'Imagen de portada (MP4, opcional)' },
    caption:     { type: 'text',   label: 'Pie de video (opcional)' },
    aspectRatio: { type: 'select', label: 'Proporción',  options: ASPECT_RATIO_OPTIONS },
    width:       { type: 'select', label: 'Ancho',       options: IMAGE_WIDTH_OPTIONS },
    align:       { type: 'select', label: 'Alineación',  options: ALIGN_OPTIONS },
    radius:      { type: 'select', label: 'Bordes',      options: RADIUS_TOKENS },
    shadow:      { type: 'select', label: 'Sombra',      options: SHADOW_TOKENS },
    autoplay:    { type: 'toggle', label: 'Autoplay (silenciará el video)' },
    controls:    { type: 'toggle', label: 'Mostrar controles' },
    loop:        { type: 'toggle', label: 'Repetir en bucle' },
    muted:       { type: 'toggle', label: 'Silenciado' },
  },
  groups: [
    { label: 'Video',        fields: ['src', 'poster', 'caption'] },
    { label: 'Presentación', fields: ['aspectRatio', 'width', 'align'] },
    { label: 'Estilo',       fields: ['radius', 'shadow'] },
    { label: 'Reproducción', fields: ['autoplay', 'controls', 'loop', 'muted'] },
  ],
  render: ({ src, poster, caption, aspectRatio, width, align, radius, shadow, autoplay, controls, loop, muted }) => {
    const kind     = detectKind(src)
    const safeRatio = aspectRatio && aspectRatio !== 'auto' ? aspectRatio : '16 / 9'
    const radiusVal = radius && radius !== 'none' ? radiusVar(radius) : undefined
    const shadowVal = shadow && shadow !== 'none' ? shadowVar(shadow) : undefined

    const wrapStyle = {
      display: 'block',
      width,
      ...(align === 'center' ? { marginInline: 'auto' } :
          align === 'right'  ? { marginLeft: 'auto', marginRight: 0 } : null),
    }

    const frameStyle = {
      width: '100%',
      aspectRatio: safeRatio,
      borderRadius: radiusVal,
      boxShadow: shadowVal,
      overflow: radiusVal ? 'hidden' : undefined,
      display: 'block',
      background: '#000',
    }

    let media

    if (kind === 'youtube') {
      const id = getYouTubeId(src)
      if (!id) {
        media = <div style={{ ...frameStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--atlas-font-sans)', fontSize: 'var(--atlas-fontSize-sm)' }}>URL de YouTube no válida</div>
      } else {
        media = (
          <iframe
            src={buildYouTubeEmbed(id, { autoplay, controls, loop, muted: autoplay || muted })}
            style={{ ...frameStyle, border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={caption || 'YouTube video'}
          />
        )
      }
    } else if (kind === 'vimeo') {
      const id = getVimeoId(src)
      media = (
        <iframe
          src={id ? buildVimeoEmbed(id, { autoplay, controls, loop, muted: autoplay || muted }) : ''}
          style={{ ...frameStyle, border: 'none' }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={caption || 'Vimeo video'}
        />
      )
    } else if (kind === 'mp4' || (kind === 'unknown' && isSafeUrl(src))) {
      media = (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={isSafeUrl(src) ? src : undefined}
          poster={isSafeUrl(poster) ? poster : undefined}
          style={frameStyle}
          autoPlay={autoplay}
          controls={controls}
          loop={loop}
          muted={autoplay || muted}
          playsInline
        />
      )
    } else {
      // Empty / placeholder
      media = (
        <div style={{ ...frameStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#888', fontFamily: 'var(--atlas-font-sans)', fontSize: 'var(--atlas-fontSize-sm)' }}>
          <span style={{ fontSize: 32, opacity: 0.4 }}>▶</span>
          <span>Añade una URL de YouTube, Vimeo o .mp4</span>
        </div>
      )
    }

    if (!caption) {
      return <div style={wrapStyle}>{media}</div>
    }

    return (
      <figure style={{ ...wrapStyle, margin: 0 }}>
        {media}
        <figcaption style={{ marginTop: 6, fontSize: 'var(--atlas-fontSize-sm)', color: 'var(--atlas-color-muted, #6b7280)', fontFamily: 'var(--atlas-font-sans)', textAlign: align || 'left', lineHeight: 1.4 }}>
          {caption}
        </figcaption>
      </figure>
    )
  },
})
