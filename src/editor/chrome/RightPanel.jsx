import { useState } from 'react'
import clsx from 'clsx'
import { es } from '../i18n/es.js'
import { PropertiesPanel } from './PropertiesPanel.jsx'
import { LayersPanel } from './LayersPanel.jsx'
import { ThemeTab } from './ThemeTab.jsx'
import { SeoPanel } from '../seo/SeoPanel.jsx'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Pública' },
  { value: 'draft', label: 'Borrador' },
  { value: 'private', label: 'Privada' },
]

function PageTab() {
  const page = useEditorStore((s) => s.page)
  const setPage = useEditorStore((s) => s.setPage)

  function updateMeta(partial) {
    setPage({ ...page, ...partial, updatedAt: new Date().toISOString() })
  }


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
        <p className="atlas-wb-page-meta__section-title">SEO</p>
        <SeoPanel />
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
