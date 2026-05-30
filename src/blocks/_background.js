/**
 * @file Background value resolver.
 *
 * Accepts either:
 *  - a string token key (legacy): `'primary'` → CSS var
 *  - an object: `{ kind: 'color' | 'gradient' | 'image', ... }`
 *
 * Returns a partial CSSProperties object to spread on the target element.
 *
 * Object shape:
 *  - color:    { kind:'color',    token?: 'primary', value?: '#hex' }
 *  - gradient: { kind:'gradient', from:'#hex', to:'#hex', angle?:135, fromToken?, toToken? }
 *  - image:    { kind:'image',    url:'https://...', size?:'cover'|'contain'|'auto',
 *                position?:'center', overlay?:'rgba(...)' }
 *
 * Safe: never inlines user-supplied URLs without scheme allow-listing.
 */

const SAFE_IMAGE_RE = /^(https?:|\/|data:image\/)/i

function safeUrl(u) {
  return typeof u === 'string' && SAFE_IMAGE_RE.test(u) ? u : ''
}

/**
 * @param {string|object|null|undefined} bg
 * @param {string} [fallback]
 * @returns {import('react').CSSProperties}
 */
export function resolveBackground(bg, fallback = 'transparent') {
  if (!bg) return { background: fallback }

  // Legacy: bare token key
  if (typeof bg === 'string') {
    return { background: `var(--atlas-color-${bg}, ${fallback})` }
  }

  if (typeof bg !== 'object') return { background: fallback }

  if (bg.kind === 'color') {
    if (bg.token) return { background: `var(--atlas-color-${bg.token}, ${fallback})` }
    if (bg.value) return { background: bg.value }
    return { background: fallback }
  }

  if (bg.kind === 'gradient') {
    const angle = Number.isFinite(bg.angle) ? bg.angle : 135
    const from = bg.fromToken ? `var(--atlas-color-${bg.fromToken})` : bg.from || '#0F62FE'
    const to = bg.toToken ? `var(--atlas-color-${bg.toToken})` : bg.to || '#F59E0B'
    return { background: `linear-gradient(${angle}deg, ${from}, ${to})` }
  }

  if (bg.kind === 'image') {
    const url = safeUrl(bg.url)
    if (!url) return { background: fallback }
    const layers = []
    if (bg.overlay) layers.push(`linear-gradient(${bg.overlay}, ${bg.overlay})`)
    layers.push(`url("${url}")`)
    return {
      backgroundImage: layers.join(', '),
      backgroundSize: bg.size || 'cover',
      backgroundPosition: bg.position || 'center',
      backgroundRepeat: 'no-repeat',
    }
  }

  return { background: fallback }
}

/** Build a CSS color string from a Background value (color/gradient only). */
export function resolveBackgroundCss(bg, fallback = 'transparent') {
  const style = resolveBackground(bg, fallback)
  return style.background || style.backgroundImage || fallback
}
