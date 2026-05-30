import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar, radiusVar, shadowVar, spacingVar, fontSizeVar, RADIUS_TOKENS, SHADOW_TOKENS } from './_tokens.js'

const VARIANTS = [
  { value: 'card', label: 'Tarjeta' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'large', label: 'Grande' },
]

const STAR_OPTIONS = [
  { value: '0', label: 'Sin estrellas' },
  { value: '3', label: '★★★' },
  { value: '4', label: '★★★★' },
  { value: '5', label: '★★★★★' },
]

function isSafeUrl(u) {
  return typeof u === 'string' && u !== '' && /^(https?:|\/|data:image\/)/i.test(u)
}

/**
 * Testimonial — cita de cliente con autor, cargo y avatar opcional.
 */
export const TestimonialBlock = defineBlock({
  type: 'TestimonialBlock',
  label: 'Testimonio',
  category: 'content',
  icon: 'testimonial',
  defaultProps: {
    variant: 'card',
    quote: 'Este producto cambió completamente la forma en que trabajamos. No puedo imaginar volver a lo anterior.',
    author: 'María García',
    role: 'CEO, Empresa S.L.',
    avatarSrc: '',
    stars: '5',
    accentColor: 'primary',
    radius: 'lg',
    shadow: 'md',
  },
  fields: {
    variant: { type: 'select', label: 'Variante', options: VARIANTS },
    quote: { type: 'textarea', label: 'Cita' },
    author: { type: 'text', label: 'Autor' },
    role: { type: 'text', label: 'Cargo / Empresa' },
    avatarSrc: { type: 'image', label: 'Avatar' },
    stars: { type: 'select', label: 'Estrellas', options: STAR_OPTIONS },
    accentColor: { type: 'select', label: 'Color acento', options: ['primary', 'accent', 'fg'] },
    radius: { type: 'select', label: 'Bordes', options: RADIUS_TOKENS },
    shadow: { type: 'select', label: 'Sombra', options: SHADOW_TOKENS },
  },
  groups: [
    { label: 'Contenido', fields: ['quote', 'author', 'role', 'avatarSrc', 'stars'] },
    { label: 'Estilo',    fields: ['variant', 'accentColor', 'radius', 'shadow'] },
  ],
  render: ({ variant, quote, author, role, avatarSrc, stars, accentColor, radius, shadow }) => {
    const safeAvatar = isSafeUrl(avatarSrc) ? avatarSrc : ''
    const starCount = parseInt(stars, 10) || 0

    const Stars = starCount > 0 ? (
      <div style={{ color: colorVar('accent', '#F59E0B'), fontSize: fontSizeVar('md'), letterSpacing: '0.05em', marginBottom: spacingVar('3') }}>
        {'★'.repeat(starCount)}
      </div>
    ) : null

    const Avatar = safeAvatar ? (
      <img
        src={safeAvatar}
        alt={author || ''}
        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    ) : (
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: colorVar(accentColor, '#0F62FE'),
        color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--atlas-font-sans)',
        fontWeight: 700,
        fontSize: fontSizeVar('md'),
        flexShrink: 0,
      }}>
        {(author || 'A').charAt(0).toUpperCase()}
      </div>
    )

    const AuthorRow = (
      <div style={{ display: 'flex', alignItems: 'center', gap: spacingVar('3') }}>
        {Avatar}
        <div>
          <div style={{ fontWeight: 700, color: colorVar('fg', '#0B0B0F'), fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('sm') }}>
            {author}
          </div>
          {role ? (
            <div style={{ color: colorVar('muted', '#6B7280'), fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('xs') }}>
              {role}
            </div>
          ) : null}
        </div>
      </div>
    )

    if (variant === 'large') {
      return (
        <div style={{ padding: `${spacingVar('12')} ${spacingVar('8')}`, textAlign: 'center' }}>
          {Stars}
          <blockquote style={{
            margin: `0 0 ${spacingVar('6')} 0`,
            fontSize: fontSizeVar('2xl'),
            fontFamily: 'var(--atlas-font-sans)',
            color: colorVar('fg', '#0B0B0F'),
            lineHeight: 1.35,
            fontWeight: 300,
          }}>
            {String.fromCharCode(8220) + quote + String.fromCharCode(8221)}
          </blockquote>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {AuthorRow}
          </div>
        </div>
      )
    }

    if (variant === 'minimal') {
      return (
        <div style={{ padding: `${spacingVar('4')} 0`, borderLeft: `4px solid ${colorVar(accentColor, '#0F62FE')}`, paddingLeft: spacingVar('6') }}>
          {Stars}
          <blockquote style={{
            margin: `0 0 ${spacingVar('4')} 0`,
            fontSize: fontSizeVar('md'),
            fontFamily: 'var(--atlas-font-sans)',
            color: colorVar('fg', '#0B0B0F'),
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            {String.fromCharCode(8220) + quote + String.fromCharCode(8221)}
          </blockquote>
          {AuthorRow}
        </div>
      )
    }

    // card (default)
    return (
      <div style={{
        background: 'white',
        borderRadius: radiusVar(radius, '16px'),
        boxShadow: shadowVar(shadow, '0 4px 12px rgba(0,0,0,0.08)'),
        padding: spacingVar('8'),
        border: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: spacingVar('4'),
      }}>
        {Stars}
        <blockquote style={{
          margin: 0,
          fontSize: fontSizeVar('md'),
          fontFamily: 'var(--atlas-font-sans)',
          color: colorVar('fg', '#0B0B0F'),
          lineHeight: 1.65,
          flex: 1,
        }}>
          {String.fromCharCode(8220) + quote + String.fromCharCode(8221)}
        </blockquote>
        {AuthorRow}
      </div>
    )
  },
})
