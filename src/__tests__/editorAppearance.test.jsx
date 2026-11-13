import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AtlasWebBuilderEditor } from '../editor/AtlasWebBuilderEditor.jsx'
import { baseBlocks } from '../blocks/index.js'
import { useEditorStoreInstance } from '../editor/store/EditorStoreProvider.jsx'
import { EditorAppearanceProvider, EditorPortal } from '../editor/ui/EditorAppearance.jsx'

const page = { schemaVersion: 1, id: 'p', title: 'Sitio blanco', slug: '/', visibility: 'public', regions: { main: { children: ['h'] } }, blocks: { h: { id: 'h', type: 'HeadingBlock', props: { text: 'Original', unknown: { keep: true } } } } }
let store
function Probe() { store = useEditorStoreInstance(); return null }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null }) })

describe('editor appearance without document mutations', () => {
  it('changes controlled appearance without replacing the store, selection or undo history', () => {
    const callback = vi.fn()
    const props = { blocks: baseBlocks, initialPage: page, brandLogo: <Probe />, onAppearanceChange: callback }
    const view = render(<AtlasWebBuilderEditor {...props} appearance="light" />)
    fireEvent.click(view.container.querySelector('[data-block-id="h"]'))
    fireEvent.change(screen.getByLabelText('Texto', { exact: true }), { target: { value: 'Editado' } })
    const original = store, history = store.temporal.getState().pastStates.length
    fireEvent.change(screen.getByLabelText('Apariencia del editor'), { target: { value: 'dark' } })
    expect(callback).toHaveBeenCalledWith('dark')
    view.rerender(<AtlasWebBuilderEditor {...props} appearance="dark" />)
    expect(store).toBe(original)
    expect(store.getState().selectedId).toBe('h')
    expect(store.getState().page.blocks.h.props).toEqual({ text: 'Editado', unknown: { keep: true } })
    expect(store.temporal.getState().pastStates.length).toBe(history)
    expect(view.container.querySelector('[data-appearance="dark"]')).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--awb-bg')).toBe('')
    act(() => store.temporal.getState().undo())
    expect(store.getState().page.blocks.h.props.text).toBe('Original')
  })

  it('follows system changes and keeps independent editor instances independent', () => {
    const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => media) })
    const view = render(<><EditorAppearanceProvider><p>Automático</p></EditorAppearanceProvider><EditorAppearanceProvider appearance="light"><p>Fijo</p></EditorAppearanceProvider></>)
    act(() => { media.matches = true; for (const [, fn] of media.addEventListener.mock.calls) fn() })
    const roots = view.container.querySelectorAll('.atlas-wb-editor-scope')
    expect(roots[0].dataset.appearance).toBe('dark')
    expect(roots[1].dataset.appearance).toBe('light')
    view.unmount()
    expect(media.removeEventListener).toHaveBeenCalled()
  })

  it('moves a themed portal into the editor fullscreen element', () => {
    const view = render(<EditorAppearanceProvider appearance="dark"><section data-testid="fullscreen" /><EditorPortal><p>Overlay</p></EditorPortal></EditorAppearanceProvider>)
    const section = screen.getByTestId('fullscreen')
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: section })
    act(() => document.dispatchEvent(new Event('fullscreenchange')))
    expect(section.querySelector('.atlas-wb-overlay-scope')).toHaveAttribute('data-appearance', 'dark')
    expect(view.container.querySelector('p')).toHaveTextContent('Overlay')
  })
})
