import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { ancestorsOf } from '../../utils/tree.js'
import { es } from '../i18n/es.js'

export function Breadcrumb() {
  const page = useEditorStore((s) => s.page)
  const selectedId = useEditorStore((s) => s.selectedId)
  const select = useEditorStore((s) => s.select)
  const clearSelection = useEditorStore((s) => s.clearSelection)

  const chain = selectedId ? ancestorsOf(page, selectedId) : []

  return (
    <nav className="atlas-wb-breadcrumb" aria-label="Selección">
      <button type="button" className="atlas-wb-breadcrumb__item" onClick={clearSelection}>
        {es.breadcrumb.root}
      </button>
      {chain.map((id) => {
        const block = page.blocks[id]
        if (!block) return null
        return (
          <span key={id} className="atlas-wb-breadcrumb__item-wrap">
            <span aria-hidden="true" className="atlas-wb-breadcrumb__sep">
              ›
            </span>
            <button type="button" className="atlas-wb-breadcrumb__item" onClick={() => select(id)}>
              {block.type}
            </button>
          </span>
        )
      })}
    </nav>
  )
}
