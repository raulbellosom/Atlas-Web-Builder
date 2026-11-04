import { AtlasImage } from '../media/AtlasImage.jsx'
import { colorVar, radiusVar } from '../blocks/_tokens.js'

/** Swap point for the shared image component. */
export function Img({ src, alt = '', aspectRatio = '1 / 1', sizes, style }) {
  if (!src) {
    return <div aria-hidden="true" style={{ aspectRatio, background: colorVar('muted', '#F1F5F9'), borderRadius: radiusVar('md', '8px'), ...style }} />
  }
  return <AtlasImage src={src} alt={alt} aspectRatio={aspectRatio} sizes={sizes} style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block', borderRadius: radiusVar('md', '8px'), ...style }} />
}

export function buttonStyle({ variant = 'solid', disabled = false, full = false } = {}) {
  const solid = variant === 'solid'
  return {
    display: full ? 'block' : 'inline-block',
    width: full ? '100%' : undefined,
    padding: '10px 18px',
    font: 'inherit',
    fontWeight: 600,
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    color: solid ? colorVar('primaryFg', '#fff') : colorVar('primary', '#0F62FE'),
    background: solid ? colorVar('primary', '#0F62FE') : 'transparent',
    border: `1px solid ${colorVar('primary', '#0F62FE')}`,
    borderRadius: radiusVar('md', '8px'),
  }
}

export const inputStyle = {
  boxSizing: 'border-box',
  padding: '8px 10px',
  font: 'inherit',
  color: colorVar('fg', 'inherit'),
  background: colorVar('bg', '#fff'),
  border: `1px solid ${colorVar('border', '#CBD5E1')}`,
  borderRadius: radiusVar('md', '8px'),
}

export function Skeleton({ count = 3, columns = 3, aspectRatio = '1 / 1' }) {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 16 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} aria-hidden="true" style={{ aspectRatio, background: colorVar('muted', '#F1F5F9'), borderRadius: radiusVar('md', '8px') }} />
      ))}
    </div>
  )
}

export const rootStyle = { fontFamily: 'var(--atlas-font-sans)', color: colorVar('fg', 'inherit') }
