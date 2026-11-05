import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { createLinkGuard } from '../editor/linkGuard.js'

const Probe = defineBlock({
  type: 'Probe',
  label: 'Probe',
  defaultProps: {},
  fields: {},
  render: ({ ctx }) => <p>{ctx.nested ? `dentro de ${ctx.parent.type}` : 'suelto'}</p>,
})
const Box = defineBlock({
  type: 'Box',
  label: 'Box',
  defaultProps: {},
  fields: {},
  render: ({ ctx }) => <div>{ctx.slot('children')}</div>,
})

describe('ctx.nested / ctx.parent', () => {
  it('tells a block whether it sits in a region or inside another block', () => {
    const page = {
      schemaVersion: 1, id: 'p', slug: '/', title: 'p', visibility: 'public',
      regions: { main: { id: 'r', children: ['top', 'box'] } },
      blocks: {
        top: { id: 'top', type: 'Probe', props: {}, children: {} },
        box: { id: 'box', type: 'Box', props: {}, children: { children: ['inner'] } },
        inner: { id: 'inner', type: 'Probe', props: {}, children: {} },
      },
    }
    render(<AtlasWebBuilderProvider blocks={[Probe, Box]}><AtlasWebRenderer page={page} mode="public" /></AtlasWebBuilderProvider>)
    expect(screen.getByText('suelto')).toBeTruthy()
    expect(screen.getByText('dentro de Box')).toBeTruthy()
  })
})

describe('createLinkGuard', () => {
  it('stops same-tab navigation and reports the href; leaves new-tab links alone', () => {
    const onLinkClick = vi.fn()
    const guard = createLinkGuard(onLinkClick)
    render(
      <div onClickCapture={guard}>
        <a href="/contacto">interno</a>
        <a href="https://example.com" target="_blank" rel="noreferrer">externo</a>
      </div>,
    )
    const internal = fireEvent.click(screen.getByText('interno'))
    expect(internal).toBe(false) // default prevented
    expect(onLinkClick).toHaveBeenCalledWith('/contacto')
    expect(fireEvent.click(screen.getByText('externo'))).toBe(true)
    expect(onLinkClick).toHaveBeenCalledTimes(1)
  })
})
