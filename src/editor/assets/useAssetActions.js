import { useCallback } from 'react'
import { useBuilder } from '../../provider/BuilderContext.js'
import { useOptionalEditorStore } from '../store/EditorStoreProvider.jsx'
import { assetProps, imageFieldKey, resolveAsset, uploadAsset } from './assetSource.js'

/**
 * Puts library assets (or dropped files) into a block's image field.
 * `accepts(blockId)` tells whether the block has an image field at all.
 */
export function useAssetActions() {
  const { assets, blocks: registry } = useBuilder()
  const store = useOptionalEditorStore()

  const definitionOf = useCallback((blockId) => {
    const block = store?.getState().page?.blocks?.[blockId]
    return block && registry ? registry.get(block.type) : null
  }, [store, registry])

  const accepts = useCallback((blockId) => !!(assets && imageFieldKey(definitionOf(blockId))), [assets, definitionOf])

  const apply = useCallback(async (blockId, asset) => {
    const definition = definitionOf(blockId)
    if (!imageFieldKey(definition)) return false
    const props = assetProps(definition, await resolveAsset(assets, asset))
    if (!props) return false
    store.getState().updateBlockProps(blockId, props)
    return true
  }, [assets, store, definitionOf])

  const applyFile = useCallback(async (blockId, file) => {
    if (!file?.type?.startsWith('image/') || typeof assets?.upload !== 'function') return false
    return apply(blockId, await uploadAsset(assets, file))
  }, [assets, apply])

  return { assets, accepts, apply, applyFile }
}
