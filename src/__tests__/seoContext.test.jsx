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
