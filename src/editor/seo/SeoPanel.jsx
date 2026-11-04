import { useMemo } from 'react'
import clsx from 'clsx'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { useSeoContext } from './SeoContext.js'
import { buildSeoMeta, resolveOgImage, TITLE_MAX, DESCRIPTION_MAX } from '../../seo/buildSeoMeta.js'
import { analyzeSeo } from '../../seo/analyzeSeo.js'
import { STRUCTURED_DATA_TYPES } from '../../seo/jsonld.js'

const OG_TYPES = ['website', 'article', 'product', 'profile']

// Simple fields per structured-data preset; list presets use `items`.
const SD_FIELDS = {
  Organization: [['name', 'Nombre'], ['url', 'URL'], ['logo', 'Logo (URL)'], ['sameAs', 'Redes (URLs separadas por coma)']],
  LocalBusiness: [['name', 'Nombre'], ['url', 'URL'], ['image', 'Imagen (URL)'], ['telephone', 'Teléfono'], ['address', 'Dirección'], ['priceRange', 'Rango de precios']],
  WebSite: [['name', 'Nombre'], ['url', 'URL']],
  Article: [['headline', 'Titular'], ['author', 'Autor'], ['datePublished', 'Fecha (AAAA-MM-DD)'], ['image', 'Imagen (URL)']],
  Product: [['name', 'Nombre'], ['description', 'Descripción'], ['image', 'Imagen (URL)'], ['sku', 'SKU'], ['price', 'Precio'], ['priceCurrency', 'Moneda (MXN)']],
  FAQPage: [],
  BreadcrumbList: [],
}
const SD_LABELS = {
  Organization: 'Organización', LocalBusiness: 'Negocio local', WebSite: 'Sitio web', Article: 'Artículo',
  Product: 'Producto', FAQPage: 'Preguntas frecuentes', BreadcrumbList: 'Migas de pan',
}
const ITEM_FIELDS = {
  FAQPage: [['question', 'Pregunta'], ['answer', 'Respuesta']],
  BreadcrumbList: [['name', 'Nombre'], ['url', 'URL']],
}

function Counter({ value, max }) {
  const n = (value || '').length
  return <span className={clsx('atlas-wb-seo-counter', n > max && 'atlas-wb-seo-counter--over')}>{n}/{max}</span>
}

function Text({ label, value, onChange, placeholder, multiline, counter }) {
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <Tag
        className={multiline ? 'atlas-wb-field__textarea' : 'atlas-wb-field__input'}
        value={value || ''}
        placeholder={placeholder}
        style={multiline ? { minHeight: 60 } : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {counter ? <Counter value={value} max={counter} /> : null}
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <select className="atlas-wb-field__select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

function StructuredEntry({ entry, onChange, onRemove }) {
  const fields = SD_FIELDS[entry.type] || []
  const itemFields = ITEM_FIELDS[entry.type]
  const items = Array.isArray(entry.items) ? entry.items : []
  const setItem = (i, key, v) => onChange({ ...entry, items: items.map((it, n) => (n === i ? { ...it, [key]: v } : it)) })
  return (
    <div className="atlas-wb-seo-sd">
      <div className="atlas-wb-seo-sd__head">
        <strong>{SD_LABELS[entry.type] || entry.type}</strong>
        <button type="button" className="atlas-wb-seo-link" onClick={onRemove}>Quitar</button>
      </div>
      {fields.map(([key, label]) => (
        <Text key={key} label={label} value={entry[key]} onChange={(v) => onChange({ ...entry, [key]: v })} />
      ))}
      {itemFields ? (
        <>
          {items.map((it, i) => (
            <div key={i} className="atlas-wb-seo-sd__item">
              {itemFields.map(([key, label]) => (
                <Text key={key} label={label} value={it[key]} onChange={(v) => setItem(i, key, v)} />
              ))}
              <button type="button" className="atlas-wb-seo-link" onClick={() => onChange({ ...entry, items: items.filter((_, n) => n !== i) })}>Quitar elemento</button>
            </div>
          ))}
          <button type="button" className="atlas-wb-seo-link" onClick={() => onChange({ ...entry, items: [...items, {}] })}>+ Añadir elemento</button>
        </>
      ) : null}
    </div>
  )
}

/**
 * SEO editor for the current page: fields, Google + social previews and the checklist.
 *
 * @param {{ site?: import('../../schema/site.js').Site, baseUrl?: string }} props
 */
export function SeoPanel(props) {
  const context = useSeoContext()
  const site = props.site ?? context.site
  const baseUrl = props.baseUrl ?? context.baseUrl ?? ''
  const page = useEditorStore((s) => s.page)
  const setPage = useEditorStore((s) => s.setPage)
  const seo = page.seo || {}

  function update(partial) {
    setPage({ ...page, seo: { ...seo, ...partial }, updatedAt: new Date().toISOString() })
  }

  const built = useMemo(() => buildSeoMeta(page, site, { baseUrl }), [page, site, baseUrl])
  const checks = useMemo(() => analyzeSeo(page, site), [page, site])
  const get = (k, v) => built.meta.find((m) => m[k] === v)?.content || ''
  const ogImage = get('property', 'og:image')
  const domain = (() => { try { return new URL(baseUrl).host } catch { return 'ejemplo.com' } })()
  const robots = typeof seo.robots === 'string'
    ? { index: !/noindex/i.test(seo.robots), follow: !/nofollow/i.test(seo.robots) }
    : { index: seo.robots?.index !== false, follow: seo.robots?.follow !== false }
  const sd = Array.isArray(seo.structuredData) ? seo.structuredData : []
  const card = get('name', 'twitter:card')
  const ogImageUrl = typeof seo.ogImage === 'string' ? seo.ogImage : (resolveOgImage(seo) || '')

  return (
    <div className="atlas-wb-seo">
      <div className="atlas-wb-seo-preview">
        <div className="atlas-wb-seo-preview__url">{domain}{page.slug || '/'}</div>
        <div className="atlas-wb-seo-preview__title">{built.title || 'Título de la página'}</div>
        <div className="atlas-wb-seo-preview__desc">{get('name', 'description') || 'Añade una descripción para que aparezca en los resultados de búsqueda.'}</div>
      </div>

      <Text label="Título SEO" value={seo.title} onChange={(v) => update({ title: v })} placeholder={page.title || 'Título en buscadores'} counter={TITLE_MAX} />
      <Text label="Meta descripción" multiline value={seo.description} onChange={(v) => update({ description: v })} placeholder="Descripción breve de la página para buscadores…" counter={DESCRIPTION_MAX} />
      <Text label="URL canónica (opcional)" value={seo.canonical} onChange={(v) => update({ canonical: v })} placeholder="https://ejemplo.com/pagina" />
      <Text label="Palabras clave (opcional, separadas por coma)" value={Array.isArray(seo.keywords) ? seo.keywords.join(', ') : seo.keywords} onChange={(v) => update({ keywords: v })} />

      <label className="atlas-wb-seo-check">
        <input type="checkbox" checked={!robots.index} onChange={(e) => update({ robots: { ...robots, index: !e.target.checked } })} />
        <span>Ocultar de buscadores (noindex)</span>
      </label>
      <label className="atlas-wb-seo-check">
        <input type="checkbox" checked={!robots.follow} onChange={(e) => update({ robots: { ...robots, follow: !e.target.checked } })} />
        <span>No seguir enlaces (nofollow)</span>
      </label>

      <p className="atlas-wb-page-meta__section-title">Redes sociales</p>
      <div className={clsx('atlas-wb-seo-card', card === 'summary' && 'atlas-wb-seo-card--small')}>
        {ogImage ? <img className="atlas-wb-seo-card__img" src={ogImage} alt="" /> : <div className="atlas-wb-seo-card__img atlas-wb-seo-card__img--empty">Sin imagen</div>}
        <div className="atlas-wb-seo-card__body">
          <div className="atlas-wb-seo-card__domain">{domain}</div>
          <div className="atlas-wb-seo-card__title">{get('property', 'og:title') || 'Título'}</div>
          <div className="atlas-wb-seo-card__desc">{get('property', 'og:description')}</div>
        </div>
      </div>
      <Text label="Título al compartir" value={seo.ogTitle} onChange={(v) => update({ ogTitle: v })} placeholder={built.title} />
      <Text label="Descripción al compartir" multiline value={seo.ogDescription} onChange={(v) => update({ ogDescription: v })} placeholder={get('name', 'description')} />
      <Text label="Imagen al compartir (URL)" value={ogImageUrl} onChange={(v) => update({ ogImage: v })} placeholder="https://ejemplo.com/imagen.jpg" />
      <Select label="Tipo de contenido" value={seo.ogType || 'website'} onChange={(v) => update({ ogType: v })} options={OG_TYPES.map((t) => [t, t])} />
      <Select
        label="Tarjeta de Twitter / X"
        value={seo.twitterCard || ''}
        onChange={(v) => update({ twitterCard: v || undefined })}
        options={[['', 'Automática'], ['summary', 'Resumen'], ['summary_large_image', 'Resumen con imagen grande']]}
      />

      <p className="atlas-wb-page-meta__section-title">Datos estructurados</p>
      {sd.map((entry, i) => (
        <StructuredEntry
          key={i}
          entry={entry}
          onChange={(next) => update({ structuredData: sd.map((e, n) => (n === i ? next : e)) })}
          onRemove={() => update({ structuredData: sd.filter((_, n) => n !== i) })}
        />
      ))}
      <Select
        label="Añadir"
        value=""
        onChange={(t) => t && update({ structuredData: [...sd, { type: t }] })}
        options={[['', 'Elegir tipo…'], ...STRUCTURED_DATA_TYPES.map((t) => [t, SD_LABELS[t]])]}
      />

      <p className="atlas-wb-page-meta__section-title">Revisión</p>
      <ul className="atlas-wb-seo-checks">
        {checks.map((c) => (
          <li key={c.code} className={`atlas-wb-seo-checks__item atlas-wb-seo-checks__item--${c.level}`}>{c.message}</li>
        ))}
      </ul>
    </div>
  )
}
