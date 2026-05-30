import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar, fontSizeVar } from './_tokens.js'

const VARIANTS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'primary', label: 'Primario' },
  { value: 'transparent', label: 'Transparente' },
]

function isSafeHref(u) {
  return typeof u === 'string' && u !== '' && /^(https?:|mailto:|tel:|\/|#)/i.test(u)
}

function parseLinks(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.lastIndexOf('|')
      if (sep === -1) return { label: line, href: '#' }
      return { label: line.slice(0, sep).trim(), href: line.slice(sep + 1).trim() || '#' }
    })
}

/**
 * Navbar — barra de navegación superior con logo, enlaces y CTA opcional.
 * Los enlaces se definen como "Etiqueta | /ruta" separados por líneas.
 */
export const NavbarBlock = defineBlock({
  type: 'NavbarBlock',
  label: 'Navbar',
  category: 'navigation',
  icon: 'navbar',
  defaultProps: {
    variant: 'light',
    brand: 'Mi sitio',
    logoSrc: '',
    logoHeight: '32',
    links: 'Inicio | /\nProductos | /productos\nNosotros | /nosotros\nContacto | /contacto',
    ctaLabel: 'Empezar',
    ctaHref: '#',
    ctaVariant: 'solid',
    height: '64',
    maxWidth: '1280px',
    paddingX: '24px',
    sticky: false,
    showBrandName: true,
  },
  fields: {
    variant:      { type: 'select', label: 'Estilo',           options: VARIANTS },
    brand:        { type: 'text',   label: 'Nombre de marca' },
    logoSrc:      { type: 'image',  label: 'Logo (opcional)' },
    logoHeight:   { type: 'select', label: 'Alto del logo',    options: [
      { value: '24', label: '24px' }, { value: '32', label: '32px' },
      { value: '40', label: '40px' }, { value: '48', label: '48px' }, { value: '64', label: '64px' },
    ]},
    showBrandName:{ type: 'toggle', label: 'Mostrar nombre de marca' },
    links:        { type: 'textarea', label: 'Enlace | /ruta (uno por línea)' },
    ctaLabel:     { type: 'text',   label: 'Botón CTA' },
    ctaHref:      { type: 'link',   label: 'Enlace CTA' },
    ctaVariant:   { type: 'select', label: 'Estilo del CTA',   options: [
      { value: 'solid',   label: 'Sólido' },
      { value: 'outline', label: 'Contorno' },
      { value: 'ghost',   label: 'Fantasma' },
    ]},
    height:       { type: 'select', label: 'Altura del navbar', options: [
      { value: '48', label: '48px (compacto)' }, { value: '56', label: '56px' },
      { value: '64', label: '64px (normal)' },   { value: '80', label: '80px (grande)' },
    ]},
    maxWidth:     { type: 'select', label: 'Ancho máximo contenido', options: [
      { value: '960px',  label: '960px' }, { value: '1024px', label: '1024px' },
      { value: '1280px', label: '1280px (default)' }, { value: '1440px', label: '1440px' },
      { value: '100%',   label: 'Ancho completo' },
    ]},
    paddingX:     { type: 'select', label: 'Padding horizontal', options: [
      { value: '12px', label: '12px' }, { value: '16px', label: '16px' },
      { value: '24px', label: '24px (default)' }, { value: '40px', label: '40px' },
    ]},
    sticky:       { type: 'toggle', label: 'Pegajoso (sticky)' },
  },
  groups: [
    { label: 'Marca',      fields: ['brand', 'logoSrc', 'logoHeight', 'showBrandName'] },
    { label: 'Navegación', fields: ['links', 'ctaLabel', 'ctaHref', 'ctaVariant'] },
    { label: 'Estilo',     fields: ['variant', 'sticky', 'height', 'maxWidth', 'paddingX'] },
  ],
  render: ({ variant, brand, logoSrc, logoHeight, showBrandName, links, ctaLabel, ctaHref, ctaVariant, height, maxWidth, paddingX, sticky }) => {
    const parsedLinks = parseLinks(links)
    const safeCta  = isSafeHref(ctaHref) ? ctaHref : '#'
    const safeLogo = typeof logoSrc === 'string' && /^(https?:|\/|data:image\/)/i.test(logoSrc) ? logoSrc : ''
    const navH     = Number(height) || 64
    const lH       = Number(logoHeight) || 32

    const isDark  = variant === 'dark' || variant === 'primary'
    const bg      = variant === 'light' ? 'white' : variant === 'dark' ? '#0B0B0F' : variant === 'primary' ? colorVar('primary','#0F62FE') : 'transparent'
    const fg      = isDark ? 'rgba(255,255,255,0.92)' : colorVar('fg','#0B0B0F')
    const fgMuted = isDark ? 'rgba(255,255,255,0.65)' : colorVar('muted','#6B7280')
    const border  = variant === 'transparent' ? 'transparent' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

    const ctaBgColor  = ctaVariant === 'solid'
      ? (variant === 'primary' ? 'rgba(255,255,255,0.15)' : colorVar('primary','#0F62FE'))
      : 'transparent'
    const ctaFgColor  = ctaVariant === 'solid' ? 'white' : colorVar('primary','#0F62FE')
    const ctaBorder   = ctaVariant === 'outline' ? `1px solid ${colorVar('primary','#0F62FE')}` : ctaVariant === 'ghost' ? 'none' : 'none'

    return (
      <nav style={{ background: bg, borderBottom: `1px solid ${border}`, position: sticky ? 'sticky' : undefined, top: sticky ? 0 : undefined, zIndex: sticky ? 100 : undefined, backdropFilter: variant === 'transparent' ? 'blur(12px)' : undefined }} aria-label="Navegación principal">
        <div style={{ maxWidth: maxWidth || '1280px', marginInline: 'auto', padding: `0 ${paddingX || '24px'}`, height: navH, display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            {safeLogo ? <img src={safeLogo} alt={brand || 'Logo'} style={{ height: lH, width: 'auto', objectFit: 'contain' }} /> : null}
            {showBrandName !== false && brand ? <span style={{ fontFamily: 'var(--atlas-font-sans)', fontWeight: 800, fontSize: fontSizeVar('lg'), color: fg }}>{brand}</span> : null}
          </a>

          {parsedLinks.length > 0 ? (
            <ul style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0, padding: 0, listStyle: 'none', flex: 1 }}>
              {parsedLinks.map((link, i) => (
                <li key={i}>
                  <a href={isSafeHref(link.href) ? link.href : '#'} style={{ color: fgMuted, textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('sm'), fontWeight: 500 }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : <div style={{ flex: 1 }} />}

          {ctaLabel ? (
            <a href={safeCta} style={{ background: ctaBgColor, color: ctaFgColor, border: ctaBorder, padding: '8px 18px', borderRadius: 8, fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('sm'), fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              {ctaLabel}
            </a>
          ) : null}
        </div>
      </nav>
    )
  },
})
