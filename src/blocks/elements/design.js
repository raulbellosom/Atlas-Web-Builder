import { responsiveFields, responsiveStyle } from './responsive.js'
import {geometryKeys,geometryVariables} from './geometry.js'
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

const baseDesignFields = {
  stylePreset: select('Estilo inicial', Object.entries(elementStylePresets).map(([value, preset]) => ({ value, label: preset.label }))),
  widthMode: select('Ancho', [{ value: 'auto', label: 'Contenido' }, { value: 'fill', label: 'Llenar espacio' }, { value: 'fixed', label: 'Medida fija' }, {value:'percent',label:'Porcentaje'}]),
  widthPercent: number('Ancho (%)',1,100),
  heightMode: select('Alto',[{value:'auto',label:'Contenido'},{value:'fixed',label:'Medida fija'}]),height:number('Alto fijo (px)',1,4000),
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
  anchorX:select('Anclaje horizontal',[{value:'left',label:'Izquierda'},{value:'center',label:'Centro'},{value:'right',label:'Derecha'}]),
  anchorY:select('Anclaje vertical',[{value:'top',label:'Arriba'},{value:'center',label:'Centro'},{value:'bottom',label:'Abajo'}]),
  offsetX: number('Desplazamiento horizontal (px)', -2000, 4000), offsetY: number('Desplazamiento vertical (px)', -2000, 4000),
  layer: number('Orden de capa', 0, 100), rotation: number('Rotación (grados)', -180, 180),
}
const baseTypographyFields = {
  fontSize: number('Tamaño del texto (px)', 8, 200), fontWeight: select('Peso del texto', ['400','500','600','700','800','900']),
  lineHeight: { ...number('Interlineado', 0.8, 3), step: 0.1 },
  textAlign: select('Alineación del texto', ['left','center','right']),
}
const surfaceProperties = Object.fromEntries(['paddingTop','paddingRight','paddingBottom','paddingLeft','fontSize','fontWeight','lineHeight','letterSpacing','textAlign','fontFamily','fontStyle','whiteSpace','overflowWrap','borderWidth','borderColor','boxShadow','objectPosition'].map(key=>[key,key]))
Object.assign(surfaceProperties,{backgroundColor:'background',backgroundImage:'backgroundImage',backgroundSize:'backgroundSize',backgroundPosition:'backgroundPosition',textColor:'color',cornerRadius:'borderRadius',fit:'objectFit'})
const outerProperties = Object.fromEntries(['maxWidth','minWidth','maxHeight','aspectRatio','overflow','order','marginTop','marginRight','marginBottom','marginLeft'].map(key=>[key,key]))
Object.assign(outerProperties,{layer:'zIndex',visibility:['visibility','display'],containerPreset:['maxWidth','marginInline'],fullBleed:['maxWidth','marginInline'],contentMaxWidth:'maxWidth'})
Object.assign(baseDesignFields,{
  minWidth:number('Ancho mínimo (px)',0,4000),maxHeight:number('Alto máximo (px)',0,4000),
  aspectRatio:select('Proporción',['auto','1','1.333333','1.777778','0.75']),
  overflow:select('Contenido desbordado',['visible','hidden','clip','auto']),
  order:number('Orden en la distribución',-100,100),visibility:select('Visibilidad',[{value:'visible',label:'Visible'},{value:'hidden',label:'Oculto conservando espacio'},{value:'collapsed',label:'Oculto sin ocupar espacio'}]),
  backgroundImage:{type:'image',label:'Imagen de fondo'},
  backgroundSize:select('Ajuste del fondo',['cover','contain','auto']),
  backgroundPosition:select('Posición del fondo',['center','top','bottom','left','right']),
  boxShadow:select('Sombra',['none','0 4px 16px #0000001a','0 12px 32px #00000026']),
  objectPosition:select('Posición de imagen',['center','top','bottom','left','right']),
})
Object.assign(baseTypographyFields,{
  letterSpacing:{...number('Espaciado entre letras (px)',-10,40),step:0.1},
  fontFamily:select('Familia',['inherit','var(--atlas-font-sans)','var(--atlas-font-serif)','system-ui','serif','monospace']),
  fontStyle:select('Estilo de texto',['normal','italic']),
  whiteSpace:select('Ajuste de líneas',['normal','pre-wrap','nowrap']),
  overflowWrap:select('Palabras largas',['normal','anywhere','break-word']),
})
export const designFields=responsiveFields(baseDesignFields,[...geometryKeys,...Object.keys(surfaceProperties),...Object.keys(outerProperties)])
export const typographyFields=responsiveFields(baseTypographyFields,Object.keys(baseTypographyFields))
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
function surfaceStyle(props, ctx) {
  const style = { boxSizing: 'border-box', ...elementStylePresets[props.stylePreset]?.style,
    ...(ctx?.mode === 'edit' ? { width: '100%',height:'var(--ae-height, auto)' } : elementOuterStyle(props)) }
  for (const [key,min,max] of [['paddingTop',0,256],['paddingRight',0,256],['paddingBottom',0,256],['paddingLeft',0,256],
    ['fontSize',8,200],['lineHeight',0.8,3],['letterSpacing',-10,40]]) {
    const value = numeric(props,key,min,max)
    if (value !== undefined) style[key] = value
  }
  if (color(props.backgroundColor)) style.background = color(props.backgroundColor)
  if(props.backgroundImage==='')style.backgroundImage='none'
  else if(typeof props.backgroundImage==='string'&&/^(https?:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp|gif);base64,)/i.test(props.backgroundImage)&&!/["'\\<>]/.test(props.backgroundImage)&&!Array.from(props.backgroundImage).some(char=>char.charCodeAt(0)<32))style.backgroundImage=`url("${props.backgroundImage}")`
  if(baseDesignFields.backgroundSize.options.includes(props.backgroundSize))style.backgroundSize=props.backgroundSize
  if(baseDesignFields.backgroundPosition.options.includes(props.backgroundPosition))style.backgroundPosition=props.backgroundPosition
  if (color(props.textColor)) style.color = color(props.textColor)
  if (color(props.borderColor)) style.borderColor = color(props.borderColor)
  const border = numeric(props,'borderWidth',0,16), radius = numeric(props,'cornerRadius',0,200)
  if (border !== undefined) { style.borderWidth = border; style.borderStyle = 'solid' }
  if (radius !== undefined) style.borderRadius = radius
  if (typographyFields.fontWeight.options.includes(props.fontWeight)) style.fontWeight = props.fontWeight
  if (typographyFields.textAlign.options.includes(props.textAlign)) style.textAlign = props.textAlign
  for(const key of ['fontFamily','fontStyle','whiteSpace','overflowWrap'])
    if(baseTypographyFields[key].options.includes(props[key]))style[key]=props[key]
  for(const key of ['boxShadow','objectPosition'])
    if(baseDesignFields[key].options.includes(props[key]))style[key]=props[key]
  if(['cover','contain','fill','scale-down','none'].includes(props.fit))style.objectFit=props.fit
  return style
}
export function elementSurfaceStyle(props,ctx) {
  return {...responsiveStyle(props,value=>surfaceStyle(value,ctx),surfaceProperties),...(ctx?.mode==='edit'?{}:elementOuterStyle(props))}
}
// Geometry belongs to the editable wrapper in edit mode and to the element in public mode.
export const elementClass=(ctx,name='')=>`${name} atlas-element-surface${ctx?.mode==='edit'?'':' atlas-element-item'}`.trim()
export function elementOuterStyle(props) {
  const factory=value=>{
    const style=elementItemStyle(value)
    for(const key of ['width','flex','position','left','top','transform'])delete style[key]
    if(!(value.maxWidth>0))delete style.maxWidth
    for(const key of ['minWidth','maxHeight','order']) {
      const n=numeric(value,key,key==='order'?-100:0,key==='order'?100:4000)
      if(n!==undefined)style[key]=n
    }
    for(const key of ['aspectRatio','overflow'])
      if(baseDesignFields[key].options.includes(value[key]))style[key]=value[key]
    if(['visible','hidden','collapsed'].includes(value.visibility))style.visibility=value.visibility==='hidden'?'hidden':'visible'
    if(['visibility','tabletVisibility','mobileVisibility'].some(key=>props[key]==='collapsed'))style.display=value.visibility==='collapsed'?'none':'var(--ar-natural-display, revert)'
    const limit=containerLimit(value)
    if(limit&&value.fullBleed!==true) {style.maxWidth=numeric(value,'maxWidth',0,4000)??limit;style.marginInline='auto'}
    return style
  }
  return {...responsiveStyle(props,factory,outerProperties),...geometryVariables(props)}
}

export function containerLimit(props) {
  return {full:'100%',xl:'1280px','2xl':'1536px',custom:`${numeric(props,'contentMaxWidth',1,4000)??1280}px`}[props.containerPreset]
}

export const designGroups = [
  { label: 'Estilo', fields: ['stylePreset','backgroundColor','backgroundImage','backgroundSize','backgroundPosition','textColor','borderColor','borderWidth','cornerRadius','boxShadow','visibility'] },
  { label: 'Tamaño y espacio', fields: ['widthMode','width','maxWidth','minHeight','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','minWidth','maxHeight','aspectRatio','overflow','objectPosition'] },
  { label: 'Posición y capas', fields: ['position','offsetX','offsetY','layer','rotation','order'] },
]
