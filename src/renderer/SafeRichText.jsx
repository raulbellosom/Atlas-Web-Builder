import { useMemo } from 'react'
import DOMPurify from 'dompurify'

/**
 * Lazily-resolved DOMPurify instance. In the browser we use the default export
 * directly. Under Node (SSR, tests) DOMPurify requires a DOM; if no `window`
 * is present we skip sanitization and fall back to escaping the HTML entirely.
 *
 * @returns {{ sanitize: (html: string, cfg: object) => string } | null}
 */
function getPurifier() {
  if (typeof window === 'undefined' || !window.document) return null
  return DOMPurify
}

/** Allowed tags for editor-controlled rich text. Intentionally narrow. */
const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'u', 'a', 'br', 'p', 'ul', 'ol', 'li', 'span']

/** Allowed attributes — only `href`, `title`, `target`, `rel` on links. */
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel']

/**
 * Render sanitized HTML. The input is expected to come from a controlled
 * rich-text editor that already produces a narrow tag set; sanitization is a
 * defense-in-depth layer enforced at render time.
 *
 * If the host is rendering server-side (no `window`), the component falls back
 * to plain text — the host should hydrate to apply the sanitized HTML.
 *
 * @param {{ html: string, className?: string, as?: keyof JSX.IntrinsicElements }} props
 */
export function SafeRichText({ html, className, as: Tag = 'div' }) {
  const purifier = getPurifier()

  const clean = useMemo(() => {
    if (typeof html !== 'string' || html.length === 0) return ''
    if (!purifier) return null // SSR fallback
    return purifier.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      USE_PROFILES: { html: true },
      // Prevent javascript: URLs.
      FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
    })
  }, [html, purifier])

  if (clean === null) {
    // SSR: render the raw text content stripped of tags to avoid any HTML.
    const textOnly = String(html).replace(/<[^>]*>/g, '')
    return <Tag className={className}>{textOnly}</Tag>
  }
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}
