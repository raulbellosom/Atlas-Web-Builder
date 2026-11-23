import { defineBlock } from '../registry/createBlockRegistry.js'
import { ALIGN_OPTIONS, IMAGE_WIDTH_OPTIONS } from './_tokens.js'

const isSafeUrl = (u) => typeof u === 'string' && u !== '' && /^(https?:|\/|blob:)/i.test(u)

/** Native audio player for a library/package file (MP3, M4A, Ogg, WAV). Controls are always visible. */
export const AudioBlock = defineBlock({
  type: 'AudioBlock',
  label: 'Audio',
  category: 'media',
  icon: 'music',
  defaultProps: { file: '', title: '', caption: '', width: '100%', align: 'left', loop: false },
  fields: {
    file:    { type: 'audio',  label: 'Archivo de audio (biblioteca)' },
    title:   { type: 'text',   label: 'Título' },
    caption: { type: 'text',   label: 'Descripción (opcional)' },
    width:   { type: 'select', label: 'Ancho', options: IMAGE_WIDTH_OPTIONS },
    align:   { type: 'select', label: 'Alineación', options: ALIGN_OPTIONS },
    loop:    { type: 'toggle', label: 'Repetir en bucle' },
  },
  groups: [
    { label: 'Audio', fields: ['file', 'title', 'caption'] },
    { label: 'Presentación', fields: ['width', 'align', 'loop'] },
  ],
  render: ({ file, title, caption, width, align, loop }) => {
    const wrapStyle = {
      display: 'flex', flexDirection: 'column', gap: 6, width, fontFamily: 'var(--atlas-font-sans)',
      ...(align === 'center' ? { marginInline: 'auto' } : align === 'right' ? { marginLeft: 'auto', marginRight: 0 } : null),
    }
    return (
      <figure style={{ ...wrapStyle, margin: 0 }}>
        {title ? <strong style={{ fontSize: 'var(--atlas-fontSize-base)' }}>{title}</strong> : null}
        {isSafeUrl(file) ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio src={file} controls loop={loop} preload="metadata" style={{ width: '100%' }} aria-label={title || caption || 'Audio'} />
        ) : (
          <div style={{ padding: 16, border: '1px dashed var(--atlas-color-border, #d1d5db)', borderRadius: 8, color: '#888', fontSize: 'var(--atlas-fontSize-sm)', textAlign: 'center' }}>
            Elige un audio de la biblioteca
          </div>
        )}
        {caption ? <figcaption style={{ fontSize: 'var(--atlas-fontSize-sm)', color: 'var(--atlas-color-muted, #6b7280)', lineHeight: 1.4 }}>{caption}</figcaption> : null}
      </figure>
    )
  },
})
