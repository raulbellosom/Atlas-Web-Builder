import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { baseBlocks } from '../blocks/index.js'

const page = (type) => ({
  schemaVersion: 1, id: 'p', slug: '/', title: 'p', visibility: 'public',
  regions: { main: { id: 'r', children: ['b'] } },
  blocks: { b: { id: 'b', type, props: type === 'CardBlock' ? { title: 'Tarjeta' } : {}, children: {} } },
})

describe('empty image placeholders', () => {
  it.each(['CardBlock', 'ImageBlock'])('%s omits the "Sin imagen" aid on published pages', (type) => {
    render(
      <AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={page(type)} mode="public" /></AtlasWebBuilderProvider>,
    )
    expect(screen.queryByText('Sin imagen')).toBeNull()
  })

  it.each(['CardBlock', 'ImageBlock'])('%s keeps the aid while editing', (type) => {
    const def = baseBlocks.find((block) => block.type === type)
    const ctx = { mode: 'edit', slot: () => null, inlineText: () => null }
    expect(renderToStaticMarkup(def.render({ ...def.defaultProps, ctx }))).toContain('Sin imagen')
  })
})
