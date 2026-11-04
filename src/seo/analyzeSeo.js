/**
 * @file Page SEO checklist (Spanish messages).
 */
import { resolveSeo, normalizeRobots } from './content.js'
import { resolveOgImage, TITLE_MAX, DESCRIPTION_MAX } from './buildSeoMeta.js'

/**
 * @param {import('../schema/page.js').Page} page
 * @param {import('../schema/site.js').Site} [site]
 * @returns {Array<{level:'error'|'warn'|'ok', code:string, message:string}>}
 */
export function analyzeSeo(page, site) {
  const out = []
  const push = (level, code, message) => out.push({ level, code, message })
  const { title, description, content } = resolveSeo(page, site)
  const def = site?.settings?.defaultSeo || {}

  if (!title) push('error', 'title-missing', 'Falta el título SEO.')
  else if (title.length > TITLE_MAX) push('warn', 'title-long', `El título tiene ${title.length} caracteres; lo ideal es ${TITLE_MAX} o menos.`)
  else if (title.length < 30) push('warn', 'title-short', `El título es corto (${title.length}); apunta a 30-${TITLE_MAX} caracteres.`)
  else push('ok', 'title-ok', 'La longitud del título es adecuada.')

  if (!description) push('error', 'description-missing', 'Falta la meta descripción.')
  else if (description.length > DESCRIPTION_MAX) push('warn', 'description-long', `La descripción tiene ${description.length} caracteres; lo ideal es ${DESCRIPTION_MAX} o menos.`)
  else if (description.length < 70) push('warn', 'description-short', `La descripción es corta (${description.length}); apunta a 70-${DESCRIPTION_MAX} caracteres.`)
  else push('ok', 'description-ok', 'La longitud de la descripción es adecuada.')

  // Duplicate: same text as the site default (typed or inherited).
  const siteDesc = String(def.description || '').trim()
  if (description && siteDesc && description === siteDesc) {
    push('warn', 'description-duplicate', 'La descripción es igual a la del sitio; escribe una propia para esta página.')
  }

  const h1s = content.headings.filter((h) => h.level === 1).length
  if (h1s === 0) push('error', 'h1-missing', 'La página no tiene un encabezado H1.')
  else if (h1s > 1) push('warn', 'h1-multiple', `Hay ${h1s} encabezados H1; usa solo uno por página.`)
  else push('ok', 'h1-ok', 'La página tiene un único H1.')

  const hs = content.headings
  if (hs.some((h, i) => i > 0 && h.level - hs[i - 1].level > 1)) {
    push('warn', 'heading-order', 'El orden de los encabezados salta niveles (por ejemplo de H2 a H4).')
  }

  const noAlt = content.images.filter((i) => i.src && !i.alt.trim()).length
  if (noAlt) push('warn', 'img-alt-missing', `${noAlt} imagen(es) sin texto alternativo.`)

  if (!resolveOgImage(page?.seo) && !resolveOgImage(def) && !page?.seo?.ogImageAssetId) {
    push('warn', 'og-image-missing', 'No hay imagen para compartir en redes sociales.')
  } else push('ok', 'og-image-ok', 'Hay imagen para redes sociales.')

  if (!normalizeRobots(page?.seo?.robots, page?.visibility).index) {
    push('warn', 'noindex', 'La página está marcada como noindex: no aparecerá en buscadores.')
  }
  return out
}
