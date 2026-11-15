const select = (label, options) => ({ type: 'select', label, options })
const number = (label, min, max) => ({ type: 'number', label, min, max })
export const elementStylePresets = Object.freeze({
  none: { label: 'Sin estilo', style: {} },
  card: { label: 'Tarjeta suave', style: { background: 'var(--atlas-color-bg, #fff)', borderRadius: 24, padding: 24, boxShadow: '0 8px 32px #0000000d' } },
  outline: { label: 'Contorno', style: { border: '1px solid var(--atlas-color-muted, #888)', borderRadius: 12, padding: 16 } },
  accent: { label: 'Acento', style: { background: 'var(--atlas-color-primary, #f97316)', color: 'var(--atlas-color-primaryFg, #fff)', borderRadius: 16, padding: 16 } },
  dark: { label: 'Oscuro', style: { background: '#191923', color: '#ffffff', borderRadius: 24, padding: 24 } },
  pill: { label: 'Píldora', style: { background: 'var(--atlas-color-primary, #f97316)', color: 'var(--atlas-color-primaryFg, #fff)', borderRadius: 999, padding: '12px 24px' } },
})

export const designFields = {
  stylePreset: select('Estilo inicial', Object.entries(elementStylePresets).map(([value, preset]) => ({ value, label: preset.label }))),
  widthMode: select('Ancho', [{ value: 'auto', label: 'Contenido' }, { value: 'fill', label: 'Llenar espacio' }, { value: 'fixed', label: 'Medida fija' }]),
  width: number('Ancho fijo (px)', 1, 4000), maxWidth: number('Ancho máximo (px)', 0, 4000),
  minHeight: number('Alto mínimo (px)', 0, 4000),
  paddingTop: number('Espacio interior superior', 0, 256), paddingRight: number('Espacio interior derecho', 0, 256),
  paddingBottom: number('Espacio interior inferior', 0, 256), paddingLeft: number('Espacio interior izquierdo', 0, 256),
  marginTop: number('Margen superior', -256, 256), marginRight: number('Margen derecho', -256, 256),
  marginBottom: number('Margen inferior', -256, 256), marginLeft: number('Margen izquierdo', -256, 256),
  backgroundColor: { type: 'color', label: 'Color de fondo' }, textColor: { type: 'color', label: 'Color del texto' },
  borderColor: { type: 'color', label: 'Color del borde' }, borderWidth: number('Grosor del borde', 0, 16),
  cornerRadius: number('Radio de las esquinas', 0, 200),
  position: select('Posición', [{ value: 'flow', label: 'En el flujo' }, { value: 'relative', label: 'Relativa' }, { value: 'absolute', label: 'Superpuesta' }, { value: 'sticky', label: 'Adherida' }]),
  offsetX: number('Desplazamiento horizontal (px)', -2000, 4000), offsetY: number('Desplazamiento vertical (px)', -2000, 4000),
  layer: number('Orden de capa', 0, 100), rotation: number('Rotación (grados)', -180, 180),
}
export const typographyFields = {
  fontSize: number('Tamaño del texto (px)', 8, 200), fontWeight: select('Peso del texto', ['400','500','600','700','800','900']),
  lineHeight: { ...number('Interlineado', 0.8, 3), step: 0.1 },
  textAlign: select('Alineación del texto', ['left','center','right']),
}
const numeric = (props, key, min, max) => typeof props[key] === 'number' && Number.isFinite(props[key]) && props[key] >= min && props[key] <= max ? props[key] : undefined
const color = value => typeof value === 'string' && /^#[a-f\d]{6}([a-f\d]{2})?$/i.test(value) ? value : undefined

export function elementItemStyle(props) {
  const style = { minWidth: 0 }
  if (props.widthMode === 'fill') { style.width = '100%'; style.flex = '1 1 0%' }
  if (props.widthMode === 'auto') { style.width = 'fit-content'; style.flex = '0 1 auto' }
  if (props.widthMode === 'fixed') { style.width = numeric(props,'width',1,4000); style.flex = '0 0 auto'; style.maxWidth = '100%' }
  const maxWidth = numeric(props,'maxWidth',1,4000)
  if (maxWidth) style.maxWidth = maxWidth
  for (const key of ['marginTop','marginRight','marginBottom','marginLeft']) {
    const value = numeric(props,key,-256,256)
    if (value !== undefined) style[key] = value
  }
  if (['relative','absolute','sticky'].includes(props.position)) style.position = props.position
  if (style.position) { style.left = numeric(props,'offsetX',-2000,4000); style.top = numeric(props,'offsetY',-2000,4000) }
  style.zIndex = numeric(props,'layer',0,100)
  const rotation = numeric(props,'rotation',-180,180)
  if (rotation) style.transform = `rotate(${rotation}deg)`
  return style
}
export function elementSurfaceStyle(props, ctx) {
  const style = { boxSizing: 'border-box', ...elementStylePresets[props.stylePreset]?.style,
    ...(ctx?.mode === 'edit' ? { width: '100%' } : elementItemStyle(props)) }
  for (const [key,min,max] of [['paddingTop',0,256],['paddingRight',0,256],['paddingBottom',0,256],['paddingLeft',0,256],
    ['minHeight',0,4000],['fontSize',8,200],['lineHeight',0.8,3]]) {
    const value = numeric(props,key,min,max)
    if (value !== undefined) style[key] = value
  }
  if (color(props.backgroundColor)) style.background = color(props.backgroundColor)
  if (color(props.textColor)) style.color = color(props.textColor)
  if (color(props.borderColor)) style.borderColor = color(props.borderColor)
  const border = numeric(props,'borderWidth',0,16), radius = numeric(props,'cornerRadius',0,200)
  if (border !== undefined) { style.borderWidth = border; style.borderStyle = 'solid' }
  if (radius !== undefined) style.borderRadius = radius
  if (typographyFields.fontWeight.options.includes(props.fontWeight)) style.fontWeight = props.fontWeight
  if (typographyFields.textAlign.options.includes(props.textAlign)) style.textAlign = props.textAlign
  return style
}

export const designGroups = [
  { label: 'Estilo', fields: ['stylePreset','backgroundColor','textColor','borderColor','borderWidth','cornerRadius'] },
  { label: 'Tamaño y espacio', fields: ['widthMode','width','maxWidth','minHeight','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft'] },
  { label: 'Posición y capas', fields: ['position','offsetX','offsetY','layer','rotation'] },
]
