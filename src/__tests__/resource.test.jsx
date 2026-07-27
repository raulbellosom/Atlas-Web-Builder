import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useResource } from '../renderer/useResource.js'
import { ResourceBoundary } from '../renderer/ResourceBoundary.jsx'

function Harness({ resourcesMap, name, params, exposeState }) {
  const state = useResource(resourcesMap, name, params)
  exposeState(state)
  return <div data-testid="state">{state.loading ? 'loading' : 'settled'}</div>
}

function setup(initialProps) {
  let state
  const exposeState = (s) => {
    state = s
  }
  const utils = render(<Harness {...initialProps} exposeState={exposeState} />)
  return {
    getState: () => state,
    rerenderWith: (props) => utils.rerender(<Harness {...props} exposeState={exposeState} />),
    unmount: utils.unmount,
  }
}

describe('useResource', () => {
  it('starts in a loading state', () => {
    const { getState } = setup({
      resourcesMap: { products: () => new Promise(() => {}) },
      name: 'products',
      params: {},
    })
    expect(getState().loading).toBe(true)
    expect(getState().data).toBeUndefined()
  })

  it('resolves data and flips loading to false', async () => {
    const { getState } = setup({
      resourcesMap: { products: () => Promise.resolve([{ id: '1', name: 'Silla' }]) },
      name: 'products',
      params: {},
    })
    await waitFor(() => expect(getState().loading).toBe(false))
    expect(getState().data).toEqual([{ id: '1', name: 'Silla' }])
    expect(getState().error).toBeNull()
    expect(getState().empty).toBe(false)
  })

  it('marks empty when the resolved value is an empty array', async () => {
    const { getState } = setup({
      resourcesMap: { products: () => Promise.resolve([]) },
      name: 'products',
      params: {},
    })
    await waitFor(() => expect(getState().loading).toBe(false))
    expect(getState().empty).toBe(true)
  })

  it('captures an error when the fetcher rejects', async () => {
    const { getState } = setup({
      resourcesMap: { products: () => Promise.reject(new Error('network down')) },
      name: 'products',
      params: {},
    })
    await waitFor(() => expect(getState().loading).toBe(false))
    expect(getState().error).toBeInstanceOf(Error)
    expect(getState().error.message).toBe('network down')
  })

  it('errors clearly when the named resource is not registered', async () => {
    const { getState } = setup({ resourcesMap: {}, name: 'products', params: {} })
    await waitFor(() => expect(getState().loading).toBe(false))
    expect(getState().error.message).toMatch(/No resource registered for "products"/)
  })

  it('refetches when params change', async () => {
    const fetcher = vi.fn((p) => Promise.resolve(p.page))
    const resourcesMap = { products: fetcher }
    const { getState, rerenderWith } = setup({ resourcesMap, name: 'products', params: { page: 1 } })
    await waitFor(() => expect(getState().data).toBe(1))

    rerenderWith({ resourcesMap, name: 'products', params: { page: 2 } })
    await waitFor(() => expect(getState().data).toBe(2))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not update state after unmount', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let resolveFetch
    const fetcher = () => new Promise((resolve) => { resolveFetch = resolve })
    const { unmount } = setup({ resourcesMap: { products: fetcher }, name: 'products', params: {} })
    unmount()
    resolveFetch([{ id: '1' }])
    await new Promise((r) => setTimeout(r, 0))
    const warned = consoleError.mock.calls.some((args) =>
      String(args[0]).includes('Cannot update a component'),
    )
    expect(warned).toBe(false)
    consoleError.mockRestore()
  })
})

describe('ResourceBoundary', () => {
  it('passes data/loading/error/empty through to its render-prop children, scoped by ctx', async () => {
    const ctx = { resources: { products: () => Promise.resolve([{ id: '1' }]) } }
    render(
      <ResourceBoundary ctx={ctx} resource="products" query={{}}>
        {({ data, loading }) => (
          <p data-testid="rb">{loading ? 'loading' : JSON.stringify(data)}</p>
        )}
      </ResourceBoundary>,
    )
    expect(screen.getByTestId('rb').textContent).toBe('loading')
    await waitFor(() => expect(screen.getByTestId('rb').textContent).toBe('[{"id":"1"}]'))
  })
})
