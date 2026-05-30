import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import {
  NotificationsProvider,
  useNotifications,
} from '../editor/notifications/NotificationsProvider.jsx'
import { NotificationCenter } from '../editor/notifications/NotificationCenter.jsx'

function Harness({ exposeApi }) {
  const api = useNotifications()
  exposeApi(api)
  return <NotificationCenter />
}

function setup() {
  let api
  render(
    <NotificationsProvider defaultTtl={1000}>
      <Harness
        exposeApi={(a) => {
          api = a
        }}
      />
    </NotificationsProvider>,
  )
  return () => api
}

describe('notifications', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('throws when useNotifications is used outside the provider', () => {
    const Boom = () => {
      useNotifications()
      return null
    }
    const orig = console.error
    console.error = () => {}
    expect(() => render(<Boom />)).toThrow()
    console.error = orig
  })

  it('notify pushes an item and dismiss removes it', () => {
    const getApi = setup()
    act(() => {
      getApi().notify('info', 'Hola', 0)
    })
    expect(screen.getByText('Hola')).toBeInTheDocument()
    const id = getApi().items[0].id
    act(() => {
      getApi().dismiss(id)
    })
    expect(screen.queryByText('Hola')).not.toBeInTheDocument()
  })

  it('auto-dismisses after TTL elapses', () => {
    const getApi = setup()
    act(() => {
      getApi().notify('success', 'Listo')
    })
    expect(screen.getByText('Listo')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(screen.queryByText('Listo')).not.toBeInTheDocument()
  })

  it('error notifications use role="alert"', () => {
    const getApi = setup()
    act(() => {
      getApi().notify('error', 'Fallo', 0)
    })
    const region = screen.getByRole('alert')
    expect(region).toHaveTextContent('Fallo')
  })

  it('clear() removes every item', () => {
    const getApi = setup()
    act(() => {
      getApi().notify('info', 'a', 0)
      getApi().notify('info', 'b', 0)
    })
    expect(getApi().items).toHaveLength(2)
    act(() => {
      getApi().clear()
    })
    expect(getApi().items).toHaveLength(0)
  })
})
