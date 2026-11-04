import { useMemo } from 'react'
import { BlockRenderer } from './BlockRenderer.jsx'
import { migrateContent } from '../schema/migrate.js'

/**
 * Render a Page document. Walks the page's regions and renders each root
 * block via the registered allowlist. Must be used inside an
 * `<AtlasWebBuilderProvider>`.
 *
 * @param {{
 *   page: import('../schema/page.js').Page,
 *   mode?: 'public'|'preview'|'edit',
 *   regionAs?: keyof JSX.IntrinsicElements,
 *   className?: string,
 *   eagerBlocks?: number,  // first N root blocks never lazy-mount (above the fold)
 * }} props
 */
export function AtlasWebRenderer({
  page,
  mode = 'public',
  regionAs: RegionTag = 'section',
  className,
  eagerBlocks = 2,
}) {
  const safePage = useMemo(() => migrateContent(page), [page])

  if (!safePage || !safePage.regions || !safePage.blocks) {
    return null
  }

  const regionEntries = Object.entries(safePage.regions)
  let rootIndex = 0

  return (
    <div className={className} data-atlas-page={safePage.id}>
      {regionEntries.map(([regionName, region]) => (
        <RegionTag key={regionName} data-atlas-region={regionName} data-atlas-region-id={region.id}>
          {(region.children || []).map((blockId) => (
            <BlockRenderer
              key={blockId}
              blockId={blockId}
              blocks={safePage.blocks}
              mode={mode}
              eager={rootIndex++ < eagerBlocks}
            />
          ))}
        </RegionTag>
      ))}
    </div>
  )
}
