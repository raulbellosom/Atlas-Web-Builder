import { useState, useMemo, useCallback, useRef } from 'react'
import { Files, Globe, GripVertical, Images, Layers, LayoutTemplate, Lock, Pencil, Shapes, X } from 'lucide-react'
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
import { CompositionsPanel } from './CompositionsPanel.jsx'

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

function HostPagesTab({ pages, onSelected }) {
  return <div className="atlas-wb-pages">
    <div className="atlas-wb-pages__header"><h3>Páginas</h3></div>
    <nav aria-label="Páginas del sitio">
      {pages.items.map(page => <button type="button" key={page.path}
        className={clsx('atlas-wb-page-item', page.path === pages.activePath && 'atlas-wb-page-item--active')}
        aria-current={page.path === pages.activePath ? 'page' : undefined}
        onClick={() => { if (page.path !== pages.activePath) { pages.onSelect(page.path); onSelected?.() } }}>
        <span style={{ flex: 1, minWidth: 0, textAlign: 'start' }}>
          <span className="atlas-wb-page-item__title" style={{ display: 'block' }}>{page.title}</span>
          <span className="atlas-wb-page-item__slug" style={{ display: 'block' }}>{page.path}</span>
        </span>
      </button>)}
    </nav>
    <p className="atlas-wb-empty">Puedes crear páginas desde el menú de páginas del sitio.</p>
  </div>
}

export function LeftPanel({ onClose, closed, compact, activeTab: tab, onTabChange: setTab, returnFocusRef }) {
  const panelRef = useRef(null)
  const { assets, compositions, pages } = useBuilder()
  const capabilities = useEditorCapabilities()
  usePanelInert(panelRef, closed)
  useDialogFocus(panelRef, onClose, compact && !closed, returnFocusRef)
  return (
    <aside ref={panelRef} tabIndex={-1} className="atlas-wb-panel atlas-wb-panel--left" aria-label={es.leftPanel.blocks}>
      <div className="atlas-wb-panel__heading"><strong>Biblioteca</strong><IconButton icon={X} onClick={onClose} label="Cerrar biblioteca" tooltip={false} /></div>
      {/* Icon over a short label: five text tabs do not fit the panel width. */}
      <div className="atlas-wb-panel__tabs atlas-wb-panel__tabs--stacked" role="tablist" aria-label="Biblioteca" onKeyDown={onTabListKeyDown} tabIndex={-1}>
        {[
          ['blocks', es.leftPanel.blocks, Shapes],
          ...(capabilities.templates !== false ? [['templates', es.leftPanel.templates, LayoutTemplate]] : []),
          ...(compositions ? [['compositions', 'Mis bloques', Shapes]] : []),
          ['pages', es.leftPanel.pages, Files],
          ['layers', 'Capas', Layers],
          ...(assets ? [['media', 'Medios', Images]] : []),
        ].map(([id, label, Icon]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={clsx('atlas-wb-panel__tab', tab === id && 'atlas-wb-panel__tab--active')} onClick={() => setTab(id)}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="atlas-wb-panel__body">
        {tab === 'blocks'    && <BlocksTab onInserted={compact ? onClose : undefined} />}
        {tab === 'templates' && <CapabilityBoundary name="templates"><TemplatesTab onInserted={compact ? onClose : undefined} /></CapabilityBoundary>}
        {tab === 'compositions' && compositions && <CompositionsPanel onInserted={compact ? onClose : undefined} />}
        {tab === 'layers' && <LayersPanel />}
        {tab === 'media' && assets && <MediaTab />}
        {tab === 'pages' && (pages ? <HostPagesTab pages={pages} onSelected={compact ? onClose : undefined} /> : <CapabilityBoundary name="pageCreation"><PagesTab /></CapabilityBoundary>)}
      </div>
    </aside>
  )
}
