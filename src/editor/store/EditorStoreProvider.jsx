import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useStore } from 'zustand'
import { createEditorStore } from './createEditorStore.js'

/** @type {React.Context<ReturnType<typeof createEditorStore>|null>} */
const EditorStoreContext = createContext(null)

/**
 * Provide a store instance to the editor subtree. Stores are created per
 * `<AtlasWebBuilderEditor>` so multiple editors can coexist.
 *
 * @param {{
 *   initialPage?: import('../../schema/page.js').Page,
 *   initialTheme?: import('../../schema/theme.js').Theme,
 *   children: React.ReactNode,
 * }} props
 */
export function EditorStoreProvider({ initialPage, initialTheme, children }) {
  const [store] = useState(() => createEditorStore({ page: initialPage, theme: initialTheme }))

  useEffect(() => {
    if (initialPage) store.getState().setPage(initialPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPage])

  return <EditorStoreContext.Provider value={store}>{children}</EditorStoreContext.Provider>
}

/**
 * Subscribe to a slice of the editor store.
 *
 * @template T
 * @param {(state: any) => T} selector
 * @returns {T}
 */
export function useEditorStore(selector) {
  const store = useContext(EditorStoreContext)
  if (!store) {
    throw new Error('useEditorStore must be used inside <AtlasWebBuilderEditor>')
  }
  return useStore(store, selector)
}

/** Read the raw store instance (for imperative ops like undo/redo). */
export function useEditorStoreInstance() {
  const store = useContext(EditorStoreContext)
  if (!store) {
    throw new Error('useEditorStoreInstance must be used inside <AtlasWebBuilderEditor>')
  }
  return store
}

/**
 * Subscribe to a slice of the temporal (history) store.
 *
 * @template T
 * @param {(state: any) => T} selector
 * @returns {T}
 */
export function useTemporal(selector) {
  const store = useContext(EditorStoreContext)
  if (!store) {
    throw new Error('useTemporal must be used inside <AtlasWebBuilderEditor>')
  }
  return useStore(store.temporal, selector)
}

/** Memoized empty-call hook used to avoid re-renders on identity changes. */
export function useEditorActions() {
  const store = useContext(EditorStoreContext)
  if (!store) {
    throw new Error('useEditorActions must be used inside <AtlasWebBuilderEditor>')
  }
  return useMemo(() => store.getState(), [store])
}
