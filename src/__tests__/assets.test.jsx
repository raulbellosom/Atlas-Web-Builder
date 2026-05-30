import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { createInMemoryAssetSource } from '../assets/createAssetSource.js'
import { AssetPicker } from '../editor/assets/AssetPicker.jsx'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { ImageField } from '../editor/fields/ImageField.jsx'
import { createBlockRegistry } from '../registry/createBlockRegistry.js'

function wrap(ui, providerProps = {}) {
  return render(
    <AtlasWebBuilderProvider blockRegistry={createBlockRegistry([])} {...providerProps}>
      {ui}
    </AtlasWebBuilderProvider>,
  )
}

describe('assets — createInMemoryAssetSource', () => {
  it('starts empty by default', async () => {
    const src = createInMemoryAssetSource()
    expect(await src.list()).toEqual([])
  })

  it('seeds with initial items', async () => {
    const src = createInMemoryAssetSource([
      { id: 'a1', kind: 'image', url: 'https://x/y.png', name: 'y' },
    ])
    expect(await src.list()).toHaveLength(1)
    expect(await src.getById('a1')).toMatchObject({ id: 'a1' })
  })

  it('upload pushes the new asset and notifies subscribers', async () => {
    const src = createInMemoryAssetSource()
    let calls = 0
    src.subscribe(() => { calls += 1 })
    const file = new File(['hello'], 'h.png', { type: 'image/png' })
    const asset = await src.upload(file)
    expect(asset.kind).toBe('image')
    expect(asset.url.startsWith('data:')).toBe(true)
    expect((await src.list())[0].id).toBe(asset.id)
    expect(calls).toBe(1)
  })

  it('remove drops the asset', async () => {
    const src = createInMemoryAssetSource([{ id: 'a1', kind: 'image', url: 'u', name: 'n' }])
    await src.remove('a1')
    expect(await src.list()).toEqual([])
  })
})

describe('AssetPicker', () => {
  it('shows URL tab by default', () => {
    const src = createInMemoryAssetSource()
    wrap(<AssetPicker onPick={() => {}} onClose={() => {}} />, { assets: src })
    // URL tab is the default — input is visible
    expect(screen.getByPlaceholderText(/https:\/\//i)).toBeInTheDocument()
  })

  it('renders empty state when source has no items (Biblioteca tab)', async () => {
    const src = createInMemoryAssetSource()
    wrap(<AssetPicker onPick={() => {}} onClose={() => {}} />, { assets: src })
    // Switch to Biblioteca tab
    fireEvent.click(screen.getByRole('tab', { name: /biblioteca/i }))
    await waitFor(() => expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument())
    expect(screen.getByText(/No hay medios/i)).toBeInTheDocument()
  })

  it('lists items and fires onPick on click (Biblioteca tab)', async () => {
    const src = createInMemoryAssetSource([
      { id: 'a1', kind: 'image', url: 'https://x/y.png', name: 'foto.png' },
    ])
    const picks = []
    wrap(<AssetPicker onPick={(a) => picks.push(a)} onClose={() => {}} />, { assets: src })
    // Switch to Biblioteca tab
    fireEvent.click(screen.getByRole('tab', { name: /biblioteca/i }))
    await waitFor(() => expect(screen.getByTitle('foto.png')).toBeInTheDocument())
    fireEvent.click(screen.getByTitle('foto.png'))
    expect(picks).toHaveLength(1)
    expect(picks[0].id).toBe('a1')
  })

  it('Escape calls onClose', async () => {
    const src = createInMemoryAssetSource()
    let closed = 0
    wrap(
      <AssetPicker onPick={() => {}} onClose={() => { closed += 1 }} />,
      { assets: src },
    )
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(closed).toBe(1)
  })

  it('shows Biblioteca tab only when asset source provided', () => {
    // Without assets: only URL tab
    const { unmount } = wrap(<AssetPicker onPick={() => {}} onClose={() => {}} />)
    expect(screen.queryByRole('tab', { name: /biblioteca/i })).not.toBeInTheDocument()
    unmount()
    // With assets: Biblioteca tab appears
    const src = createInMemoryAssetSource()
    wrap(<AssetPicker onPick={() => {}} onClose={() => {}} />, { assets: src })
    expect(screen.getByRole('tab', { name: /biblioteca/i })).toBeInTheDocument()
  })
})

describe('ImageField + assets', () => {
  it('always renders a media picker button', () => {
    wrap(<ImageField value="" onChange={() => {}} label="Imagen" />)
    expect(screen.getByRole('button', { name: /selector de medios/i })).toBeInTheDocument()
  })

  it('picking an asset writes its URL to onChange', async () => {
    const src = createInMemoryAssetSource([
      { id: 'a1', kind: 'image', url: 'https://cdn/x.png', name: 'x.png' },
    ])
    let last = null
    wrap(
      <ImageField value="" onChange={(v) => { last = v }} label="Imagen" />,
      { assets: src },
    )
    // Open picker
    fireEvent.click(screen.getByRole('button', { name: /selector de medios/i }))
    // Switch to Biblioteca tab
    await waitFor(() => screen.getByRole('tab', { name: /biblioteca/i }))
    fireEvent.click(screen.getByRole('tab', { name: /biblioteca/i }))
    await waitFor(() => expect(screen.getByTitle('x.png')).toBeInTheDocument())
    fireEvent.click(screen.getByTitle('x.png'))
    expect(last).toBe('https://cdn/x.png')
  })
})
