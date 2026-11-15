import { useState, useMemo, useCallback, useRef } from 'react'
import { Globe, GripVertical, LayoutTemplate, Lock, Pencil, X } from 'lucide-react'
import { IconButton } from '../ui/OverlayControls.jsx'
import { useDialogFocus, usePanelInert } from '../ui/EditorAppearance.jsx'
import { LayersPanel } from './LayersPanel.jsx'
import { onTabListKeyDown } from '../ui/keyboard.js'
import { useDraggable } from '@dnd-kit/core'
import clsx from 'clsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { es } from '../i18n/es.js'
import { BlockIcon } from './BlockIcon.jsx'
import { newId } from '../../utils/id.js'
import { CapabilityBoundary, useEditorCapabilities } from '../capabilities.jsx'
import { findParent } from '../../utils/tree.js'
import { MediaTab } from '../assets/MediaTab.jsx'

/** A single draggable palette item. On narrow screens a tap inserts directly. */
function PaletteItem({ def, onInserted }) {
  const insertBlock = useEditorStore(state => state.insertBlock)
  const activeRegion = useEditorStore(state => state.activeRegion)
  const page = useEditorStore(state => state.page)
  const selectedId = useEditorStore(state => state.selectedId)
  const { blocks: registry } = useBuilder()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `palette:${def.type}`, data: { source: 'palette', blockType: def.type, label: def.label || def.type, defaultProps: def.defaultProps },
  })
  return <div ref={setNodeRef} className={clsx('atlas-wb-palette__item', isDragging && 'atlas-wb-palette__item--dragging')}>
    <button type="button" className="atlas-wb-palette__insert" aria-label={`Insertar ${def.label || def.type}`}
      onClick={() => {
        let target = { regionName: activeRegion || 'main' }
        if (def.kind === 'element' && selectedId) {
          const selected = page.blocks[selectedId], selectedDef = selected && registry.get(selected.type)
          if (selectedDef?.slots?.children) target = { parentId: selectedId, slotName: 'children' }
          else {
            const location = findParent(page, selectedId)
            if (location?.kind === 'slot') target = { parentId: location.parentBlockId, slotName: location.slotName, index: location.index + 1 }
          }
        }
        insertBlock(def.type, def, target); onInserted?.()
      }}>
      <BlockIcon def={def} /><span className="atlas-wb-palette__name">{def.label || def.type}</span>
    </button>
    <button ref={setActivatorNodeRef} type="button" className="atlas-wb-drag-handle" {...attributes} {...listeners} aria-label={`Arrastrar ${def.label || def.type}`}><GripVertical /></button>
  </div>
}

const CATEGORY_LABELS = {
  elements: 'Elementos de diseño',
  navigation: 'Navegación',
  hero: 'Hero',
  layout: 'Diseño',
  content: 'Contenido',
  media: 'Multimedia',
  commerce: 'Comercio',
  forms: 'Formularios',
  general: 'General',
}

function BlocksTab({ onInserted }) {
  const { blocks } = useBuilder()
  const allDefs = blocks.list()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState(() => allDefs.some(def => def.kind === 'element') ? 'elements' : 'all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const hasElements = allDefs.some(def => def.kind === 'element')
    const isElement = def => def.kind === 'element' || (!hasElements && ['ButtonBlock','HeadingBlock','TextBlock','RichTextBlock','ImageBlock','SpacerBlock','DividerBlock'].includes(def.type))
    const definitions = allDefs.filter(def => kind === 'all' || (kind === 'elements' ? isElement(def) : !isElement(def)))
    if (!q) return definitions
    return definitions.filter(
      (d) =>
        (d.label || d.type).toLowerCase().includes(q) ||
        (d.category || '').toLowerCase().includes(q),
    )
  }, [allDefs, query, kind])

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
      <div className="atlas-wb-panel__tabs" role="group" aria-label="Catálogo de construcción">
        {[['all','Todos'],['elements','Elementos'],['sections','Secciones']].map(([value,label])=><button key={value} type="button" className={clsx('atlas-wb-panel__tab',kind===value&&'atlas-wb-panel__tab--active')} aria-pressed={kind===value} onClick={()=>setKind(value)}>{label}</button>)}
      </div>
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
            <div className="atlas-wb-palette__grid">
              {list.map((d) => (
                <PaletteItem key={d.type} def={d} onInserted={onInserted} />
              ))}
            </div>
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
    data: { source: 'template', templateId: tpl.id, label: tpl.label },
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
      <LayoutTemplate aria-hidden="true" />
      <span className="atlas-wb-palette__item-body">
        <span>{tpl.label}</span>
        {tpl.description ? (
          <span className="atlas-wb-palette__item-desc">{tpl.description}</span>
        ) : null}
      </span>
    </div>
  )
}

function TemplatesTab({ onInserted }) {
  const activeRegion = useEditorStore(state => state.activeRegion)
  const capabilities = useEditorCapabilities()
  const { templates } = useBuilder()
  const applyTemplate = useEditorStore((s) => s.applyTemplate)
  const list = templates && capabilities.templates !== false ? templates.list() : []
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
              onInsert={tpl => { applyTemplate(tpl, { regionName: activeRegion || 'main' }); onInserted?.() }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const VISIBILITY_BADGE = { public: Globe, draft: Pencil, private: Lock }

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
      visibility: 'public',
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
          {(() => { const Badge = VISIBILITY_BADGE[page.visibility] || Globe; return <Badge aria-hidden="true" /> })()}
        </span>
      </div>

      <p className="atlas-wb-empty" style={{ marginTop: 12, fontSize: 12 }}>
        La gestión multi-página completa (navegación entre páginas, duplicado) estará disponible próximamente. Por ahora puedes crear páginas nuevas desde este panel.
      </p>
    </div>
  )
}

export function LeftPanel({ onClose, closed, compact, activeTab: tab, onTabChange: setTab, returnFocusRef }) {
  const panelRef = useRef(null)
  const { assets } = useBuilder()
  usePanelInert(panelRef, closed)
  useDialogFocus(panelRef, onClose, compact && !closed, returnFocusRef)
  return (
    <aside ref={panelRef} tabIndex={-1} className="atlas-wb-panel atlas-wb-panel--left" aria-label={es.leftPanel.blocks}>
      <div className="atlas-wb-panel__heading"><strong>Biblioteca</strong><IconButton icon={X} onClick={onClose} label="Cerrar biblioteca" tooltip={false} /></div>
      <div className="atlas-wb-panel__tabs" role="tablist" aria-label="Biblioteca" onKeyDown={onTabListKeyDown} tabIndex={-1}>
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
        <button type="button" role="tab" aria-selected={tab === 'layers'} className={clsx('atlas-wb-panel__tab', tab === 'layers' && 'atlas-wb-panel__tab--active')} onClick={() => setTab('layers')}>Capas</button>
        {assets ? <button type="button" role="tab" aria-selected={tab === 'media'} className={clsx('atlas-wb-panel__tab', tab === 'media' && 'atlas-wb-panel__tab--active')} onClick={() => setTab('media')}>Medios</button> : null}
      </div>
      <div className="atlas-wb-panel__body">
        {tab === 'blocks'    && <BlocksTab onInserted={compact ? onClose : undefined} />}
        {tab === 'templates' && <CapabilityBoundary name="templates"><TemplatesTab onInserted={compact ? onClose : undefined} /></CapabilityBoundary>}
        {tab === 'layers' && <LayersPanel />}
        {tab === 'media' && assets && <MediaTab />}
        {tab === 'pages'     && <CapabilityBoundary name="pageCreation"><PagesTab /></CapabilityBoundary>}
      </div>
    </aside>
  )
}
