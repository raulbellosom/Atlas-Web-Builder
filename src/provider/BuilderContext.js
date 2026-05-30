import { createContext, useContext } from 'react'

/**
 * @typedef {Object} BuilderContextValue
 * @property {import('../registry/createBlockRegistry.js').BlockDefinition extends infer T ? any : any} blocks
 *   - A block registry created via `createBlockRegistry()`.
 * @property {Object<string, Object>} [resources] - Host-provided live resources.
 * @property {Object<string, Object>} [mockResources] - Host-provided mock resources for editor preview.
 * @property {Object<string, Function>} [actions]   - Host-provided action handlers.
 * @property {(action: string, ctx?: any) => boolean | Promise<boolean>} [permissions]
 *   - Host-provided permission resolver.
 */

/** @type {React.Context<BuilderContextValue|null>} */
export const BuilderContext = createContext(null)

/**
 * Read the builder context. Throws when used outside `<AtlasWebBuilderProvider>`.
 *
 * @returns {BuilderContextValue}
 */
export function useBuilder() {
  const ctx = useContext(BuilderContext)
  if (!ctx) {
    throw new Error(
      '[atlas-web-builder] useBuilder() must be used inside <AtlasWebBuilderProvider>.',
    )
  }
  return ctx
}
