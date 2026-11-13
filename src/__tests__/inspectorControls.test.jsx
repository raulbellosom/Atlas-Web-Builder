import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AtlasWebBuilderEditor } from '../editor/AtlasWebBuilderEditor.jsx'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { useEditorStoreInstance } from '../editor/store/EditorStoreProvider.jsx'
import { UnitInput, NumberInput } from '../editor/ui/NumericControls.jsx'
import { Combobox, SegmentedControl } from '../editor/ui/ChoiceControls.jsx'
import { Popover } from '../editor/ui/OverlayControls.jsx'
import { serializePage, parsePage } from '../persistence/serializePage.js'

let store
function Probe() { store = useEditorStoreInstance(); return null }
const block = defineBlock({ type: 'Controls', label: 'Controles', defaultProps: { title: 'Base', amount: 2, locked: 'Original', gap: '12px' },
  fields: { title: { type: 'text', label: 'Título' }, amount: { type: 'number', label: 'Cantidad', min: 0, max: 10 }, locked: { type: 'text', label: 'Protegido', readOnly: true }, gap: { type: 'unit', label: 'Separación', group: 'Layout' } }, render: ({ title }) => <h1>{title}</h1> })

describe('coherent controls preserve the existing value contract', () => {
  it('marks inherited/modified/read-only, resets known defaults and retains unknown data', () => {
    const page = { schemaVersion: 1, id: 'p', title: 'p', slug: '/', visibility: 'public', regions: { main: { children: ['b'] } }, blocks: { b: { id: 'b', type: 'Controls', props: { title: 'Cambio', locked: 'Histórico', custom: { untouched: true }, _opacity: .4 } } } }
    const view = render(<AtlasWebBuilderEditor blocks={[block]} initialPage={page} brandLogo={<Probe />} />)
    fireEvent.click(view.container.querySelector('[data-block-id="b"]'))
    expect(view.container.querySelector('[data-property="title"]')).toHaveAttribute('data-value-state', 'modified')
    expect(view.container.querySelector('[data-property="amount"]')).toHaveAttribute('data-value-state', 'inherited')
    expect(screen.getByLabelText('Protegido')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Protegido'), { target: { value: 'No permitido' } })
    expect(store.getState().page.blocks.b.props.locked).toBe('Histórico')
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer Título' }))
    expect(screen.getByLabelText('Título')).toHaveValue('Base')
    expect(view.container.querySelector('[data-property="title"]')).toHaveAttribute('data-value-state', 'default')
    fireEvent.click(screen.getByRole('button', { name: /^Layout/ }))
    fireEvent.change(screen.getByLabelText('Unidad de Separación'), { target: { value: 'rem' } })
    expect(store.getState().page.blocks.b.props.gap).toBe('12rem')
    const reopened = parsePage(serializePage(store.getState().page))
    expect(reopened.blocks.b.props).toEqual({ title: 'Base', locked: 'Histórico', custom: { untouched: true }, _opacity: .4, gap: '12rem' })
  })

  it('rejects out-of-range numeric drafts and exposes increments without coercing unknown units', () => {
    const change = vi.fn()
    render(<><NumberInput label="Número" value={2} min={0} max={5} onChange={change} /><UnitInput label="Ancho" value="calc(100% - 2rem)" onChange={change} /></>)
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Número' }), { target: { value: '8' } })
    expect(change).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('No se ha aplicado')
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar Número' }))
    expect(change).toHaveBeenLastCalledWith(3)
    expect(screen.getByRole('spinbutton', { name: 'Ancho' })).toBeDisabled()
    expect(screen.getByText(/calc\(100% - 2rem\)/)).toBeInTheDocument()
  })

  it('searches only declared options, supports keyboard selection and preserves string values', () => {
    const change = vi.fn()
    render(<Combobox label="Familia" value="one" onChange={change} options={[{ value: 'one', label: 'Primera' }, { value: 'two', label: 'Segunda' }]} />)
    const input = screen.getByRole('combobox', { name: 'Familia' })
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Seg' } })
    expect(change).not.toHaveBeenCalled()
    expect(screen.getByRole('option')).toHaveTextContent('Segunda')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(change).toHaveBeenCalledWith('two')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('uses arrow keys for segmented selection and returns focus after closing a popover', () => {
    const change = vi.fn()
    render(<><SegmentedControl label="Alinear" value="left" onChange={change} options={['left', 'center', 'right']} /><Popover label="Opciones"><input aria-label="Detalle" /></Popover></>)
    fireEvent.keyDown(screen.getByRole('radio', { name: 'left' }), { key: 'ArrowRight' })
    expect(change).toHaveBeenCalledWith('center')
    const trigger = screen.getByRole('button', { name: 'Opciones' })
    trigger.focus(); fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
