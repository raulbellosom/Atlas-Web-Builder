import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { EditorStoreProvider, useEditorStore } from '../editor/store/EditorStoreProvider.jsx'
import { ComponentsPanel, ComponentEditBanner, ComponentReferenceInspector } from '../editor/chrome/ComponentsPanel.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { baseBlocks } from '../blocks/index.js'
import { ComponentRefBlock } from '../blocks/ComponentRefBlock.jsx'
import { createBlockRegistry } from '../registry/createBlockRegistry.js'
import { componentFromBlock, componentIdFromName, detachReference, listOverridable, pageFromComponent, pageToSection, sectionFromComponentPage, withOverride } from '../components/actions.js'
import { COMPONENT_REF_TYPE, overridableFromRegistry, resolveComponents } from '../components/resolve.js'

afterEach(cleanup)
const blocks = [...baseBlocks, ComponentRefBlock]
const registry = createBlockRegistry(blocks)
const overridable = overridableFromRegistry(registry)
const source = () => ({
  schemaVersion: 1, id: 'page', slug: '/', title: 'Prueba', visibility: 'public',
  regions: { main: { id: 'main', children: ['intro', 'footer'] } },
  blocks: {
    intro: { id: 'intro', type: 'TextBlock', props: { text: 'Bienvenido' } },
    footer: { id: 'footer', type: 'ContainerBlock', props: {}, children: { children: ['a', 'b'] } },
    a: { id: 'a', type: 'TextBlock', props: { text: 'Hecho en Runly' } },
    b: { id: 'b', type: 'TextBlock', props: { text: 'Contacto' } },
  },
})

describe('component actions', () => {
  it('builds readable, valid, unique ids', () => {
    expect(componentIdFromName('Pie de página')).toBe('pie-de-pagina')
    expect(componentIdFromName('Pie de página', { 'pie-de-pagina': {} })).toBe('pie-de-pagina-2')
    expect(componentIdFromName('123 !!!')).toBe('componente')
    expect(componentIdFromName('')).toBe('componente')
    expect(componentIdFromName('x'.repeat(100))).toMatch(/^[a-z][a-z0-9-]{0,39}$/)
  })

  it('turns a block into a definition and leaves a reference in the same place', () => {
    const page = source(), snapshot = JSON.stringify(page)
    const { definition, page: next } = componentFromBlock(page, 'footer', '  Pie  ')
    expect(JSON.stringify(page)).toBe(snapshot)
    expect(definition.name).toBe('Pie')
    expect(definition.section.children.children.map((c) => c.props.text)).toEqual(['Hecho en Runly', 'Contacto'])
    expect(next.blocks.footer).toMatchObject({ id: 'footer', type: COMPONENT_REF_TYPE })
    expect(Object.keys(next.blocks).sort()).toEqual(['footer', 'intro'])
    expect(next.regions.main.children).toEqual(['intro', 'footer'])
    expect(() => componentFromBlock(page, 'footer', '  ')).toThrow()
    expect(() => componentFromBlock(next, 'footer', 'Otro')).toThrow(/otros componentes/)
  })

  it('round-trips a definition through the editing page and back', () => {
    const { definition } = componentFromBlock(source(), 'footer', 'Pie')
    const editing = pageFromComponent('pie', definition)
    expect(editing.regions.main.children).toHaveLength(1)
    expect(sectionFromComponentPage(editing)).toEqual(definition.section)
    const two = { ...editing, regions: { main: { id: 'main', children: [...editing.regions.main.children, 'x'] } }, blocks: { ...editing.blocks, x: { id: 'x', type: 'TextBlock', props: {} } } }
    expect(() => sectionFromComponentPage(two)).toThrow(/único elemento raíz/)
    expect(pageToSection(editing, editing.regions.main.children[0]).type).toBe('ContainerBlock')
  })

  it('detaches a reference into an independent copy with overrides applied, in the same position', () => {
    const { definition, page } = componentFromBlock(source(), 'footer', 'Pie')
    page.blocks.footer.props = { componentId: 'pie', overrides: { 'root/children/0': { text: 'Otro pie' } } }
    const { page: detached, errors } = detachReference(page, 'footer', { pie: definition }, { overridable })
    expect(errors).toEqual([])
    expect(Object.values(detached.blocks).some((b) => b.type === COMPONENT_REF_TYPE)).toBe(false)
    const [first, second] = detached.regions.main.children
    expect(first).toBe('intro')
    expect(detached.blocks[detached.blocks[second].children.children[0]].props.text).toBe('Otro pie')
    expect(detachReference(page, 'footer', {}, { overridable }).errors[0].code).toBe('component_missing')
    expect(detachReference(page, 'intro', { pie: definition }).errors[0].code).toBe('component_invalid')
  })

  it('lists only content fields as overridable and stores only real differences', () => {
    const { definition } = componentFromBlock(source(), 'footer', 'Pie')
    const rows = listOverridable(definition.section, registry)
    expect(rows.map((r) => `${r.path}:${r.prop}`)).toEqual(['root/children/0:text', 'root/children/1:text'])
    expect(withOverride({}, 'root/children/0', 'text', 'Nuevo', 'Hecho en Runly')).toEqual({ 'root/children/0': { text: 'Nuevo' } })
    expect(withOverride({ 'root/children/0': { text: 'Nuevo' } }, 'root/children/0', 'text', 'Hecho en Runly', 'Hecho en Runly')).toEqual({})
  })
})

describe('component references render', () => {
  const definitions = () => ({ pie: componentFromBlock(source(), 'footer', 'Pie').definition })
  const refPage = (props = { componentId: 'pie' }) => ({ ...source(), blocks: { intro: source().blocks.intro, footer: { id: 'footer', type: COMPONENT_REF_TYPE, props } } })

  it('the editor instance shows the live expansion with overrides and a label', () => {
    const { container } = render(
      <AtlasWebBuilderProvider blocks={blocks} syncedComponents={{ definitions: definitions(), save: vi.fn() }}>
        <EditorStoreProvider initialPage={refPage({ componentId: 'pie', overrides: { 'root/children/0': { text: 'Pie de esta página' } } })}>
          <AtlasWebRenderer page={refPage({ componentId: 'pie', overrides: { 'root/children/0': { text: 'Pie de esta página' } } })} mode="public" />
        </EditorStoreProvider>
      </AtlasWebBuilderProvider>,
    )
    expect(container.textContent).toContain('Pie de esta página')
    expect(container.textContent).toContain('Contacto')
    expect(container.querySelector('[data-atlas-component]')).toBeNull()
  })

  it('a reference rendered in the editor is labelled and a missing component says so', () => {
    const view = (props) => render(
      <AtlasWebBuilderProvider blocks={blocks} syncedComponents={{ definitions: definitions(), save: vi.fn() }}>
        {React.createElement(registry.get(COMPONENT_REF_TYPE).render, { ...props, ctx: { mode: 'edit' } })}
      </AtlasWebBuilderProvider>,
    ).container
    expect(view({ componentId: 'pie' }).textContent).toContain('Componente · Pie')
    cleanup()
    expect(view({ componentId: 'borrado' }).textContent).toContain('ya no existe')
    cleanup()
    expect(view({ componentId: '__proto__' }).textContent).toContain('ya no existe')
  })

  it('public rendering expands references through the provider adapter without a components prop', () => {
    const out = render(
      <AtlasWebBuilderProvider blocks={blocks} syncedComponents={{ definitions: definitions(), save: vi.fn() }}>
        <AtlasWebRenderer page={refPage()} mode="public" />
      </AtlasWebBuilderProvider>,
    ).container.textContent
    expect(out).toContain('Hecho en Runly')
    expect(resolveComponents(refPage(), definitions(), { overridable }).errors).toEqual([])
  })
})

describe('components panel', () => {
  function Harness() {
    const select = useEditorStore((s) => s.select)
    const page = useEditorStore((s) => s.page)
    const editing = useEditorStore((s) => s.editingComponent)
    return <>
      <button type="button" onClick={() => select('footer')}>Seleccionar pie</button>
      <output data-testid="types">{Object.values(page.blocks).map((b) => b.type).join(',')}</output>
      <output data-testid="editing">{editing ? editing.name : ''}</output>
      <ComponentEditBanner />
      <ComponentsPanel />
    </>
  }
  const mount = (adapter, page = source()) => render(
    <AtlasWebBuilderProvider blocks={blocks} syncedComponents={adapter}>
      <EditorStoreProvider initialPage={page}><Harness /></EditorStoreProvider>
    </AtlasWebBuilderProvider>,
  )

  it('converts the selection, saves through the host adapter and keeps the reference on the page', async () => {
    const adapter = { definitions: {}, save: vi.fn(async () => {}) }
    mount(adapter)
    expect(screen.getByRole('button', { name: 'Convertir selección en componente' }).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar pie' }))
    fireEvent.change(screen.getByLabelText('Nombre del componente'), { target: { value: 'Pie de página' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convertir selección en componente' }))
    await waitFor(() => expect(adapter.save).toHaveBeenCalledTimes(1))
    const [definitions] = adapter.save.mock.calls[0]
    expect(Object.keys(definitions)).toEqual(['pie-de-pagina'])
    expect(definitions['pie-de-pagina'].section.type).toBe('ContainerBlock')
    await waitFor(() => expect(screen.getByTestId('types').textContent).toBe(`TextBlock,${COMPONENT_REF_TYPE}`))
  })

  it('does not touch the page when the host rejects the save', async () => {
    const adapter = { definitions: {}, save: vi.fn(async () => { throw new Error('La revisión cambió.') }) }
    mount(adapter)
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar pie' }))
    fireEvent.change(screen.getByLabelText('Nombre del componente'), { target: { value: 'Pie' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convertir selección en componente' }))
    expect((await screen.findByRole('alert')).textContent).toContain('La revisión cambió.')
    expect(screen.getByTestId('types').textContent).toContain('ContainerBlock')
    expect(screen.getByTestId('types').textContent).not.toContain(COMPONENT_REF_TYPE)
  })

  it('edits a definition on the canvas, saves it and returns to the page; a failed save keeps the session', async () => {
    const { definition } = componentFromBlock(source(), 'footer', 'Pie')
    const adapter = { definitions: { pie: definition }, save: vi.fn(async () => {}) }
    const page = { ...source(), blocks: { intro: source().blocks.intro, footer: { id: 'footer', type: COMPONENT_REF_TYPE, props: { componentId: 'pie' } } } }
    mount(adapter, page)
    fireEvent.click(screen.getByRole('button', { name: 'Editar Pie' }))
    expect(screen.getByTestId('editing').textContent).toBe('Pie')
    expect(screen.getByRole('region', { name: 'Edición de componente' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Convertir selección en componente' })).toBeNull()
    expect(screen.getByTestId('types').textContent.split(',').sort()).toEqual(['ContainerBlock', 'TextBlock', 'TextBlock'])
    adapter.save.mockRejectedValueOnce(new Error('Sin permiso.'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar componente' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Sin permiso.')
    expect(screen.getByTestId('editing').textContent).toBe('Pie')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar componente' }))
    await waitFor(() => expect(screen.getByTestId('editing').textContent).toBe(''))
    expect(adapter.save).toHaveBeenLastCalledWith({ pie: definition })
    expect(screen.getByTestId('types').textContent).toBe(`TextBlock,${COMPONENT_REF_TYPE}`)
    fireEvent.click(screen.getByRole('button', { name: 'Editar Pie' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByTestId('editing').textContent).toBe('')
    expect(screen.getByTestId('types').textContent).toBe(`TextBlock,${COMPONENT_REF_TYPE}`)
  })

  it('the reference inspector edits per-page overrides and can detach', async () => {
    const { definition } = componentFromBlock(source(), 'footer', 'Pie')
    const page = { ...source(), blocks: { intro: source().blocks.intro, footer: { id: 'footer', type: COMPONENT_REF_TYPE, props: { componentId: 'pie' } } } }
    function Inspector() {
      const overrides = useEditorStore((s) => s.page.blocks.footer?.props?.overrides)
      const types = useEditorStore((s) => Object.values(s.page.blocks).map((b) => b.type).join(','))
      return <><output data-testid="overrides">{JSON.stringify(overrides ?? null)}</output><output data-testid="all">{types}</output>{types.includes(COMPONENT_REF_TYPE) && <ComponentReferenceInspector blockId="footer" />}</>
    }
    render(<AtlasWebBuilderProvider blocks={blocks} syncedComponents={{ definitions: { pie: definition }, save: vi.fn() }}><EditorStoreProvider initialPage={page}><Inspector /></EditorStoreProvider></AtlasWebBuilderProvider>)
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Pie solo aquí' } })
    expect(JSON.parse(screen.getByTestId('overrides').textContent)).toEqual({ 'root/children/0': { text: 'Pie solo aquí' } })
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contenido del componente' }))
    expect(JSON.parse(screen.getByTestId('overrides').textContent)).toEqual({})
    fireEvent.click(screen.getByRole('button', { name: /Desvincular/ }))
    await waitFor(() => expect(screen.getByTestId('all').textContent).not.toContain(COMPONENT_REF_TYPE))
    expect(screen.getByTestId('all').textContent).toContain('ContainerBlock')
  })
})

describe('full editor', () => {
  it('shows the Componentes tab only when the host provides synced components, and hides the reference block from the palette', async () => {
    const { AtlasWebBuilderEditor } = await import('../editor/AtlasWebBuilderEditor.jsx')
    const withHost = render(<AtlasWebBuilderEditor blocks={blocks} syncedComponents={{ definitions: {}, save: vi.fn() }} />)
    expect(screen.getByRole('tab', { name: /Componentes/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: /Bloques/ }))
    expect(screen.queryByText('Identificador del componente')).toBeNull()
    expect(withHost.container.textContent).not.toMatch(/^Componente$/)
    cleanup()
    render(<AtlasWebBuilderEditor blocks={blocks} />)
    expect(screen.queryByRole('tab', { name: /Componentes/ })).toBeNull()
  })
})
