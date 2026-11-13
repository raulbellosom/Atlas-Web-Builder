export function MobileTools({ leftClosed, rightClosed, leftTab, onBlocks, onLayers, onProperties }) {
  return <nav className="atlas-wb-mobile-tools" aria-label="Herramientas del editor">
    <button type="button" aria-pressed={!leftClosed && leftTab === 'blocks'} onClick={onBlocks}><span aria-hidden="true">＋</span>Bloques</button>
    <button type="button" aria-pressed={!leftClosed && leftTab === 'layers'} onClick={onLayers}><span aria-hidden="true">▤</span>Capas</button>
    <button type="button" aria-pressed={!rightClosed} onClick={onProperties}><span aria-hidden="true">☷</span>Propiedades</button>
  </nav>
}
