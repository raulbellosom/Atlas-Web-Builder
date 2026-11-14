import { Layers, LayoutGrid, SlidersHorizontal } from 'lucide-react'

const TOOLS = [['blocks', 'Bloques', LayoutGrid], ['layers', 'Capas', Layers], ['properties', 'Propiedades', SlidersHorizontal]]

export function MobileTools({ leftClosed, rightClosed, leftTab, onBlocks, onLayers, onProperties }) {
  const pressed = { blocks: !leftClosed && leftTab === 'blocks', layers: !leftClosed && leftTab === 'layers', properties: !rightClosed }
  const actions = { blocks: onBlocks, layers: onLayers, properties: onProperties }
  return <nav className="atlas-wb-mobile-tools" aria-label="Herramientas del editor">
    {TOOLS.map(([key, label, Icon]) => <button key={key} type="button" aria-pressed={pressed[key]} onClick={actions[key]}><Icon /><span>{label}</span></button>)}
  </nav>
}
