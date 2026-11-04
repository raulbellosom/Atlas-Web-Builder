import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { defineResources, resolveHandler, normalizeList } from '../resources/contract.js'
import { ResourceView, useResources } from '../resources/useResources.jsx'
import { followRedirect, isSafeRedirect } from '../resources/navigate.js'

describe('defineResources', () => {
  it('returns valid handlers untouched and allows custom keys', () => {
    const r = { products: () => [], forms: { get: () => ({}), submit: () => ({}) }, custom: 1 }
    expect(defineResources(r)).toBe(r)
  })

  it('rejects malformed shapes with a readable message', () => {
    expect(() => defineResources({ products: 'x' })).toThrow(/products must be a function/)
    expect(() => defineResources({ cart: { get: () => {}, add: 1 } })).toThrow(/cart\.add/)
    expect(() => defineResources(null)).toThrow(TypeError)
  })
})

describe('helpers', () => {
  it('resolves dotted handlers and normalizes lists', () => {
    const fn = () => 1
    expect(resolveHandler({ forms: { get: fn } }, 'forms.get')).toBe(fn)
    expect(resolveHandler({}, 'forms.get')).toBeUndefined()
    expect(normalizeList([1]).items).toEqual([1])
    expect(normalizeList({ items: [2], total: 9 })).toEqual({ items: [2], total: 9 })
    expect(normalizeList(undefined).items).toEqual([])
  })

  it('only follows safe redirects', () => {
    const seen = []
    expect(isSafeRedirect('javascript:alert(1)')).toBe(false)
    expect(isSafeRedirect('//evil.com')).toBe(false)
    expect(followRedirect('https://pay.test/x', (u) => seen.push(u))).toBe(true)
    expect(followRedirect('javascript:1', (u) => seen.push(u))).toBe(false)
    expect(seen).toEqual(['https://pay.test/x'])
  })
})

describe('ResourceView', () => {
  it('renders loading, then data', async () => {
    const resources = { forms: { get: () => Promise.resolve({ title: 'Hola' }) } }
    render(
      <ResourceView resources={resources} path="forms.get" params="f1">
        {(d) => <p>{d.title}</p>}
      </ResourceView>,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Hola')).toBeInTheDocument())
  })

  it('renders the empty and error states', async () => {
    const { rerender } = render(
      <ResourceView resources={{ products: () => [] }} path="products">
        {() => <p>x</p>}
      </ResourceView>,
    )
    await waitFor(() => expect(screen.getByText(/No hay elementos/)).toBeInTheDocument())
    rerender(
      <ResourceView resources={{}} path="products">
        {() => <p>x</p>}
      </ResourceView>,
    )
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})

describe('useResources', () => {
  function Probe({ ctx }) {
    const r = useResources(ctx)
    return <span>{Object.keys(r).join(',')}</span>
  }
  it('adds sample catalog handlers only in edit mode', () => {
    const { rerender } = render(<Probe ctx={{ mode: 'edit', resources: {} }} />)
    expect(screen.getByText(/products/)).toBeInTheDocument()
    rerender(<Probe ctx={{ mode: 'view', resources: {} }} />)
    expect(screen.queryByText(/products/)).toBeNull()
  })
})
