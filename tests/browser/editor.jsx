import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AtlasWebBuilderEditor, AtlasWebBuilderProvider, AtlasWebRenderer, baseBlocks, defaultTheme, editorControls, getVersion } from '../../src/index.js'
import { useEditorStoreInstance } from '../../src/editor/store/EditorStoreProvider.jsx'
import { EditorAppearanceProvider } from '../../src/editor/ui/EditorAppearance.jsx'

const original = {
  schemaVersion: 1, id: 'phase-one', slug: '/', title: 'Estudio Norte', visibility: 'public',
  regions: { main: { children: ['section'] } },
  blocks: {
    section: { id: 'section', type: 'SectionBlock', props: { paddingY: '12', paddingX: '8' }, children: { children: ['heading', 'paragraph', 'second', 'link'] } },
    heading: { id: 'heading', type: 'HeadingBlock', props: { text: 'Ideas que toman forma.', level: 'h1', customHistorical: { preserve: true } } },
    paragraph: { id: 'paragraph', type: 'TextBlock', props: { text: 'Un espacio para crear con intención. Diseña tu próxima historia, a tu manera.', paddingY: '6', maxWidth: '55ch' } },
    second: { id: 'second', type: 'HeadingBlock', props: { text: 'Hecho para explorar.', level: 'h2', paddingY: '6' } },
    link: { id: 'link', type: 'ButtonBlock', props: { label: 'Conoce el estudio', href: 'https://example.test/estudio', newTab: true } },
  }, seo: { title: 'SEO histórico' },
}
// ColumnsBlock matrix: 2/3/4 columns × stackOnMobile on/off; each column holds a card with text, image and button.
const cardImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="360"%3E%3Crect width="640" height="360" fill="%23ede9fe"/%3E%3C/svg%3E'
const columnsPage = (() => {
  const blocks = {}, roots = []
  for (const count of [2, 3, 4]) for (const stack of [true, false]) {
    const id = `cols_${count}_${stack ? 'stack' : 'fixed'}`, children = {}
    for (let i = 0; i < count; i++) {
      const card = `${id}_card${i}`
      blocks[card] = { id: card, type: 'CardBlock', props: { imageSrc: cardImage, imageAlt: `Imagen ${i + 1}`, title: `Servicio ${i + 1}`, description: 'Texto de la tarjeta que debe verse completo.', ctaLabel: 'Ver más', ctaHref: '#', ctaStyle: 'solid' } }
      children[`col${i}`] = [card]
    }
    blocks[id] = { id, type: 'ColumnsBlock', props: { count: String(count), gap: '4', stackOnMobile: stack }, children }
    roots.push(id)
  }
  blocks.section = { id: 'section', type: 'SectionBlock', props: { paddingY: '6', paddingX: '4' }, children: { children: roots } }
  return { schemaVersion: 1, id: 'columns', slug: '/', title: 'Columnas', visibility: 'public', regions: { main: { children: ['section'] } }, blocks, seo: {} }
})()
const params = new URLSearchParams(location.search)
let editorStore, saved, reopen
const assets = { list: async () => [{ id: 'sample', name: 'Muestra', kind: 'image', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Crect width="600" height="400" fill="%23315dec"/%3E%3C/svg%3E' }] }
function Probe() { editorStore = useEditorStoreInstance(); return <span className="fixture-brand">A</span> }
function App() {
  const [initial, setInitial] = useState(params.has('columns') ? columnsPage : original)
  const [session, setSession] = useState(0)
  const restricted = new URLSearchParams(location.search).has('restricted')
  reopen = () => { setInitial(structuredClone(saved)); setSession(value => value + 1) }
  return <div data-fixture-session={session} style={{ height: '100dvh', width: new URLSearchParams(location.search).has('embed') ? 768 : undefined, maxWidth: '100%' }}>
    <AtlasWebBuilderEditor key={session} initialPage={initial} blocks={baseBlocks} theme={defaultTheme}
      brandName="Atlas Studio" brandLogo={<Probe />} onSaveDraft={page => { saved = structuredClone(page) }}
      assets={assets}
      capabilities={restricted ? { schemaVersion: 1, effects: false, seo: false, pageMetadata: false, reason: 'Website v2' } : undefined} />
  </div>
}
window.atlasTest = { setDevice: device => editorStore.getState().setDevice(device), page: () => editorStore.getState().page, saved: () => saved, reopen: () => reopen(), history: () => editorStore.temporal.getState().pastStates.length }
window.atlasReactVersion = React.version
window.atlasApiVersion = getVersion()
function ControlGallery() {
  const [values, setValues] = useState({ family: 'first', length: '12px', amount: 20, enabled: false, color: '#315dec' })
  const change = key => value => setValues(previous => ({ ...previous, [key]: value }))
  return <EditorAppearanceProvider defaultAppearance="dark"><div className="atlas-wb-panel" style={{ padding: 16, minHeight: '100dvh' }}>
    <h1 style={{ fontSize: 20 }}>Controles del inspector</h1>
    <editorControls.Combobox label="Familia" value={values.family} onChange={change('family')} options={[{ value: 'first', label: 'Primera' }, { value: 'second', label: 'Segunda' }]} />
    <editorControls.UnitInput label="Longitud" value={values.length} onChange={change('length')} />
    <editorControls.SliderInput label="Cantidad" value={values.amount} onChange={change('amount')} min={0} max={100} />
    <editorControls.SwitchControl label="Activar" value={values.enabled} onChange={change('enabled')} />
    <editorControls.ColorInput label="Color de prueba" value={values.color} onChange={change('color')} />
    <editorControls.Popover label="Detalles"><input aria-label="Campo del popover" /></editorControls.Popover>
    <editorControls.Tooltip label="Ayuda accesible">Ayuda</editorControls.Tooltip>
    <output data-testid="values">{JSON.stringify(values)}</output>
  </div></EditorAppearanceProvider>
}
const PublicRenderer = () => <AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={columnsPage} mode="public" /></AtlasWebBuilderProvider>
createRoot(document.getElementById('root')).render(params.has('controls') ? <ControlGallery /> : params.has('render') ? <PublicRenderer /> : <App />)
