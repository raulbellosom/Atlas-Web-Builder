import { createStore } from 'zustand/vanilla'
import { temporal } from 'zundo'
import { produce } from 'immer'
import {
  insertBlockInRegion,
  insertBlockInSlot,
  removeBlock,
  moveBlockInRegion,
  moveBlockToTarget,
  duplicateBlock,
} from '../../utils/tree.js'
import { newId } from '../../utils/id.js'
import { parsePage, serializePage } from '../../persistence/serializePage.js'
import { applyTemplate as applyTemplateToDraft } from '../../templates/applyTemplate.js'
import { applyLayoutToDraft } from '../../layouts/defineLayout.js'
import { defaultTheme } from '../../theme/defaultTheme.js'
import { pageFromComponent, sectionFromComponentPage } from '../../components/actions.js'

/**
 * @typedef {'desktop'|'tablet'|'mobile'} DeviceMode
 */

/** Device widths in pixels for the responsive frame. */
export const DEVICE_WIDTHS = {
  desktop: 1280,
  tablet: 834,
  mobile: 390,
}

/**
 * Build the initial page document used when the host does not provide one.
 *
 * @returns {import('../schema/page.js').Page}
 */
function blankPage() {
  return {
    schemaVersion: 1,
    id: newId('page'),
    slug: '/',
    title: 'Página nueva',
    visibility: 'public',
    layoutId: null,
    regions: { main: { id: newId('region'), children: [] } },
    blocks: {},
    seo: { title: '', description: '', canonical: null, ogImageAssetId: null },
    updatedAt: new Date().toISOString(),
  }
}

/** Pick the first region key of a page, falling back to 'main'. */
function firstRegionName(page) {
  if (!page || !page.regions) return null
  if (page.regions.main) return 'main'
  const keys = Object.keys(page.regions)
  return keys.length ? keys[0] : null
}

/**
 * Create a new editor store instance.
 *
 * Persisted (history-tracked) state: `page`.
 * Transient UI state (selection, hover, device, theme) is NOT tracked by
 * undo/redo: theme edits are separate from page history by design.
 *
 * @param {{ page?: import('../schema/page.js').Page, theme?: import('../schema/theme.js').Theme }} [initial]
 */
export function createEditorStore(initial = {}) {
  const initialTheme = initial.theme || defaultTheme
  const store = createStore(
    temporal(
      (set, get) => ({
        /** @type {import('../schema/page.js').Page} */
        page: initial.page ? initial.page : blankPage(),
        /** @type {string|null} */
        selectedId: null,
        /** @type {DeviceMode} */
        device: 'desktop',
        /** Currently focused region in the canvas. */
        activeRegion: firstRegionName(initial.page) || 'main',
        /** @type {import('../schema/theme.js').Theme} */
        theme: initialTheme,
        /** Inline editing: block id whose text is being edited in-place. */
        /** While a synced component is being edited: { id, name, returnPage }. The page above is then the definition. */
        editingComponent: null,
        /** Replays the entrance animation of one block in the canvas (never saved, not in undo history). */
        effectPreview: null,
        playEffectPreview(id) { set((state) => ({ effectPreview: { id, nonce: (state.effectPreview?.nonce ?? 0) + 1 } })) },
        inlineEditId: null,
        /** Inline editing: which prop name on that block. */
        inlineEditProp: null,

        // ---- Selection ---------------------------------------------------
        select(id) {
          set({ selectedId: id })
        },
        clearSelection() {
          set({ selectedId: null, inlineEditId: null, inlineEditProp: null })
        },

        // ---- Inline editing (not tracked by undo/redo) ------------------
        startInlineEdit(blockId, propName) {
          if (!blockId || !propName) return
          set({ inlineEditId: blockId, inlineEditProp: propName, selectedId: blockId })
        },
        stopInlineEdit() {
          set({ inlineEditId: null, inlineEditProp: null })
        },

        // ---- Device ------------------------------------------------------
        setDevice(device) {
          if (!DEVICE_WIDTHS[device]) return
          set({ device })
        },

        // ---- Regions -----------------------------------------------------
        setActiveRegion(name) {
          const page = get().page
          if (!page || !page.regions || !page.regions[name]) return
          set({ activeRegion: name, selectedId: null })
        } /**
         * Apply a layout: ensures every region declared by the layout
         * exists in the page and sets `page.layoutId`. Pre-existing region
         * children are preserved.
         *
         * @param {import('../../layouts/defineLayout.js').LayoutDefinition} layout
         */,
        setLayout(layout) {
          if (!layout) return
          set((state) => ({
            page: produce(state.page, (draft) => {
              applyLayoutToDraft(draft, layout, newId)
              draft.updatedAt = new Date().toISOString()
            }),
          }))
          // If the active region no longer exists (shouldn't happen — we
          // never remove regions — but be defensive), fall back to first.
          const next = get().page
          if (!next.regions[get().activeRegion]) {
            set({ activeRegion: firstRegionName(next) || 'main' })
          }
        },

        // ---- Mutations (tracked by undo/redo) ---------------------------
        insertBlock(type, def, target, initialProps = {}) {
          const region =
            target && target.regionName ? target.regionName : get().activeRegion || 'main'
          const effective =
            target && target.parentId && target.slotName
              ? target
              : { ...(target || {}), regionName: region }
          let newBlockId = null
          set((state) => ({
            page: produce(state.page, (draft) => {
              const insertArgs = { type, defaultProps: { ...def?.defaultProps, ...initialProps } }
              if (effective.parentId && effective.slotName) {
                newBlockId = insertBlockInSlot(draft, insertArgs, effective)
              } else {
                newBlockId = insertBlockInRegion(draft, insertArgs, {
                  regionName: effective.regionName,
                  index: effective.index,
                })
              }
              draft.updatedAt = new Date().toISOString()
            }),
          }))
          if (newBlockId) set({ selectedId: newBlockId })
          return newBlockId
        },
        updateBlockProps(id, partial) {
          set((state) => ({
            page: produce(state.page, (draft) => {
              const block = draft.blocks[id]
              if (!block) return
              block.props = { ...block.props, ...partial }
              draft.updatedAt = new Date().toISOString()
            }),
          }))
        },
        resetBlockProps(id, keys, replacements = {}) {
          set(state=>({page:produce(state.page,draft=>{
            const block=draft.blocks[id]
            if(!block)return
            for(const key of keys)delete block.props[key]
            Object.assign(block.props,replacements)
            draft.updatedAt=new Date().toISOString()
          })}))
        },
        removeBlock(id) {
          set((state) => {
            const wasSelected = state.selectedId === id
            return {
              page: produce(state.page, (draft) => {
                removeBlock(draft, id)
                draft.updatedAt = new Date().toISOString()
              }),
              selectedId: wasSelected ? null : state.selectedId,
            }
          })
        },
        moveBlock(id, toIndex) {
          set((state) => ({
            page: produce(state.page, (draft) => {
              moveBlockInRegion(draft, id, toIndex)
              draft.updatedAt = new Date().toISOString()
            }),
          }))
        },
        /**
         * Move a block to an arbitrary target (region or slot). Returns true
         * if the move succeeded.
         */
        moveBlockTo(id, target) {
          let moved = false
          set((state) => ({
            page: produce(state.page, (draft) => {
              moved = moveBlockToTarget(draft, id, target)
              if (moved) draft.updatedAt = new Date().toISOString()
            }),
          }))
          return moved
        },
        duplicateBlock(id) {
          let newBlockId = null
          set((state) => ({
            page: produce(state.page, (draft) => {
              newBlockId = duplicateBlock(draft, id)
              draft.updatedAt = new Date().toISOString()
            }),
          }))
          if (newBlockId) set({ selectedId: newBlockId })
          return newBlockId
        },

        // ---- Synced components --------------------------------------------
        /** Swap the canvas to a component definition. Undo history is per mode, so it is cleared on entry and exit. */
        enterComponentEdit(id, definition) {
          if (get().editingComponent) return false
          const returnPage = get().page
          set({ editingComponent: { id, name: definition.name, returnPage }, page: pageFromComponent(id, definition), selectedId: null, activeRegion: 'main' })
          store.temporal.getState().clear()
          return true
        },
        /** The edited definition without leaving edit mode, so a failed save keeps the session. Throws if invalid. */
        currentComponentDefinition() {
          const editing = get().editingComponent
          if (!editing) return null
          return { id: editing.id, definition: { name: editing.name, section: sectionFromComponentPage(get().page) } }
        },
        /** Back to the page. With `apply` returns `{ id, definition }` to persist; throws if the definition is not valid. */
        exitComponentEdit({ apply = false } = {}) {
          const editing = get().editingComponent
          if (!editing) return null
          const result = apply ? { id: editing.id, definition: { name: editing.name, section: sectionFromComponentPage(get().page) } } : null
          set({ editingComponent: null, page: editing.returnPage, selectedId: null, activeRegion: firstRegionName(editing.returnPage) || 'main' })
          store.temporal.getState().clear()
          return result
        },

        // ---- Theme (NOT tracked by undo/redo) ---------------------------
        setTheme(theme) {
          if (!theme || typeof theme !== 'object') return
          set({ theme })
        },
        /** Mutate a single token: e.g. setThemeToken('color', 'primary', '#000'). */
        setThemeToken(category, key, value) {
          set((state) => {
            const tokens = state.theme && state.theme.tokens ? state.theme.tokens : {}
            const cat = tokens[category] || {}
            return {
              theme: {
                ...state.theme,
                tokens: {
                  ...tokens,
                  [category]: { ...cat, [key]: value },
                },
              },
            }
          })
        },
        /** Revert to the theme passed at editor mount. */
        resetTheme() {
          set({ theme: initialTheme })
        },

        // ---- Page-level --------------------------------------------------
        setPage(page) {
          set({ page, selectedId: null, activeRegion: firstRegionName(page) || 'main' })
        },
        getPage() {
          return get().page
        },
        /**
         * Replace the entire page from untrusted JSON or an object. Runs
         * migrations + validation; throws PageValidationError on failure.
         * Clears selection and adds an entry to the history.
         *
         * @param {string|object} input
         */
        replacePage(input) {
          const next = parsePage(input)
          set({ page: next, selectedId: null, activeRegion: firstRegionName(next) || 'main' })
          return next
        },
        /**
         * Serialize the current page to a JSON string ready to ship to disk
         * or to an API. Always emits the current schema version.
         *
         * @param {{ pretty?: boolean }} [opts]
         */
        exportPage(opts) {
          return serializePage(get().page, opts)
        },
        /**
         * Apply a template (host-supplied) at the given target. Returns the
         * list of new root ids that were inserted. The first inserted root
         * is auto-selected as a convenience.
         *
         * @param {import('../../templates/defineTemplate.js').TemplateDefinition} template
         * @param {{ regionName?: string, parentId?: string, slotName?: string, index?: number }} [target]
         */
        applyTemplate(template, target) {
          const region =
            target && target.regionName ? target.regionName : get().activeRegion || 'main'
          const effective =
            target && target.parentId && target.slotName
              ? target
              : { ...(target || {}), regionName: region }
          let inserted = []
          set((state) => ({
            page: produce(state.page, (draft) => {
              inserted = applyTemplateToDraft(draft, template, effective)
              if (inserted.length) draft.updatedAt = new Date().toISOString()
            }),
          }))
          if (inserted.length) set({ selectedId: inserted[0] })
          return inserted
        },
      }),
      {
        // Only track the page document in history; ignore UI state.
        partialize: (state) => ({ page: state.page }),
        limit: 50,
        equality: (a, b) => a.page === b.page,
      },
    ),
  )
  return store
}
