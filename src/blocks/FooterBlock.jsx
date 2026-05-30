import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar, fontSizeVar, spacingVar } from './_tokens.js'

const VARIANTS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'primary', label: 'Primario' },
]

function isSafeHref(u) {
  return typeof u === 'string' && /^(https?:|mailto:|tel:|\/|#)/i.test(u)
}

function parseColumns(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return []
  const blocks = raw.split('---').map((b) => b.trim()).filter(Boolean)
  return blocks.map((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    const title = lines[0] || ''
    const links = lines.slice(1).map((line) => {
      const sep = line.lastIndexOf('|')
      if (sep === -1) return { label: line, href: '#' }
      return { label: line.slice(0, sep).trim(), href: line.slice(sep + 1).trim() || '#' }
    })
    return { title, links }
  })
}

/**
 * Footer — pie de página con columnas de enlaces y copyright.
 *
 * Las columnas se separan con "---". Dentro de cada columna:
 * - Primera línea = título de la columna
 * - Siguientes = "Etiqueta | /ruta"
 */
export const FooterBlock = defineBlock({
  type: 'FooterBlock',
  label: 'Footer',
  category: 'navigation',
  icon: 'footer',
  defaultProps: {
    variant: 'dark',
    brand: 'Mi sitio',
    tagline: 'Construido con pasión.',
    columns: 'Producto | Producto\nCaracterísticas | /features\nPrecios | /pricing\nDocumentación | /docs\n---\nEmpresa | Empresa\nNosotros | /about\nBlog | /blog\nContacto | /contact\n---\nLegal | Legal\nPrivacidad | /privacy\nTérminos | /terms',
    copyright: `© ${new Date().getFullYear()} Mi sitio. Todos los derechos reservados.`,
    showBrand: true,
  },
  fields: {
    variant: { type: 'select', label: 'Variante', options: VARIANTS },
    brand: { type: 'text', label: 'Nombre de marca' },
    tagline: { type: 'text', label: 'Tagline' },
    columns: { type: 'textarea', label: 'Columnas (título en primera línea, --- para separar)' },
    copyright: { type: 'text', label: 'Copyright' },
    showBrand: { type: 'toggle', label: 'Mostrar marca' },
  },
  render: ({ variant, brand, tagline, columns, copyright, showBrand }) => {
    const cols = parseColumns(columns)
    const isDark = variant === 'dark' || variant === 'primary'
    const bg = variant === 'light' ? 'white'
      : variant === 'dark' ? '#111827'
      : colorVar('primary', '#0F62FE')
    const fg = isDark ? 'rgba(255,255,255,0.90)' : colorVar('fg', '#0B0B0F')
    const fgMuted = isDark ? 'rgba(255,255,255,0.55)' : colorVar('muted', '#6B7280')
    const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

    return (
      <footer style={{ background: bg, color: fg }}>
        <div style={{
          maxWidth: '1280px',
          marginInline: 'auto',
          padding: `${spacingVar('12')} ${spacingVar('6')}`,
        }}>
          {/* Brand + columns row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: showBrand && brand ? `1.5fr ${cols.map(() => '1fr').join(' ')}` : cols.map(() => '1fr').join(' '),
            gap: spacingVar('8'),
            marginBottom: spacingVar('12'),
          }}>
            {showBrand && brand ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacingVar('3') }}>
                <span style={{ fontFamily: 'var(--atlas-font-sans)', fontWeight: 800, fontSize: fontSizeVar('xl'), color: fg }}>
                  {brand}
                </span>
                {tagline ? (
                  <p style={{ margin: 0, color: fgMuted, fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('sm'), lineHeight: 1.6 }}>
                    {tagline}
                  </p>
                ) : null}
              </div>
            ) : null}

            {cols.map((col, i) => (
              <div key={i}>
                {col.title ? (
                  <div style={{ fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('xs'), fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: fgMuted, marginBottom: spacingVar('4') }}>
                    {col.title}
                  </div>
                ) : null}
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: spacingVar('2') }}>
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a
                        href={isSafeHref(link.href) ? link.href : '#'}
                        style={{
                          color: fgMuted,
                          textDecoration: 'none',
                          fontFamily: 'var(--atlas-font-sans)',
                          fontSize: fontSizeVar('sm'),
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: `1px solid ${borderColor}`,
            paddingTop: spacingVar('6'),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: spacingVar('4'),
          }}>
            <p style={{ margin: 0, color: fgMuted, fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('xs') }}>
              {copyright}
            </p>
          </div>
        </div>
      </footer>
    )
  },
})
