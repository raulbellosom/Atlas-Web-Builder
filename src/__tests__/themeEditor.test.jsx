import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createEditorStore } from '../editor/store/createEditorStore.js'
import { AtlasWebBuilderEditor } from '../editor/AtlasWebBuilderEditor.jsx'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { defineTheme } from '../theme/defaultTheme.js'

describe('theme editor — store', () => {
  it('initializes with the provided theme', () => {
    const custom = defineTheme({
      id: 't',
      name: 'Custom',
      tokens: { color: { primary: '#ff0000' } },
    })
    const store = createEditorStore({ theme: custom })
    expect(store.getState().theme.id).toBe('t')
    expect(store.getState().theme.tokens.color.primary).toBe('#ff0000')
  })

  it('setThemeToken mutates one token without touching others', () => {
    const store = createEditorStore()
    const before = store.getState().theme.tokens.color.primary
    store.getState().setThemeToken('color', 'primary', '#abcdef')
    const after = store.getState().theme.tokens.color
    expect(after.primary).toBe('#abcdef')
    expect(after.bg).toBeDefined()
    expect(after.primary).not.toBe(before)
  })

  it('setTheme replaces the whole theme', () => {
    const store = createEditorStore()
    store.getState().setTheme({ id: 'x', name: 'X', tokens: { color: { primary: '#000' } } })
    expect(store.getState().theme.id).toBe('x')
  })

  it('resetTheme reverts to the initial theme passed at construction', () => {
    const initial = { id: 'i', name: 'Init', tokens: { color: { primary: '#111111' } } }
    const store = createEditorStore({ theme: initial })
    store.getState().setThemeToken('color', 'primary', '#222222')
    expect(store.getState().theme.tokens.color.primary).toBe('#222222')
    store.getState().resetTheme()
    expect(store.getState().theme.tokens.color.primary).toBe('#111111')
  })
})

describe('theme editor — UI', () => {
  const Hero = defineBlock({
    type: 'Hero',
    label: 'Hero',
    defaultProps: { title: 'Hola' },
    render: ({ title }) => <h1>{title}</h1>,
  })

  it('renders theme categories in the right panel', () => {
    render(<AtlasWebBuilderEditor blocks={[Hero]} />)
    // Tab "Tema"
    fireEvent.click(screen.getByRole('tab', { name: /Tema/ }))
    expect(screen.getByText('Color')).toBeInTheDocument()
    expect(screen.getByText('Tipografía')).toBeInTheDocument()
  })

  it('editing a color token updates the input value', () => {
    render(<AtlasWebBuilderEditor blocks={[Hero]} />)
    fireEvent.click(screen.getByRole('tab', { name: /Tema/ }))
    const label = screen.getByText('color.primary')
    const row = label.closest('.atlas-wb-theme__row')
    const text = row.querySelector('input[type="text"]')
    fireEvent.change(text, { target: { value: '#123456' } })
    expect(text.value).toBe('#123456')
  })
})
