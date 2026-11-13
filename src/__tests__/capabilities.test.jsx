import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { AtlasWebBuilderEditor } from '../editor/AtlasWebBuilderEditor.jsx'
import { useEditorStoreInstance } from '../editor/store/EditorStoreProvider.jsx'
import { baseBlocks } from '../blocks/index.js'
import { defaultTheme } from '../theme/defaultTheme.js'
import { assertEditorCapabilities } from '../editor/capabilities.jsx'
import { serializePage } from '../persistence/serializePage.js'

const capabilities = {
  schemaVersion: 1, effects: false, seo: false, pageMetadata: false,
  templates: false, pageCreation: false, jsonImport: false, manualAssetUrls: false,
  themeBrand: false, themeReset: false, themeTokenGroups: ['color'],
  themeTokenPatterns: { color: '^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$' },
}
const page = () => ({
  schemaVersion: 1, id: 'p', slug: '/', title: 'Inicio', visibility: 'public',
  regions: { main: { children: ['h'] } },
  blocks: { h: { id: 'h', type: 'HeadingBlock', props: { text: 'Original', _opacity: 0.4, customHistorical: 'conservar' } } },
  seo: { title: 'SEO histórico' },
})
let store
function Probe() { store = useEditorStoreInstance(); return null }
function mount(props = {}) {
  return render(<AtlasWebBuilderEditor blocks={baseBlocks} initialPage={page()} theme={defaultTheme}
    capabilities={capabilities} brandLogo={<Probe />} {...props} />)
}

describe('editor capabilities v1', () => {
  it('edits a supported field and preserves historical unsupported values on save', () => {
    const save = vi.fn()
    const { container } = mount({ onSaveDraft: save })
    fireEvent.click(container.querySelector('[data-block-id="h"]'))
    fireEvent.change(screen.getByLabelText('Texto', { exact: true }), { target: { value: 'Conservado exactamente' } })
    fireEvent.click(screen.getByRole('button', { name: /^Efectos/ }))
    const boundary = container.querySelector('[data-atlas-capability="effects"]')
    expect(boundary.querySelector('input[type=range]')).toBeDisabled()
    expect(within(boundary).getByRole('note')).toHaveTextContent('Los valores existentes se conservan')
    fireEvent.click(screen.getByRole('button', { name: /Guardar borrador/i }))
    expect(save.mock.calls[0][0].blocks.h.props).toEqual({ text: 'Conservado exactamente', _opacity: 0.4, customHistorical: 'conservar' })
    expect(save.mock.calls[0][0].seo).toEqual({ title: 'SEO histórico' })
  })

  it('makes metadata and SEO read-only instead of deleting them', () => {
    const { container } = mount()
    fireEvent.click(screen.getByRole('tab', { name: 'Página', exact: true }))
    for (const name of ['pageMetadata', 'seo']) {
      const boundary = container.querySelector(`[data-atlas-capability="${name}"]`)
      expect(boundary).toBeDisabled()
      expect(boundary.querySelector('input')).toBeDisabled()
    }
    expect(store.getState().page).toEqual(page())
    fireEvent.click(screen.getByRole('tab', { name: 'Páginas', exact: true }))
    expect(screen.getByRole('button', { name: '+ Nueva', exact: true })).toBeDisabled()
  })

  it('keeps valid colors editable, rejects invalid color drafts and locks other tokens', () => {
    mount()
    fireEvent.click(screen.getByRole('tab', { name: 'Tema', exact: true }))
    expect(screen.getByRole('button', { name: 'Restablecer', exact: true })).toBeDisabled()
    expect(screen.getByLabelText('font.sans')).toBeDisabled()
    expect(screen.getByLabelText('shadow.md')).toBeDisabled()
    const input = screen.getByLabelText('color.primary', { selector: 'input[type=text]' })
    fireEvent.change(input, { target: { value: 'red' } })
    expect(input.checkValidity()).toBe(false)
    expect(screen.getByRole('alert')).toHaveTextContent('Color no válido')
    expect(store.getState().theme.tokens.color.primary).toBe(defaultTheme.tokens.color.primary)
    fireEvent.change(input, { target: { value: '#12345678' } })
    expect(input.checkValidity()).toBe(true)
    expect(store.getState().theme.tokens.color.primary).toBe('#12345678')
    expect(store.getState().theme.tokens.font).toEqual(defaultTheme.tokens.font)
  })

  it('keeps image selection in the library and disables unregistered URL/file input', async () => {
    const initial = page()
    initial.blocks.h = { id: 'h', type: 'ImageBlock', props: { src: '', alt: 'Original' } }
    const { container } = mount({ initialPage: initial, assets: { list: async () => [] } })
    fireEvent.click(container.querySelector('[data-block-id="h"]'))
    expect(container.querySelector('input[type=url]')).toHaveAttribute('readonly')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir selector de medios' }))
    const dialog = screen.getByRole('dialog', { name: 'Selector de medios' })
    expect(within(dialog).queryByPlaceholderText('https://ejemplo.com/imagen.jpg')).not.toBeInTheDocument()
    expect(await within(dialog).findByText(/No hay medios/i)).toBeInTheDocument()
    expect(store.getState().page.blocks.h.props).toEqual({ src: '', alt: 'Original' })
  })

  it('preserves standalone behavior when no profile is supplied and rejects newer profiles', () => {
    const { container, unmount } = mount({ capabilities: undefined })
    fireEvent.click(container.querySelector('[data-block-id="h"]'))
    fireEvent.click(screen.getByRole('button', { name: /^Efectos/ }))
    expect(container.querySelector('[data-atlas-capability="effects"] input[type=range]')).not.toBeDisabled()
    fireEvent.click(screen.getByRole('tab', { name: 'Páginas', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva', exact: true }))
    fireEvent.change(screen.getByPlaceholderText('Título de la nueva página'), { target: { value: 'Nueva válida' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear página', exact: true }))
    expect(store.getState().page.visibility).toBe('public')
    expect(() => serializePage(store.getState().page)).not.toThrow()
    unmount()
    expect(() => assertEditorCapabilities({ schemaVersion: 2 })).toThrow(/Unsupported/)
  })
})
