import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AtlasWebBuilderEditor, baseBlocks, defaultTheme } from '../../src/index.js'
import { useEditorStoreInstance } from '../../src/editor/store/EditorStoreProvider.jsx'

const original = {
  schemaVersion: 1, id: 'phase-one', slug: '/', title: 'Estudio Norte', visibility: 'public',
  regions: { main: { children: ['heading', 'paragraph', 'second'] } },
  blocks: {
    heading: { id: 'heading', type: 'HeadingBlock', props: { text: 'Ideas que toman forma.', level: 'h1', customHistorical: { preserve: true } } },
    paragraph: { id: 'paragraph', type: 'TextBlock', props: { text: 'Un espacio para crear con intención. Diseña tu próxima historia, a tu manera.' } },
    second: { id: 'second', type: 'HeadingBlock', props: { text: 'Hecho para explorar.', level: 'h2' } },
  }, seo: { title: 'SEO histórico' },
}
let editorStore, saved, reopen
function Probe() { editorStore = useEditorStoreInstance(); return <span className="fixture-brand">A</span> }
function App() {
  const [initial, setInitial] = useState(original)
  const [session, setSession] = useState(0)
  const restricted = new URLSearchParams(location.search).has('restricted')
  reopen = () => { setInitial(structuredClone(saved)); setSession(value => value + 1) }
  return <div style={{ height: '100dvh' }}>
    <AtlasWebBuilderEditor key={session} initialPage={initial} blocks={baseBlocks} theme={defaultTheme}
      brandName="Atlas Studio" brandLogo={<Probe />} onSaveDraft={page => { saved = structuredClone(page) }}
      capabilities={restricted ? { schemaVersion: 1, effects: false, seo: false, pageMetadata: false, reason: 'Website v2' } : undefined} />
  </div>
}
window.atlasTest = { page: () => editorStore.getState().page, saved: () => saved, reopen: () => reopen(), history: () => editorStore.temporal.getState().pastStates.length }
createRoot(document.getElementById('root')).render(<App />)
