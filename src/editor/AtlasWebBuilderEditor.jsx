import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'

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

/**
 * Inner shell — assumes BuilderProvider + EditorStoreProvider are mounted above.
 */
function EditorShell({ onSaveDraft, onPublish, brandLogo, brandName }) {
  const { blocks: registry, templates: templateRegistry } = useBuilder()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
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

  const [previewActive, setPreviewActive] = useState(false)
  const [dragLabel, setDragLabel] = useState(null)
  // leftClosed / rightClosed: false = panel visible, true = panel hidden.
  // On mobile (≤960px) panels default to closed; CSS turns them into overlays.
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 960
  const [leftClosed, setLeftClosed] = useState(isMobile)
  const [rightClosed, setRightClosed] = useState(isMobile)

  // Keep panel state in sync with the CSS mobile breakpoint (960px) as the
  // window is resized after mount. Without this, resizing from desktop to
  // mobile leaves both panels "open" in JS while CSS turns them into
  // fixed-position overlays — the two overlays end up wider than the
  // viewport and cover the canvas entirely.
  useEffect(() => {
    if (typeof window === 'undefined') return
    let wasMobile = window.innerWidth <= 960
    function handleResize() {
      const nowMobile = window.innerWidth <= 960
      if (nowMobile === wasMobile) return
      wasMobile = nowMobile
      setLeftClosed(nowMobile)
      setRightClosed(nowMobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ----- Keyboard shortcuts ------------------------------------------------
  useEffect(() => {
    function onKey(e) {
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
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, store, removeBlock, duplicateBlock])

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
        moveBlockTo(activeData.blockId, target)
      }
    },
    [registry, templateRegistry, insertBlock, moveBlockTo, applyTemplateAction, resolveTarget],
  )

  // ----- Preview mode bypasses chrome --------------------------------------
  if (previewActive) {
    return (
      <ThemeProvider
        theme={storeTheme}
        as="div"
        className="atlas-wb-editor atlas-wb-editor--preview"
      >
        <TopBar
          onSaveDraft={onSaveDraft}
          onPublish={onPublish}
          onTogglePreview={() => setPreviewActive(false)}
          previewActive={previewActive}
          brandLogo={brandLogo}
          brandName={brandName}
        />
        <div className="atlas-wb-preview">
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragLabel(null)}
    >
      <ThemeProvider
        theme={storeTheme}
        as="div"
        className="atlas-wb-editor"
        data-left-closed={leftClosed ? '' : undefined}
        data-right-closed={rightClosed ? '' : undefined}
      >
        <TopBar
          onSaveDraft={onSaveDraft}
          onPublish={onPublish}
          onTogglePreview={() => setPreviewActive(true)}
          previewActive={previewActive}
          onToggleLeft={() => setLeftClosed((v) => !v)}
          onToggleRight={() => setRightClosed((v) => !v)}
          leftClosed={leftClosed}
          rightClosed={rightClosed}
          brandLogo={brandLogo}
          brandName={brandName}
        />
        <LeftPanel onClose={() => setLeftClosed(true)} />
        <main className="atlas-wb-editor__main">
          <Breadcrumb />
          <Canvas />
        </main>
        <RightPanel />
        <NotificationCenter />
        {/* Backdrop: only appears on mobile when a panel is open (not closed) */}
        {(!leftClosed || !rightClosed) ? (
          <div
            className="atlas-wb-panel-backdrop"
            style={{ display: window.innerWidth <= 960 ? undefined : 'none' }}
            role="presentation"
            onClick={() => { setLeftClosed(true); setRightClosed(true) }}
          />
        ) : null}
      </ThemeProvider>
      <DragOverlay>
        {dragLabel ? <div className="atlas-wb-drag-overlay">{dragLabel}</div> : null}
      </DragOverlay>
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
 *   onSaveDraft?: (page: import('../schema/page.js').Page) => void,
 *   onPublish?: (page: import('../schema/page.js').Page) => void,
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
  brandLogo,
  brandName,
  useExistingProvider = false,
}) {
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

  const inner = (
    <EditorStoreProvider initialPage={initialPage} initialTheme={theme}>
      <NotificationsProvider>
        <EditorShell onSaveDraft={onSaveDraft} onPublish={onPublish} brandLogo={brandLogo} brandName={brandName} />
      </NotificationsProvider>
    </EditorStoreProvider>
  )

  if (useExistingProvider) return inner
  return <AtlasWebBuilderProvider {...providerProps}>{inner}</AtlasWebBuilderProvider>
}
