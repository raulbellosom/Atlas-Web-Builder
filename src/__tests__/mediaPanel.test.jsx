import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AtlasWebBuilderEditor } from '../editor/AtlasWebBuilderEditor.jsx'
import { useEditorStoreInstance } from '../editor/store/EditorStoreProvider.jsx'
import { baseBlocks } from '../blocks/index.js'
import { ASSET_DRAG_TYPE, assetProps, normalizeAssetList } from '../editor/assets/assetSource.js'

describe('asset source helpers', () => {
  it('accepts arrays and pages from list()', () => {
    expect(normalizeAssetList([{ id: 'a' }])).toEqual({ items: [{ id: 'a' }], next: null })
    expect(normalizeAssetList({ items: [{ id: 'a' }], next: 'c2' })).toEqual({ items: [{ id: 'a' }], next: 'c2' })
    expect(normalizeAssetList(undefined)).toEqual({ items: [], next: null })
  })

  it('targets the first image field and keeps asset meta only when the field asks for it', () => {
    const plain = { fields: { title: { type: 'text' }, imageSrc: { type: 'image' } } }
    const meta = { fields: { src: { type: 'image', withAssetMeta: true } } }
    expect(assetProps(plain, { url: 'u', width: 10 })).toEqual({ imageSrc: 'u' })
    expect(assetProps(meta, { url: 'u', width: 10, height: 5 })).toMatchObject({ src: 'u', naturalWidth: 10, naturalHeight: 5, dominantColor: '' })
    expect(assetProps({ fields: { text: { type: 'text' } } }, { url: 'u' })).toBeNull()
  })
})

let store
function Probe() { store = useEditorStoreInstance(); return null }
const page = () => ({
  schemaVersion: 1, id: 'p', slug: '/', title: 'Inicio', visibility: 'public',
  regions: { main: { children: ['img', 'h'] } },
  blocks: {
    img: { id: 'img', type: 'ImageBlock', props: { src: '', alt: 'Foto' } },
    h: { id: 'h', type: 'HeadingBlock', props: { text: 'Titulo' } },
  },
  seo: {},
})
const listed = { id: 'a1', kind: 'image', name: 'gato.png', url: 'thumb://a1' }
function source() {
  return {
    list: vi.fn(async () => ({ items: [listed], next: null })),
    resolve: vi.fn(async (asset) => ({ ...asset, url: `full://${asset.id}` })),
  }
}
function mount(assets) {
  const view = render(<AtlasWebBuilderEditor blocks={baseBlocks} initialPage={page()} assets={assets} brandLogo={<Probe />} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Medios' }))
  return view
}

describe('Medios panel', () => {
  it('a click puts the resolved image into the selected block', async () => {
    const assets = source()
    const { container } = mount(assets)
    fireEvent.click(container.querySelector('[data-block-id="img"]'))
    const thumb = await screen.findByRole('button', { name: /Usar gato.png/ })
    fireEvent.click(thumb)
    await waitFor(() => expect(store.getState().page.blocks.img.props.src).toBe('full://a1'))
    expect(assets.resolve).toHaveBeenCalledWith(listed)
  })

  it('dropping a thumbnail on an image block replaces its image; blocks without one ignore it', async () => {
    const { container } = mount(source())
    await screen.findByRole('button', { name: /gato.png/ })
    const dataTransfer = { types: [ASSET_DRAG_TYPE], getData: () => JSON.stringify(listed), files: [] }
    fireEvent.dragOver(container.querySelector('[data-block-id="h"]'), { dataTransfer })
    expect(container.querySelector('[data-block-id="h"]')).not.toHaveClass('atlas-wb-block--media-over')
    fireEvent.dragOver(container.querySelector('[data-block-id="img"]'), { dataTransfer })
    expect(container.querySelector('[data-block-id="img"]')).toHaveClass('atlas-wb-block--media-over')
    fireEvent.drop(container.querySelector('[data-block-id="img"]'), { dataTransfer })
    await waitFor(() => expect(store.getState().page.blocks.img.props.src).toBe('full://a1'))
  })

  it('hides the tab without an asset source', () => {
    render(<AtlasWebBuilderEditor blocks={baseBlocks} initialPage={page()} />)
    expect(screen.queryByRole('tab', { name: 'Medios' })).not.toBeInTheDocument()
  })
})
