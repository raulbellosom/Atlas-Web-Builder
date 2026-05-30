import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AtlasWebBuilderEditor } from '../editor/AtlasWebBuilderEditor.jsx'
import { HeadingBlock } from '../blocks/HeadingBlock.jsx'

function makePage(initialText) {
  return {
    schemaVersion: 1,
    id: 'p1',
    slug: '/',
    title: 'Test',
    visibility: 'public',
    layoutId: null,
    regions: { main: { id: 'r1', children: ['h1'] } },
    blocks: {
      h1: {
        id: 'h1',
        type: 'HeadingBlock',
        props: { text: initialText, level: 'h2', color: 'fg', size: '', align: 'left' },
        children: {},
      },
    },
    seo: { title: '', description: '', canonical: null, ogImageAssetId: null },
    updatedAt: new Date().toISOString(),
  }
}

describe('inline editing', () => {
  it('renders heading with data-atlas-inline-prop marker', () => {
    render(<AtlasWebBuilderEditor blocks={[HeadingBlock]} initialPage={makePage('Hola mundo')} />)
    const node = document.querySelector('h2[data-atlas-inline-prop="text"]')
    expect(node).not.toBeNull()
    expect(node?.textContent).toBe('Hola mundo')
  })

  it('switches into contenteditable mode on double click', () => {
    render(<AtlasWebBuilderEditor blocks={[HeadingBlock]} initialPage={makePage('Hola')} />)
    const node = document.querySelector('h2[data-atlas-inline-prop="text"]')
    expect(node).not.toBeNull()
    act(() => {
      fireEvent.doubleClick(node)
    })
    const editing = document.querySelector('h2[data-atlas-inline-editing="true"]')
    expect(editing).not.toBeNull()
    expect(editing?.getAttribute('contenteditable')).toBe('true')
  })

  it('commits the new text on blur and exits edit mode', () => {
    render(<AtlasWebBuilderEditor blocks={[HeadingBlock]} initialPage={makePage('Antes')} />)
    const node = document.querySelector('h2[data-atlas-inline-prop="text"]')
    act(() => {
      fireEvent.doubleClick(node)
    })
    const editing = document.querySelector('h2[data-atlas-inline-editing="true"]')
    expect(editing).not.toBeNull()
    // Simulate user typing by mutating the DOM (contenteditable is native).
    editing.innerText = 'Después'
    act(() => {
      fireEvent.blur(editing)
    })
    // Editing element should be replaced by the static node with the new text.
    const after = document.querySelector('h2[data-atlas-inline-prop="text"]')
    expect(after).not.toBeNull()
    expect(after?.textContent).toBe('Después')
    expect(document.querySelector('[data-atlas-inline-editing="true"]')).toBeNull()
  })
})

// Reference unused symbol to silence linters if any block imports drop.
void screen
