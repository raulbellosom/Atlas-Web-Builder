import { createContext, useContext } from 'react'

/**
 * Optional context the editor mounts around the renderer so blocks can be
 * decorated (selection, drag handles, drop zones) without coupling the
 * `BlockRenderer` to editor internals.
 *
 * Shape:
 *   {
 *     renderBlock(blockId, blocks, mode) -> ReactNode   // wraps each block
 *     renderSlot({ parentId, slotName, childIds, children }) -> ReactNode
 *   }
 *
 * When `null`, the renderer falls back to its default plain output, which is
 * what `preview` and `public` modes always use.
 *
 * @type {React.Context<null | {
 *   renderBlock: (blockId: string, blocks: any, mode: string) => any,
 *   renderSlot: (args: { parentId: string, slotName: string, childIds: string[], children: any }) => any,
 * }>}
 */
export const EditorRenderContext = createContext(null)

export function useEditorRender() {
  return useContext(EditorRenderContext)
}
