import { useState } from 'react'
import clsx from 'clsx'
import { es } from '../i18n/es.js'
import { PropertiesPanel } from './PropertiesPanel.jsx'
import { LayersPanel } from './LayersPanel.jsx'
import { ThemeTab } from './ThemeTab.jsx'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Pública' },
  { value: 'draft', label: 'Borrador' },
  { value: 'private', label: 'Privada' },
]

function PageTab() {
  const page = useEditorStore((s) => s.page)
  const setPage = useEditorStore((s) => s.setPage)
  const [seoOpen, setSeoOpen] = useState(true)

  function updateMeta(partial) {
    setPage({ ...page, ...partial, updatedAt: new Date().toISOString() })
  }
  function updateSeo(partial) {
    setPage({ ...page, seo: { ...(page.seo || {}), ...partial }, updatedAt: new Date().toISOString() })
  }

  const seo = page.seo || {}
  const seoTitle = seo.title || page.title || ''
  const seoDesc = seo.description || ''
  const canonical = seo.canonical || ''
  const previewUrl = page.slug ? page.slug : '/'

  return (
    <div className="atlas-wb-page-meta">
      {/* Basic info */}
      <div className="atlas-wb-page-meta__section">
        <p className="atlas-wb-page-meta__section-title">Información</p>
        <div className="atlas-wb-field">
          <span className="atlas-wb-field__label">Título de la página</span>
          <input
            className="atlas-wb-field__input"
            value={page.title || ''}
            onChange={(e) => updateMeta({ title: e.target.value })}
            placeholder="Mi página"
          />
        </div>
        <div className="atlas-wb-field">
          <span className="atlas-wb-field__label">Slug (URL)</span>
          <input
            className="atlas-wb-field__input"
            value={page.slug || ''}
            onChange={(e) => updateMeta({ slug: e.target.value })}
            placeholder="/mi-pagina"
          />
        </div>
        <div className="atlas-wb-field">
          <span className="atlas-wb-field__label">Visibilidad</span>
          <select
            className="atlas-wb-field__select"
            value={page.visibility || 'public'}
            onChange={(e) => updateMeta({ visibility: e.target.value })}
          >
            {VISIBILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SEO */}
      <div className="atlas-wb-page-meta__section">
        <button
          type="button"
          className="atlas-wb-props__section-header"
          style={{ margin: '0 -12px', width: 'calc(100% + 24px)' }}
          onClick={() => setSeoOpen((v) => !v)}
          aria-expanded={seoOpen}
        >
          <span>SEO</span>
          <span className={clsx('atlas-wb-props__section-chevron', seoOpen && 'atlas-wb-props__section-chevron--open')}>›</span>
        </button>

        {seoOpen ? (
          <div style={{ paddingTop: 8 }}>
            {/* SEO preview */}
            <div className="atlas-wb-seo-preview" style={{ marginBottom: 12 }}>
              <div className="atlas-wb-seo-preview__url">{previewUrl}</div>
              <div className="atlas-wb-seo-preview__title">{seoTitle || 'Título de la página'}</div>
              <div className="atlas-wb-seo-preview__desc">{seoDesc || 'Añade una descripción para que aparezca en los resultados de búsqueda.'}</div>
            </div>

            <div className="atlas-wb-field">
              <span className="atlas-wb-field__label">Título SEO</span>
              <input
                className="atlas-wb-field__input"
                value={seoTitle}
                onChange={(e) => updateSeo({ title: e.target.value })}
                placeholder={page.title || 'Título en buscadores'}
                maxLength={60}
              />
              <span style={{ fontSize: 11, color: 'var(--awb-muted)' }}>{seoTitle.length}/60</span>
            </div>
            <div className="atlas-wb-field">
              <span className="atlas-wb-field__label">Meta descripción</span>
              <textarea
                className="atlas-wb-field__textarea"
                value={seoDesc}
                onChange={(e) => updateSeo({ description: e.target.value })}
                placeholder="Descripción breve de la página para buscadores…"
                maxLength={160}
                style={{ minHeight: 60 }}
              />
              <span style={{ fontSize: 11, color: 'var(--awb-muted)' }}>{seoDesc.length}/160</span>
            </div>
            <div className="atlas-wb-field">
              <span className="atlas-wb-field__label">URL canónica (opcional)</span>
              <input
                className="atlas-wb-field__input"
                value={canonical}
                onChange={(e) => updateSeo({ canonical: e.target.value })}
                placeholder="https://ejemplo.com/pagina"
                type="url"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Page ID (readonly info) */}
      <div className="atlas-wb-page-meta__section">
        <p className="atlas-wb-page-meta__section-title">Info técnica</p>
        <div className="atlas-wb-field">
          <span className="atlas-wb-field__label">ID de página</span>
          <input className="atlas-wb-field__input" value={page.id || ''} readOnly style={{ fontFamily: 'monospace', fontSize: 11 }} />
        </div>
        <div className="atlas-wb-field">
          <span className="atlas-wb-field__label">Actualizado</span>
          <input className="atlas-wb-field__input" value={page.updatedAt ? new Date(page.updatedAt).toLocaleString() : ''} readOnly />
        </div>
        <div className="atlas-wb-field">
          <span className="atlas-wb-field__label">Bloques</span>
          <input className="atlas-wb-field__input" value={Object.keys(page.blocks || {}).length} readOnly />
        </div>
      </div>
    </div>
  )
}

export function RightPanel() {
  const [tab, setTab] = useState('properties')
  return (
    <aside className="atlas-wb-panel atlas-wb-panel--right" aria-label={es.rightPanel.properties}>
      <div className="atlas-wb-panel__tabs" role="tablist">
        {[
          ['properties', es.rightPanel.properties],
          ['layers', 'Capas'],
          ['theme', es.rightPanel.theme],
          ['page', 'Página'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={clsx('atlas-wb-panel__tab', tab === id && 'atlas-wb-panel__tab--active')}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="atlas-wb-panel__body">
        {tab === 'properties' && <PropertiesPanel />}
        {tab === 'layers'     && <LayersPanel />}
        {tab === 'theme'      && <ThemeTab />}
        {tab === 'page'       && <PageTab />}
      </div>
    </aside>
  )
}
