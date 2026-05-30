import { useState, useMemo, useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'
import clsx from 'clsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { es } from '../i18n/es.js'
import { BlockIcon } from './BlockIcon.jsx'
import { newId } from '../../utils/id.js'

/** A single draggable palette item. On narrow screens a tap inserts directly. */
function PaletteItem({ def, onInserted }) {
  const insertBlock = useEditorStore((s) => s.insertBlock)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${def.type}`,
    data: { source: 'palette', blockType: def.type, defaultProps: def.defaultProps },
  })

  function handleClick() {
    // On desktop use drag; on narrow screens a tap inserts at end of 'main'.
    if (typeof window !== 'undefined' && window.innerWidth > 960) return
    insertBlock(def.type, def, { regionName: 'main' })
    onInserted?.()
  }

  return (
    <div
      ref={setNodeRef}
      className={clsx('atlas-wb-palette__item', isDragging && 'atlas-wb-palette__item--dragging')}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
      }}
      {...attributes}
      {...listeners}
      aria-label={`Insertar ${def.label || def.type}`}
    >
      <BlockIcon def={def} />
      <span>{def.label || def.type}</span>
    </div>
  )
}

const CATEGORY_LABELS = {
  navigation: 'Navegación',
  hero: 'Hero',
  layout: 'Diseño',
  content: 'Contenido',
  media: 'Multimedia',
  general: 'General',
}

function BlocksTab({ onInserted }) {
  const { blocks } = useBuilder()
  const [query, setQuery] = useState('')
  const allDefs = blocks.list()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allDefs
    return allDefs.filter(
      (d) =>
        (d.label || d.type).toLowerCase().includes(q) ||
        (d.category || '').toLowerCase().includes(q),
    )
  }, [allDefs, query])

  if (!allDefs.length) {
    return <p className="atlas-wb-empty">No hay bloques registrados.</p>
  }

  const groups = filtered.reduce((acc, d) => {
    const cat = d.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(d)
    return acc
  }, {})

  return (
    <div className="atlas-wb-palette">
      <input
        type="search"
        className="atlas-wb-palette__search"
        placeholder="Buscar bloque…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar bloque"
      />
      {filtered.length === 0 ? (
        <p className="atlas-wb-empty">Sin resultados para &ldquo;{query}&rdquo;.</p>
      ) : (
        Object.entries(groups).map(([cat, list]) => (
          <div key={cat}>
            <div className="atlas-wb-palette__group-title">
              {CATEGORY_LABELS[cat] || cat}
            </div>
            {list.map((d) => (
              <PaletteItem key={d.type} def={d} onInserted={onInserted} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}

/** A single template entry: draggable + clickable. */
function TemplateItem({ tpl, onInsert }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template:${tpl.id}`,
    data: { source: 'template', templateId: tpl.id },
  })
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'atlas-wb-palette__item',
        'atlas-wb-palette__item--template',
        isDragging && 'atlas-wb-palette__item--dragging',
      )}
      role="button"
      tabIndex={0}
      onClick={() => onInsert(tpl)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onInsert(tpl)
        }
      }}
      aria-label={`${es.leftPanel.insertTemplate}: ${tpl.label}`}
      title={es.leftPanel.insertTemplate}
      {...attributes}
      {...listeners}
    >
      <span aria-hidden="true">▤</span>
      <span className="atlas-wb-palette__item-body">
        <span>{tpl.label}</span>
        {tpl.description ? (
          <span className="atlas-wb-palette__item-desc">{tpl.description}</span>
        ) : null}
      </span>
    </div>
  )
}

function TemplatesTab() {
  const { templates } = useBuilder()
  const applyTemplate = useEditorStore((s) => s.applyTemplate)
  const list = templates ? templates.list() : []
  if (!list.length) {
    return <p className="atlas-wb-empty">{es.leftPanel.emptyTemplates}</p>
  }
  const groups = list.reduce((acc, t) => {
    const cat = t.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})
  return (
    <div className="atlas-wb-palette">
      <p className="atlas-wb-empty" style={{ marginBottom: 8 }}>
        {es.leftPanel.dragHint}
      </p>
      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat}>
          <div className="atlas-wb-palette__group-title">{cat}</div>
          {items.map((t) => (
            <TemplateItem
              key={t.id}
              tpl={t}
              onInsert={(tpl) => applyTemplate(tpl, { regionName: 'main' })}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const VISIBILITY_BADGE = { public: '🌐', draft: '✏️', private: '🔒' }

function PagesTab() {
  const page = useEditorStore((s) => s.page)
  const setPage = useEditorStore((s) => s.setPage)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleCreatePage = useCallback(() => {
    if (!newTitle.trim()) return
    const slug = '/' + newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const newPage = {
      schemaVersion: 1,
      id: newId('page'),
      slug,
      title: newTitle.trim(),
      visibility: 'draft',
      layoutId: null,
      regions: { main: { id: newId('region'), children: [] } },
      blocks: {},
      seo: { title: '', description: '', canonical: null, ogImageAssetId: null },
      updatedAt: new Date().toISOString(),
    }
    setPage(newPage)
    setCreating(false)
    setNewTitle('')
  }, [newTitle, setPage])

  return (
    <div className="atlas-wb-pages">
      <div className="atlas-wb-pages__header">
        <h3>Páginas</h3>
        <button
          type="button"
          className="atlas-wb-btn atlas-wb-btn--primary"
          style={{ fontSize: 12, padding: '4px 10px' }}
          onClick={() => setCreating((v) => !v)}
        >
          {creating ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {creating ? (
        <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            className="atlas-wb-field__input"
            placeholder="Título de la nueva página"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePage() }}
            /* eslint-disable-next-line jsx-a11y/no-autofocus */
            autoFocus
          />
          <button
            type="button"
            className="atlas-wb-btn atlas-wb-btn--primary"
            onClick={handleCreatePage}
            disabled={!newTitle.trim()}
          >
            Crear página
          </button>
        </div>
      ) : null}

      {/* Current page */}
      <div className="atlas-wb-page-item atlas-wb-page-item--active">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="atlas-wb-page-item__title">{page.title || 'Sin título'}</div>
          <div className="atlas-wb-page-item__slug">{page.slug || '/'}</div>
        </div>
        <span title={page.visibility} style={{ fontSize: 13 }}>
          {VISIBILITY_BADGE[page.visibility] || '🌐'}
        </span>
      </div>

      <p className="atlas-wb-empty" style={{ marginTop: 12, fontSize: 12 }}>
        La gestión multi-página completa (navegación entre páginas, duplicado) estará disponible próximamente. Por ahora puedes crear páginas nuevas desde este panel.
      </p>
    </div>
  )
}

export function LeftPanel({ onClose }) {
  const [tab, setTab] = useState('blocks')
  return (
    <aside className="atlas-wb-panel atlas-wb-panel--left" aria-label={es.leftPanel.blocks}>
      <div className="atlas-wb-panel__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'blocks'}
          className={clsx('atlas-wb-panel__tab', tab === 'blocks' && 'atlas-wb-panel__tab--active')}
          onClick={() => setTab('blocks')}
        >
          {es.leftPanel.blocks}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'templates'}
          className={clsx(
            'atlas-wb-panel__tab',
            tab === 'templates' && 'atlas-wb-panel__tab--active',
          )}
          onClick={() => setTab('templates')}
        >
          {es.leftPanel.templates}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pages'}
          className={clsx('atlas-wb-panel__tab', tab === 'pages' && 'atlas-wb-panel__tab--active')}
          onClick={() => setTab('pages')}
        >
          {es.leftPanel.pages}
        </button>
      </div>
      <div className="atlas-wb-panel__body">
        {tab === 'blocks'    && <BlocksTab onInserted={onClose} />}
        {tab === 'templates' && <TemplatesTab />}
        {tab === 'pages'     && <PagesTab />}
      </div>
    </aside>
  )
}
