import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { EditorStoreProvider, useEditorStore } from '../editor/store/EditorStoreProvider.jsx'
import { UniversalEffects } from '../editor/chrome/UniversalEffects.jsx'
import { baseBlocks } from '../blocks/index.js'
import { validateUniversalProp } from '../renderer/universalProps.js'

afterEach(cleanup)

const page = (type, props = {}) => ({ schemaVersion: 1, id: 'p', slug: '/', title: 't', visibility: 'public', regions: { main: { id: 'main', children: ['b'] } }, blocks: { b: { id: 'b', type, props } }, seo: {} })

function Panel() {
  const block = useEditorStore((state) => state.page.blocks.b)
  const preview = useEditorStore((state) => state.effectPreview)
  const def = baseBlocks.find((candidate) => candidate.type === block.type)
  return (
    <>
      <output data-testid="props">{JSON.stringify(block.props)}</output>
      <output data-testid="preview">{JSON.stringify(preview)}</output>
      <UniversalEffects merged={{ ...def.defaultProps, ...block.props }} def={def} selectedId="b" />
    </>
  )
}
const mount = (type, props) => render(<AtlasWebBuilderProvider blocks={baseBlocks}><EditorStoreProvider initialPage={page(type, props)}><Panel /></EditorStoreProvider></AtlasWebBuilderProvider>)
const stored = () => JSON.parse(screen.getByTestId('props').textContent)
const slider = (label, value) => fireEvent.change(screen.getByLabelText(`${label} (deslizador)`), { target: { value: String(value) } })
const everyPropIsInTheContract = () => { for (const [name, value] of Object.entries(stored())) if (name.startsWith('_')) expect(validateUniversalProp(name, value), `${name}: ${JSON.stringify(value)}`).toEqual({ ok: true, errors: [] }) }

describe('effects inspector writes exactly the contract shape', () => {
  it('entrance: preset-specific intensity controls appear and are stored in range', () => {
    mount('HeadingBlock', {})
    fireEvent.change(screen.getByDisplayValue('Sin animación'), { target: { value: 'slide-up' } })
    expect(stored()._animation.preset).toBe('slide-up')
    fireEvent.change(screen.getByLabelText('Distancia del desplazamiento'), { target: { value: '120' } })
    expect(stored()._animation.distance).toBe(120)
    expect(screen.queryByLabelText('Escala inicial')).toBeNull()
    expect(screen.queryByLabelText('Intensidad del desenfoque')).toBeNull()
    fireEvent.change(screen.getByDisplayValue('Subir desde abajo'), { target: { value: 'zoom-in' } })
    fireEvent.change(screen.getByLabelText('Escala inicial'), { target: { value: '0.7' } })
    expect(stored()._animation).toMatchObject({ preset: 'zoom-in', scaleFrom: 0.7, distance: 120 })
    fireEvent.change(screen.getByDisplayValue('Zoom — crecer'), { target: { value: 'blur-in' } })
    fireEvent.change(screen.getByLabelText('Intensidad del desenfoque'), { target: { value: '25' } })
    expect(stored()._animation.blur).toBe(25)
    fireEvent.click(screen.getByRole('checkbox', { name: /Repetir cada vez/ }))
    expect(stored()._animation.once).toBe(false)
    fireEvent.click(screen.getByRole('checkbox', { name: /Repetir cada vez/ }))
    expect(stored()._animation.once).toBeUndefined()
    everyPropIsInTheContract()
  })

  it('"Reproducir entrada" replays the animation in the canvas only when there is one', () => {
    mount('HeadingBlock', {})
    expect(screen.queryByRole('button', { name: 'Reproducir entrada' })).toBeNull()
    fireEvent.change(screen.getByDisplayValue('Sin animación'), { target: { value: 'fade-in' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir entrada' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir entrada' }))
    expect(JSON.parse(screen.getByTestId('preview').textContent)).toEqual({ id: 'b', nonce: 2 })
    expect(stored()).not.toHaveProperty('effectPreview')
  })

  it('pressed state: stores scale and brightness, and clears itself at the defaults', () => {
    mount('ButtonBlock', {})
    slider('Escala al presionar', 0.94)
    expect(stored()._pressed).toEqual({ scale: 0.94, brightness: 100 })
    slider('Brillo al presionar', 85)
    expect(stored()._pressed).toEqual({ scale: 0.94, brightness: 85 })
    slider('Escala al presionar', 1); slider('Brillo al presionar', 100)
    expect(stored()._pressed).toBeUndefined()
    slider('Escala al presionar', 0.9)
    everyPropIsInTheContract()
    expect(screen.getByText(/en pantallas táctiles se usa este estado/)).toBeTruthy()
  })

  it('Ken Burns appears only on blocks with an image and writes a valid shape', () => {
    mount('HeadingBlock', {})
    expect(screen.queryByText(/Ken Burns/)).toBeNull()
    cleanup()
    mount('ImageBlock', { src: '/a.png' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Activar Ken Burns' }))
    expect(stored()._kenburns).toEqual({ zoom: 1.15, direction: 'in', pan: 'none', duration: 12000, easing: 'ease-in-out' })
    fireEvent.change(screen.getByLabelText('Dirección del zoom'), { target: { value: 'out' } })
    fireEvent.change(screen.getByLabelText('Desplazamiento'), { target: { value: 'left' } })
    slider('Acercamiento', 1.3); slider('Duración del efecto', 20)
    expect(stored()._kenburns).toEqual({ zoom: 1.3, direction: 'out', pan: 'left', duration: 20000, easing: 'ease-in-out' })
    everyPropIsInTheContract()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Activar Ken Burns' }))
    expect(stored()._kenburns).toBeUndefined()
  })
})
