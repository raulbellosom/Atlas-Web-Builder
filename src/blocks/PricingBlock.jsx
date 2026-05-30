import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar, radiusVar, shadowVar, spacingVar, fontSizeVar, RADIUS_TOKENS, SHADOW_TOKENS } from './_tokens.js'
import { resolveBackground } from './_background.js'

function isSafeHref(u) {
  return typeof u === 'string' && /^(https?:|mailto:|tel:|\/|#)/i.test(u)
}

/**
 * Pricing — tarjeta de precio con lista de características.
 * Las características se definen como texto separado por líneas.
 */
export const PricingBlock = defineBlock({
  type: 'PricingBlock',
  label: 'Precio',
  category: 'content',
  icon: 'pricing',
  defaultProps: {
    plan: 'Pro',
    price: '29',
    currency: '€',
    period: '/ mes',
    description: 'Todo lo que necesitas para crecer.',
    features: 'Acceso completo\nSoporte prioritario\nActualizaciones incluidas\nSin límites de usuarios',
    ctaLabel: 'Comenzar gratis',
    ctaHref: '#',
    highlighted: false,
    badge: '',
    radius: 'lg',
    shadow: 'md',
  },
  fields: {
    plan: { type: 'text', label: 'Nombre del plan' },
    price: { type: 'text', label: 'Precio (solo número)' },
    currency: { type: 'text', label: 'Moneda' },
    period: { type: 'text', label: 'Período (ej. / mes)' },
    description: { type: 'text', label: 'Descripción' },
    features: { type: 'textarea', label: 'Características (una por línea)' },
    ctaLabel: { type: 'text', label: 'Texto del botón' },
    ctaHref: { type: 'link', label: 'Enlace del botón' },
    highlighted: { type: 'toggle', label: 'Destacado' },
    badge: { type: 'text', label: 'Badge (ej. Más popular)' },
    radius: { type: 'select', label: 'Bordes', options: RADIUS_TOKENS },
    shadow: { type: 'select', label: 'Sombra', options: SHADOW_TOKENS },
  },
  groups: [
    { label: 'Contenido', fields: ['plan', 'price', 'currency', 'period', 'description', 'features', 'ctaLabel', 'ctaHref', 'badge'] },
    { label: 'Estilo',    fields: ['highlighted', 'radius', 'shadow'] },
  ],
  render: ({ plan, price, currency, period, description, features, ctaLabel, ctaHref, highlighted, badge, radius, shadow }) => {
    const safeCta = isSafeHref(ctaHref) ? ctaHref : '#'
    const featureList = typeof features === 'string'
      ? features.split('\n').map((f) => f.trim()).filter(Boolean)
      : []

    const bg = highlighted
      ? resolveBackground({ kind: 'gradient', fromToken: 'primary', toToken: 'accent', angle: 135 }, '#0F62FE')
      : { background: 'white' }

    const textColor = highlighted ? '#fff' : colorVar('fg', '#0B0B0F')
    const mutedColor = highlighted ? 'rgba(255,255,255,0.75)' : colorVar('muted', '#6B7280')
    const borderColor = highlighted ? 'transparent' : 'rgba(0,0,0,0.06)'

    return (
      <div style={{
        ...bg,
        borderRadius: radiusVar(radius, '16px'),
        boxShadow: shadowVar(shadow, '0 4px 12px rgba(0,0,0,0.08)'),
        border: `1px solid ${borderColor}`,
        padding: spacingVar('8'),
        display: 'flex',
        flexDirection: 'column',
        gap: spacingVar('6'),
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
      }}>
        {badge ? (
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: highlighted ? 'rgba(255,255,255,0.2)' : colorVar('primary', '#0F62FE'),
            color: highlighted ? '#fff' : 'white',
            fontSize: fontSizeVar('xs'),
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '999px',
            fontFamily: 'var(--atlas-font-sans)',
            letterSpacing: '0.03em',
          }}>
            {badge}
          </div>
        ) : null}

        <div>
          <div style={{ color: mutedColor, fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('sm'), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: spacingVar('2') }}>
            {plan}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: spacingVar('1'), marginBottom: spacingVar('2') }}>
            <span style={{ fontFamily: 'var(--atlas-font-sans)', color: textColor, fontSize: fontSizeVar('sm'), fontWeight: 600, alignSelf: 'flex-start', paddingTop: 6 }}>
              {currency}
            </span>
            <span style={{ fontFamily: 'var(--atlas-font-sans)', color: textColor, fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>
              {price}
            </span>
            <span style={{ color: mutedColor, fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('sm'), marginBottom: 4 }}>
              {period}
            </span>
          </div>
          {description ? (
            <p style={{ margin: 0, color: mutedColor, fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('sm'), lineHeight: 1.5 }}>
              {description}
            </p>
          ) : null}
        </div>

        {ctaLabel ? (
          <a
            href={safeCta}
            style={{
              display: 'block',
              textAlign: 'center',
              background: highlighted ? 'rgba(255,255,255,0.15)' : colorVar('primary', '#0F62FE'),
              color: highlighted ? '#fff' : 'white',
              padding: '12px 20px',
              borderRadius: radiusVar('md', '8px'),
              fontFamily: 'var(--atlas-font-sans)',
              fontWeight: 700,
              fontSize: fontSizeVar('md'),
              textDecoration: 'none',
              border: highlighted ? '1px solid rgba(255,255,255,0.3)' : 'none',
              backdropFilter: highlighted ? 'blur(4px)' : undefined,
            }}
          >
            {ctaLabel}
          </a>
        ) : null}

        {featureList.length > 0 ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: spacingVar('2'), flex: 1 }}>
            {featureList.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: spacingVar('2'), color: textColor, fontFamily: 'var(--atlas-font-sans)', fontSize: fontSizeVar('sm') }}>
                <span style={{ color: highlighted ? 'rgba(255,255,255,0.9)' : colorVar('primary', '#0F62FE'), fontWeight: 700, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  },
})
