import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
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

function setViewportWidth(width) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
}

afterEach(() => {
  cleanup()
  setViewportWidth(1024)
})

describe('panel state tracks viewport width after mount', () => {
  it('closes both side panels once the viewport crosses into the mobile breakpoint', () => {
    setViewportWidth(1400)
    const { container } = render(<AtlasWebBuilderEditor blocks={[Hero]} />)
    const root = container.querySelector('.atlas-wb-editor')
    expect(root.hasAttribute('data-left-closed')).toBe(false)
    expect(root.hasAttribute('data-right-closed')).toBe(false)

    // User shrinks the browser window below the CSS mobile breakpoint (960px)
    // without remounting the editor.
    act(() => setViewportWidth(700))

    expect(root.hasAttribute('data-left-closed')).toBe(true)
    expect(root.hasAttribute('data-right-closed')).toBe(true)
  })
})
