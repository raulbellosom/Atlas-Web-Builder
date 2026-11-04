import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EditorStoreProvider } from '../editor/store/EditorStoreProvider.jsx'
import { SeoPanel } from '../editor/seo/SeoPanel.jsx'
import { SeoContext } from '../editor/seo/SeoContext.js'

const page = { schemaVersion: 1, id: 'p', slug: '/servicios', title: 'Servicios', visibility: 'public', regions: { main: { id: 'r', children: [] } }, blocks: {} }

describe('SeoPanel site context', () => {
  it('uses the host-provided base URL for the previews', () => {
    render(
      <EditorStoreProvider initialPage={page}>
        <SeoContext.Provider value={{ baseUrl: 'https://sitio.example.com', site: { name: 'Mi sitio' } }}>
          <SeoPanel />
        </SeoContext.Provider>
      </EditorStoreProvider>,
    )
    expect(screen.getAllByText(/sitio\.example\.com/i).length).toBeGreaterThan(0)
  })
})

describe('SeoPanel social image picker', () => {
  it('stores {url, assetId} from the asset library and can remove it', async () => {
    const { createInMemoryAssetSource } = await import('../assets/createAssetSource.js')
    const { AtlasWebBuilderProvider } = await import('../provider/AtlasWebBuilderProvider.jsx')
    const { createBlockRegistry } = await import('../registry/createBlockRegistry.js')
    const { fireEvent, waitFor } = await import('@testing-library/react')
    const assets = createInMemoryAssetSource([{ id: 'a1', kind: 'image', url: 'https://x.test/og.png', name: 'og' }])
    render(
      <AtlasWebBuilderProvider blockRegistry={createBlockRegistry([])} assets={assets}>
        <EditorStoreProvider initialPage={page}>
          <SeoPanel />
        </EditorStoreProvider>
      </AtlasWebBuilderProvider>,
    )
    expect(screen.getByText(/1200x630/)).toBeTruthy()
    fireEvent.click(screen.getByText('Elegir o subir imagen'))
    fireEvent.click(await screen.findByText(/Biblioteca/i))
    fireEvent.click(await screen.findByTitle('og').catch(() => screen.findByText('og')))
    await waitFor(() => expect(screen.getByDisplayValue('https://x.test/og.png')).toBeTruthy())
    fireEvent.click(screen.getByText('Quitar'))
    await waitFor(() => expect(screen.queryByDisplayValue('https://x.test/og.png')).toBeNull())
  })
})
