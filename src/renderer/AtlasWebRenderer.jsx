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
 * }} props
 */
export function AtlasWebRenderer({
  page,
  mode = 'public',
  regionAs: RegionTag = 'section',
  className,
}) {
  const safePage = useMemo(() => migrateContent(page), [page])

  if (!safePage || !safePage.regions || !safePage.blocks) {
    return null
  }

  const regionEntries = Object.entries(safePage.regions)

  return (
    <div className={className} data-atlas-page={safePage.id}>
      {regionEntries.map(([regionName, region]) => (
        <RegionTag key={regionName} data-atlas-region={regionName} data-atlas-region-id={region.id}>
          {(region.children || []).map((blockId) => (
            <BlockRenderer key={blockId} blockId={blockId} blocks={safePage.blocks} mode={mode} />
          ))}
        </RegionTag>
      ))}
    </div>
  )
}
