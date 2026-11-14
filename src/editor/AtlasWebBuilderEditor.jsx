import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SeoContext } from './seo/SeoContext.js'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { useBuilder } from '../provider/BuilderContext.js'
import {
  EditorStoreProvider,
  useEditorStore,
  useEditorStoreInstance,
  useTemporal,
} from './store/EditorStoreProvider.jsx'
import { TopBar } from './chrome/TopBar.jsx'
import { LeftPanel } from './chrome/LeftPanel.jsx'
import { RightPanel } from './chrome/RightPanel.jsx'
import { Canvas } from './chrome/Canvas.jsx'
import { Breadcrumb } from './chrome/Breadcrumb.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { NotificationsProvider } from './notifications/NotificationsProvider.jsx'
import { NotificationCenter } from './notifications/NotificationCenter.jsx'
import { ThemeProvider } from '../theme/ThemeProvider.jsx'
import { createLinkGuard } from './linkGuard.js'
import { assertEditorCapabilities, EditorCapabilitiesContext } from './capabilities.jsx'
import { EditorAppearanceProvider, EditorPortal, useEditorAppearance } from './ui/EditorAppearance.jsx'
import { useWorkspaceLayout } from './ui/useWorkspaceLayout.js'
import { MobileTools } from './chrome/MobileTools.jsx'
import { editorCollisionDetection } from './dnd/collision.js'
import { editorDndAccessibility } from './dnd/accessibility.js'

const unrestrictedCapabilities = Object.freeze({})

/**
 * Inner shell — assumes BuilderProvider + EditorStoreProvider are mounted above.
 */
function EditorShell({ onSaveDraft, onPublish, onLinkClick, brandLogo, brandName }) {
  const { scopeRef } = useEditorAppearance()
  const { compact, phone } = useWorkspaceLayout()
  const { blocks: registry, templates: templateRegistry } = useBuilder()
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, scrollBehavior: 'auto' }),
  )

  const store = useEditorStoreInstance()
  const page = useEditorStore((s) => s.page)
  const storeTheme = useEditorStore((s) => s.theme)
  const insertBlock = useEditorStore((s) => s.insertBlock)
  const moveBlockTo = useEditorStore((s) => s.moveBlockTo)
  const removeBlock = useEditorStore((s) => s.removeBlock)
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock)
  const applyTemplateAction = useEditorStore((s) => s.applyTemplate)

  const undo = useTemporal((s) => s.undo)
  const redo = useTemporal((s) => s.redo)

  const guardPreviewLinks = useMemo(() => createLinkGuard(onLinkClick), [onLinkClick])
  const [previewActive, setPreviewActive] = useState(false)
  const [dragLabel, setDragLabel] = useState(null)
  // leftClosed / rightClosed: false = panel visible, true = panel hidden.
  // On mobile (≤960px) panels default to closed; CSS turns them into overlays.
  const isMobile = compact
  const [leftClosed, setLeftClosed] = useState(isMobile)
  const [rightClosed, setRightClosed] = useState(isMobile)
  const [leftTab, setLeftTab] = useState('blocks')
  const [rightTab, setRightTab] = useState('properties')
  const panelInvoker = useRef(null)

  // Keep panel state in sync with the CSS mobile breakpoint (960px) as the
  // window is resized after mount. Without this, resizing from desktop to
  // mobile leaves both panels "open" in JS while CSS turns them into
  // fixed-position overlays — the two overlays end up wider than the
  // viewport and cover the canvas entirely.
  useEffect(() => {
    setLeftClosed(compact)
    setRightClosed(compact)
  }, [compact])

  useEffect(() => {
    if ((scopeRef.current?.getBoundingClientRect().width || window.innerWidth) <= 600) store.getState().setDevice('mobile')
  }, [scopeRef, store])

  function toggleLeft(tab, event) {
    if (event?.currentTarget) panelInvoker.current = event.currentTarget
    setLeftClosed(closed => !closed && leftTab === tab)
    setLeftTab(tab)
    if (compact) setRightClosed(true)
  }
  function toggleRight(event) {
    if (event?.currentTarget) panelInvoker.current = event.currentTarget
    setRightClosed(closed => !closed)
    if (compact) setLeftClosed(true)
  }

  // ----- Keyboard shortcuts ------------------------------------------------
  useEffect(() => {
    function onKey(e) {
      if (e.defaultPrevented || e.target?.closest?.('[role="dialog"], [role="menu"]')) return
      const target = e.target
      const tag = target && target.tagName
      const isFormField =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (target && target.isContentEditable)

      const meta = e.ctrlKey || e.metaKey
      if (meta && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (
        meta &&
        (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))
      ) {
        e.preventDefault()
        redo()
        return
      }
      if (isFormField) return
      const currentId = store.getState().selectedId
      if (!currentId) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeBlock(currentId)
      } else if (meta && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        duplicateBlock(currentId)
      }
    }
    const scope = scopeRef.current
    scope?.addEventListener('keydown', onKey)
    return () => scope?.removeEventListener('keydown', onKey)
  }, [undo, redo, store, removeBlock, duplicateBlock, scopeRef])

  // ----- DnD handlers ------------------------------------------------------
  const handleDragStart = useCallback(
    (event) => {
      const data = event.active.data.current
      if (!data) return
      if (data.source === 'palette') {
        const def = registry.get(data.blockType)
        setDragLabel((def && def.label) || data.blockType)
      } else if (data.source === 'template') {
        const tpl = templateRegistry && templateRegistry.get(data.templateId)
        setDragLabel((tpl && tpl.label) || data.templateId)
      } else if (data.source === 'block') {
        const block = page.blocks[data.blockId]
        setDragLabel(block ? block.type : 'Bloque')
      }
    },
    [registry, templateRegistry, page],
  )

  /**
   * Resolve the drop target (container + index) from the dnd-kit `over`
   * payload. Returns either `{regionName, index}` or
   * `{parentId, slotName, index}`. `index === undefined` means "append".
   */
  const resolveTarget = useCallback(
    (overData, overId) => {
      if (!overData) return null
      if (overData.source === 'region') {
        return { regionName: overData.regionName }
      }
      if (overData.source === 'slot') {
        return { parentId: overData.parentId, slotName: overData.slotName }
      }
      if (overData.source === 'block') {
        // Hovering another block: drop into the same container, just before it.
        const { parentId, slotName, regionName, blockId } = overData
        if (regionName) {
          const region = page.regions[regionName]
          if (!region) return null
          const idx = region.children.indexOf(blockId)
          return { regionName, index: idx >= 0 ? idx : undefined }
        }
        if (parentId && slotName) {
          const parent = page.blocks[parentId]
          const arr = parent && parent.children ? parent.children[slotName] || [] : []
          const idx = arr.indexOf(blockId)
          return { parentId, slotName, index: idx >= 0 ? idx : undefined }
        }
      }
      // Fallback: dnd-kit gives a droppable id like 'region:main' or
      // 'slot:parent:slotName'.
      if (typeof overId === 'string') {
        if (overId.startsWith('region:')) {
          return { regionName: overId.slice('region:'.length) }
        }
        if (overId.startsWith('slot:')) {
          const rest = overId.slice('slot:'.length)
          const sep = rest.indexOf(':')
          if (sep > 0) {
            return { parentId: rest.slice(0, sep), slotName: rest.slice(sep + 1) }
          }
        }
      }
      return null
    },
    [page],
  )

  const handleDragEnd = useCallback(
    (event) => {
      setDragLabel(null)
      const { active, over } = event
      if (!over) return
      const activeData = active.data.current
      const overData = over.data.current
      if (!activeData) return

      // Palette → Canvas
      if (activeData.source === 'palette') {
        const def = registry.get(activeData.blockType)
        if (!def) return
        const target = resolveTarget(overData, over.id) || { regionName: 'main' }
        insertBlock(activeData.blockType, def, target)
        return
      }

      // Template → Canvas
      if (activeData.source === 'template') {
        const tpl = templateRegistry && templateRegistry.get(activeData.templateId)
        if (!tpl) return
        const target = resolveTarget(overData, over.id) || { regionName: 'main' }
        applyTemplateAction(tpl, target)
        return
      }

      // Existing block → new position (region or slot)
      if (activeData.source === 'block') {
        if (active.id === over.id) return
        const target = resolveTarget(overData, over.id)
        if (!target) return
        const sameContainer = target.regionName ? target.regionName === activeData.regionName : target.parentId === activeData.parentId && target.slotName === activeData.slotName
        const siblings = activeData.regionName ? page.regions[activeData.regionName]?.children : page.blocks[activeData.parentId]?.children?.[activeData.slotName]
        if (sameContainer && target.index > siblings?.indexOf(activeData.blockId)) target.index += 1
        moveBlockTo(activeData.blockId, target)
      }
    },
    [registry, templateRegistry, insertBlock, moveBlockTo, applyTemplateAction, resolveTarget, page],
  )

  // ----- Preview mode bypasses chrome --------------------------------------
  if (previewActive) {
    return (
      <ThemeProvider
        theme={storeTheme}
        as="div"
        className="atlas-wb-editor atlas-wb-editor--preview"
        data-compact={compact ? '' : undefined}
        data-phone={phone ? '' : undefined}
      >
        <TopBar
          onSaveDraft={onSaveDraft}
          onPublish={onPublish}
          onTogglePreview={() => setPreviewActive(false)}
          previewActive={previewActive}
          compact={compact}
          brandLogo={brandLogo}
          brandName={brandName}
        />
        <div className="atlas-wb-preview" onClickCapture={guardPreviewLinks}>
          <div className="atlas-wb-preview__themed">
            <AtlasWebRenderer page={page} mode="preview" />
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={editorDndAccessibility}
      collisionDetection={editorCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragLabel(null)}
    >
      <ThemeProvider
        theme={storeTheme}
        as="div"
        className="atlas-wb-editor"
        data-compact={compact ? '' : undefined}
        data-phone={phone ? '' : undefined}
        data-left-closed={leftClosed ? '' : undefined}
        data-right-closed={rightClosed ? '' : undefined}
      >
        <TopBar
          onSaveDraft={onSaveDraft}
          onPublish={onPublish}
          onTogglePreview={() => setPreviewActive(true)}
          previewActive={previewActive}
          compact={compact}
          onToggleLeft={event => toggleLeft(leftTab, event)}
          onToggleRight={toggleRight}
          leftClosed={leftClosed}
          rightClosed={rightClosed}
          brandLogo={brandLogo}
          brandName={brandName}
        />
        <LeftPanel onClose={() => setLeftClosed(true)} closed={leftClosed} compact={compact} activeTab={leftTab} onTabChange={setLeftTab} returnFocusRef={panelInvoker} />
        <main className="atlas-wb-editor__main">
          <Breadcrumb />
          <Canvas onLinkClick={onLinkClick} />
        </main>
        <RightPanel onClose={() => setRightClosed(true)} closed={rightClosed} compact={compact} activeTab={rightTab} onTabChange={setRightTab} returnFocusRef={panelInvoker} />
        {compact && <MobileTools leftClosed={leftClosed} rightClosed={rightClosed} leftTab={leftTab}
          onBlocks={event => toggleLeft('blocks', event)} onLayers={event => toggleLeft('layers', event)}
          onProperties={event => { setRightTab('properties'); toggleRight(event) }} />}
        <NotificationCenter />
        {/* Backdrop: only appears on mobile when a panel is open (not closed) */}
        {compact && (!leftClosed || !rightClosed) ? (
          <div
            className="atlas-wb-panel-backdrop"
            role="presentation"
            onClick={() => { setLeftClosed(true); setRightClosed(true) }}
          />
        ) : null}
      </ThemeProvider>
      <EditorPortal><DragOverlay dropAnimation={null}>
        {dragLabel ? <div className="atlas-wb-drag-overlay">{dragLabel}</div> : null}
      </DragOverlay></EditorPortal>
    </DndContext>
  )
}

/**
 * Public editor component. Wraps the host's BuilderProvider so the editor
 * can be mounted standalone:
 *
 *   <AtlasWebBuilderEditor blocks={[Hero, RichText]} initialPage={...} />
 *
 * If a parent already provides `<AtlasWebBuilderProvider>`, pass
 * `useExistingProvider` and the editor will reuse it.
 *
 * @param {{
 *   initialPage?: import('../schema/page.js').Page,
 *   blocks?: any[],
 *   blockRegistry?: any,
 *   theme?: any,
 *   resources?: any,
 *   mockResources?: any,
 *   actions?: any,
 *   permissions?: any,
 *   capabilities?: { schemaVersion: 1, id?: string, [key: string]: any },
 *   appearance?: 'light' | 'dark' | 'system',
 *   defaultAppearance?: 'light' | 'dark' | 'system',
 *   onAppearanceChange?: (appearance: 'light' | 'dark' | 'system') => void,
 *   onSaveDraft?: (page: import('../schema/page.js').Page) => void,
 *   onPublish?: (page: import('../schema/page.js').Page) => void,
 *   onLinkClick?: (href: string) => void,  // links in the canvas/preview never navigate; this reports the click
 *   useExistingProvider?: boolean,
 * }} props
 */
export function AtlasWebBuilderEditor({
  initialPage,
  blocks,
  blockRegistry,
  templates,
  layouts,
  assets,
  theme,
  resources,
  mockResources,
  actions,
  permissions,
  onSaveDraft,
  onPublish,
  onLinkClick,
  brandLogo,
  brandName,
  seo,
  capabilities,
  appearance,
  defaultAppearance = 'system',
  onAppearanceChange,
  useExistingProvider = false,
}) {
  assertEditorCapabilities(capabilities)
  const providerProps = useMemo(
    () => ({
      blocks,
      blockRegistry,
      templates,
      layouts,
      assets,
      theme,
      resources,
      mockResources,
      actions,
      permissions,
    }),
    [
      blocks,
      blockRegistry,
      templates,
      layouts,
      assets,
      theme,
      resources,
      mockResources,
      actions,
      permissions,
    ],
  )

  const seoValue = useMemo(() => ({ site: seo?.site, baseUrl: seo?.baseUrl ?? '' }), [seo?.site, seo?.baseUrl])

  const inner = (
    <EditorAppearanceProvider appearance={appearance} defaultAppearance={defaultAppearance} onAppearanceChange={onAppearanceChange}>
    <EditorCapabilitiesContext.Provider value={capabilities || unrestrictedCapabilities}>
    <EditorStoreProvider initialPage={initialPage} initialTheme={theme}>
      <NotificationsProvider>
        <SeoContext.Provider value={seoValue}>
          <EditorShell onSaveDraft={onSaveDraft} onPublish={onPublish} onLinkClick={onLinkClick} brandLogo={brandLogo} brandName={brandName} />
        </SeoContext.Provider>
      </NotificationsProvider>
    </EditorStoreProvider>
    </EditorCapabilitiesContext.Provider>
    </EditorAppearanceProvider>
  )

  if (useExistingProvider) return inner
  return <AtlasWebBuilderProvider {...providerProps}>{inner}</AtlasWebBuilderProvider>
}
