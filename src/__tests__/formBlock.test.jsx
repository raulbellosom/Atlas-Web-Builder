import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { parseFieldsDsl, validateFields } from '../forms/fields.js'
import { FormBlock } from '../blocks/FormBlock.jsx'

const Render = FormBlock.render
const ctxWith = (resources, mode = 'view') => ({ mode, resources, blockId: 'b1' })
const props = (over = {}) => ({ ...FormBlock.defaultProps, ...over })

describe('forms DSL and validation', () => {
  it('parses lines, required flags, options and unique names', () => {
    const f = parseFieldsDsl('Nombre | text | required\n# nota\nPlan | select | | Básico, Pro\nNombre | text')
    expect(f.map((x) => x.name)).toEqual(['nombre', 'plan', 'nombre_2'])
    expect(f[0].required).toBe(true)
    expect(f[1].options.map((o) => o.value)).toEqual(['Básico', 'Pro'])
    expect(parseFieldsDsl('X | bogus')[0].type).toBe('text')
  })

  it('validates required, email, tel', () => {
    const fields = parseFieldsDsl('A | text | *\nB | email\nC | tel\nD | checkbox | *')
    const errs = validateFields(fields, { b: 'nope', c: '12', d: false })
    expect(Object.keys(errs).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(validateFields(fields, { a: 'x', b: 'a@b.co', c: '+52 55 1234 5678', d: true })).toEqual({})
  })
})

describe('FormBlock', () => {
  const fill = () => {
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText(/Correo/), { target: { value: 'ana@x.com' } })
    fireEvent.change(screen.getByLabelText(/Mensaje/), { target: { value: 'Hola' } })
  }

  it('shows accessible errors and does not submit when invalid', () => {
    const submit = vi.fn()
    render(<Render {...props()} ctx={ctxWith({ forms: { submit } })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/Nombre/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByText('Este campo es obligatorio.').length).toBeGreaterThan(0)
  })

  it('submits once (double-submit guard), reports success and omits the honeypot', async () => {
    let resolve
    const submit = vi.fn(() => new Promise((r) => (resolve = r)))
    render(<Render {...props()} ctx={ctxWith({ forms: { submit } })} />)
    fill()
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(submit).toHaveBeenCalledTimes(1)
    expect(submit.mock.calls[0][1]).toEqual({ nombre: 'Ana', correo: 'ana@x.com', mensaje: 'Hola' })
    resolve({})
    await waitFor(() => expect(screen.getByText(/recibimos tu mensaje/)).toBeInTheDocument())
  })

  it('silently succeeds without calling the handler when the honeypot is filled', async () => {
    const submit = vi.fn()
    const { container } = render(<Render {...props()} ctx={ctxWith({ forms: { submit } })} />)
    fill()
    fireEvent.change(container.querySelector('[name="_hp"]'), { target: { value: 'spam' } })
    fireEvent.submit(screen.getByRole('form'))
    await waitFor(() => expect(screen.getByText(/recibimos tu mensaje/)).toBeInTheDocument())
    expect(submit).not.toHaveBeenCalled()
  })

  it('requires consent when enabled', () => {
    const submit = vi.fn()
    render(<Render {...props({ consentEnabled: true })} ctx={ctxWith({ forms: { submit } })} />)
    fill()
    fireEvent.submit(screen.getByRole('form'))
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByText('Debes aceptar para continuar.')).toBeInTheDocument()
  })

  it('loads the schema from forms.get when formId is set', async () => {
    const resources = {
      forms: { get: async () => ({ fields: [{ label: 'Empresa', type: 'text' }], submitLabel: 'Listo' }), submit: vi.fn() },
    }
    render(<Render {...props({ formId: 'f1' })} ctx={ctxWith(resources)} />)
    await waitFor(() => expect(screen.getByLabelText('Empresa')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Listo' })).toBeInTheDocument()
  })

  it('is non-interactive in edit mode', () => {
    const submit = vi.fn()
    render(<Render {...props()} ctx={ctxWith({ forms: { submit } }, 'edit')} />)
    expect(screen.getByLabelText(/Nombre/)).toBeDisabled()
    fireEvent.submit(screen.getByRole('form'))
    expect(submit).not.toHaveBeenCalled()
  })

  it('shows a placeholder in edit mode without a handler', () => {
    render(<Render {...props()} ctx={ctxWith({}, 'edit')} />)
    expect(screen.getByText(/sin manejador/)).toBeInTheDocument()
  })
})
