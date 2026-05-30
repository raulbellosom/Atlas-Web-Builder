import { useMemo } from 'react'
import clsx from 'clsx'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { useTheme } from '../../theme/ThemeProvider.jsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import { DEVICE_WIDTHS } from '../store/createEditorStore.js'
import { EditorRenderContext } from '../dnd/EditorRenderContext.js'
import { EditableBlock } from './EditableBlock.jsx'
import { EditorSlot } from './EditorSlot.jsx'
import { es } from '../i18n/es.js'

/**
 * Walk the page once to locate a block's container. O(n) over the dictionary;
 * cheap for typical authored pages.
 */
function locateBlock(page, blockId) {
  for (const [regionName, region] of Object.entries(page.regions || {})) {
    if ((region.children || []).includes(blockId)) {
      return {
        parentId: null,
        slotName: null,
        regionName,
        siblings: region.children,
      }
    }
  }
  for (const pBlock of Object.values(page.blocks || {})) {
    for (const [slotName, ids] of Object.entries(pBlock.children || {})) {
      if ((ids || []).includes(blockId)) {
        return {
          parentId: pBlock.id,
          slotName,
          regionName: null,
          siblings: ids,
        }
      }
    }
  }
  return { parentId: null, slotName: null, regionName: null, siblings: [] }
}

/**
 * Build the editor render-context value. The renderer uses these wrappers
 * to decorate blocks (selection + drag) and slots (drop zones + sortable).
 */
function useEditorRenderValue(page) {
  return useMemo(() => {
    function renderBlock(blockId, blocksDict, mode) {
      const loc = locateBlock(page, blockId)
      return (
        <EditableBlock
          key={blockId}
          blockId={blockId}
          parentId={loc.parentId}
          slotName={loc.slotName}
          regionName={loc.regionName}
          siblings={loc.siblings}
          blocks={blocksDict}
          mode={mode}
        />
      )
    }
    function renderSlot({ parentId, slotName, childIds, children }) {
      return (
        <EditorSlot parentId={parentId} slotName={slotName} regionName={null} childIds={childIds}>
          {children}
        </EditorSlot>
      )
    }
    return { renderBlock, renderSlot }
  }, [page])
}

/**
 * Renders one region of the page as an EditorSlot of EditableBlocks. Nested
 * slots are produced by `BlockRenderer` via the editor render context.
 */
function RegionTree({ page, regionName }) {
  const region = page.regions[regionName]
  const ids = region ? region.children : []
  return (
    <EditorSlot parentId={null} slotName={null} regionName={regionName} childIds={ids}>
      {ids.map((id) => (
        <EditableBlock
          key={id}
          blockId={id}
          parentId={null}
          slotName={null}
          regionName={regionName}
          siblings={ids}
          blocks={page.blocks}
        />
      ))}
    </EditorSlot>
  )
}

/**
 * Compose the human label for a region tab. Order of precedence:
 *  1. label defined by the active layout for that region name,
 *  2. localized default for well-known names (main/header/footer/...),
 *  3. the raw region name.
 */
function regionLabel(name, layout) {
  if (layout && Array.isArray(layout.regions)) {
    const found = layout.regions.find((r) => r.name === name)
    if (found && found.label) return found.label
  }
  return es.regions.defaultLabels[name] || name
}

function RegionTabs({ regionNames, activeRegion, onSelect, layout }) {
  if (regionNames.length <= 1) return null
  return (
    <div className="atlas-wb-region-tabs" role="tablist" aria-label={es.regions.tabsLabel}>
      {regionNames.map((name) => (
        <button
          key={name}
          type="button"
          role="tab"
          aria-selected={name === activeRegion}
          className={clsx(
            'atlas-wb-region-tabs__tab',
            name === activeRegion && 'atlas-wb-region-tabs__tab--active',
          )}
          onClick={() => onSelect(name)}
          title={es.regions.activate.replace('{name}', regionLabel(name, layout))}
        >
          {regionLabel(name, layout)}
        </button>
      ))}
    </div>
  )
}

export function Canvas() {
  const page = useEditorStore((s) => s.page)
  const device = useEditorStore((s) => s.device)
  const clearSelection = useEditorStore((s) => s.clearSelection)
  const activeRegion = useEditorStore((s) => s.activeRegion)
  const setActiveRegion = useEditorStore((s) => s.setActiveRegion)
  const theme = useTheme()
  const { layouts } = useBuilder()
  const editorRenderValue = useEditorRenderValue(page)

  const regionNames = Object.keys(page.regions || {})
  const safeActive = page.regions[activeRegion] ? activeRegion : regionNames[0] || 'main'
  const layout = page.layoutId && layouts ? layouts.get(page.layoutId) : null

  return (
    <div
      className="atlas-wb-canvas"
      role="presentation"
      onClick={clearSelection}
      onKeyDown={(e) => {
        if (e.key === 'Escape') clearSelection()
      }}
      data-device={device}
      data-device-width={DEVICE_WIDTHS[device]}
    >
      <RegionTabs
        regionNames={regionNames}
        activeRegion={safeActive}
        onSelect={setActiveRegion}
        layout={layout}
      />
      <div
        className={clsx(
          'atlas-wb-canvas__frame',
          device === 'tablet' && 'atlas-wb-canvas__frame--tablet',
          device === 'mobile' && 'atlas-wb-canvas__frame--mobile',
        )}
        data-atlas-theme={theme.id}
        data-active-region={safeActive}
      >
        <EditorRenderContext.Provider value={editorRenderValue}>
          <RegionTree page={page} regionName={safeActive} />
        </EditorRenderContext.Provider>
      </div>
    </div>
  )
}
