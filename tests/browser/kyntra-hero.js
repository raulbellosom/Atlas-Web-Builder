// Synthetic KYNTRA-shaped composition; never edits the catalog template.
const blocks = {}
const block = (id, type, props, children = []) => {
  blocks[id] = { id, type, props, children: { children } }
  return id
}
const text = (id, value, props = {}) => block(id, 'TextElementBlock', { text: value, ...props })
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='
block('hero', 'BoxBlock', { widthMode: 'fill', layout: 'row', mobileLayout: 'column', gap: 32, paddingLeft: 24, paddingRight: 24, paddingTop: 32, paddingBottom: 32, backgroundColor: '#efece4', tabletBackgroundColor: '#e4eaf0', mobileBackgroundColor: '#efe4e4', backgroundImage: '/fixture-background.svg' }, [
  block('copy', 'BoxBlock', { widthMode: 'percent', widthPercent: 54, mobileWidthPercent: 100, layout: 'column', gap: 20 }, [
    block('badge', 'BoxBlock', { widthMode: 'auto', layout: 'row', mobileLayout: 'row', gap: 8 }, [text('eyebrow', 'KYNTRA / MOTION COMMERCE', { fontSize: 14 })]),
    text('title', 'Diseñado para moverte.', { tag: 'h1', widthMode: 'fill', fontSize: 64, tabletFontSize: 48, mobileFontSize: 36, lineHeight: 1.05 }),
    text('description', 'Movimiento, diseño y energía para acompañarte todos los días.', { widthMode: 'fill', fontSize: 18 }),
    block('actions', 'BoxBlock', { widthMode: 'fill', layout: 'row', mobileLayout: 'row', align: 'center', gap: 12 }, [
      block('cta', 'ButtonElementBlock', { label: 'Explorar colección', stylePreset: 'pill', fontSize: 16 }),
      block('arrow', 'IconElementBlock', { icon: 'arrow-right', size: 32 }),
    ]),
  ]),
  block('visual', 'BoxBlock', { widthMode: 'fill', layout: 'column', minWidth: 0, tabletMinWidth: 120, mobileMinWidth: 0, backgroundColor: '#d7ddcb', paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 }, [
    block('product', 'ImageElementBlock', { src: image, alt: 'Producto KYNTRA', widthMode: 'fill', aspectRatio: '1.333333', fit: 'contain', mobileBackgroundImage: '' }),
  ]),
])
block('grid', 'BoxBlock', { widthMode: 'fill', layout: 'grid', columns: 3, tabletColumns: 2, mobileLayout: 'grid', mobileColumns: 1, gap: 16 }, [
  text('grid-a', 'Primera tarjeta', { widthMode: 'fill' }),
  text('grid-b', 'Segunda tarjeta', { widthMode: 'fill' }),
  text('grid-c', 'Tercera tarjeta', { widthMode: 'fill' }),
])
block('free', 'BoxBlock', { widthMode: 'fill', layout: 'free', mobileLayout: 'free', heightMode: 'fixed', height: 180 }, [
  text('floating', 'Posición libre', { position: 'absolute', anchorX: 'center', offsetY: 32, widthMode: 'fixed', width: 240, tabletWidth: 200, mobileWidthMode: 'percent', mobileWidthPercent: 80, heightMode: 'fixed', height: 80, _animation: { preset: 'fade-in', duration: 80 }, _scrollReveal: true }),
])
block('limited', 'BoxBlock', { widthMode: 'fill', containerPreset: 'custom', contentMaxWidth: 600, mobileContentMaxWidth: 300, fullBleed: true, paddingLeft: 16, paddingRight: 16 }, [
  text('limited-text', 'Contenido centrado con fondo completo', { widthMode: 'fill' }),
])
export const kyntraHero = { schemaVersion: 1, id: 'kyntra-regression', slug: '/', title: 'KYNTRA regression', regions: { main: { id: 'main', children: ['hero', 'grid', 'limited', 'free'] } }, blocks, seo: {} }
