import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AtlasWebBuilderEditor } from '../editor/AtlasWebBuilderEditor.jsx'
import { defineBlock } from '../registry/createBlockRegistry.js'

const Hero = defineBlock({
  type: 'Hero',
  label: 'Hero',
  category: 'hero',
  defaultProps: { title: 'Hola' },
  fields: { title: { type: 'text', label: 'Título' } },
  render: ({ title }) => <h1>{title}</h1>,
})

describe('AtlasWebBuilderEditor', () => {
  it('mounts and renders chrome without crashing', () => {
    render(<AtlasWebBuilderEditor blocks={[Hero]} />)
    // TopBar brand
    expect(screen.getByText('Atlas WB')).toBeInTheDocument()
    // Empty canvas message
    expect(screen.getByText(/Arrastra un bloque/i)).toBeInTheDocument()
    // Palette item from registry (may also appear as category label)
    expect(screen.getAllByText('Hero').length).toBeGreaterThanOrEqual(1)
  })
})
