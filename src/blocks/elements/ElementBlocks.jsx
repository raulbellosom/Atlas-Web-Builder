import { responsiveFields, resolveResponsive } from './responsive.js'
import { defineBlock } from '../../registry/createBlockRegistry.js'
import { designFields, designGroups, typographyFields, elementSurfaceStyle, elementClass } from './design.js'
import {BrandIdentity,brandIdentityDefaults,brandIdentityFields} from './BrandIdentity.jsx'
import {AccordionBlock,AccordionItemBlock} from './AccordionBlocks.jsx'
const field = (label,options) => ({ type:'select',label,options })
const safeHref = value => typeof value === 'string' && value.length <= 2048 && /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) && !Array.from(value).some(c => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127) ? value : '#'
const finite = (value,min,max,fallback) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback

const layouts = ['row','column','grid','free']
const layoutOptions=values=>values.map(value=>({value,label:{inherit:'Heredar',row:'Fila',column:'Columna',grid:'Cuadrícula',free:'Libre'}[value]}))
function layoutVariables(props) {
  const variables = {}
  for (const prefix of ['', 'tablet', 'mobile']) {
    const resolved=resolveResponsive(props,prefix||'desktop')
    const layout = resolved.layout, columns = resolved.columns
    variables[`--ae-${prefix||'desktop'}-gap`]=`${finite(resolved.gap,0,128,16)}px`
    variables[`--ae-${prefix||'desktop'}-align`]=['start','center','end','stretch'].includes(resolved.align)?resolved.align:'stretch'
    variables[`--ae-${prefix||'desktop'}-justify`]=['start','center','end','space-between','space-around'].includes(resolved.justify)?resolved.justify:'start'
    variables[`--ae-${prefix||'desktop'}-wrap`]=resolved.wrap==='wrap'?'wrap':'nowrap'
    if (layouts.includes(layout)) {
      variables[`--ae-${prefix || 'desktop'}-display`] = layout === 'grid' ? 'grid' : layout==='free'?'block':'flex'
      variables[`--ae-${prefix || 'desktop'}-direction`] = layout === 'row' ? 'row' : 'column'
    }
    if (Number.isInteger(columns) && columns >= 1 && columns <= 12) variables[`--ae-${prefix || 'desktop'}-columns`] = `repeat(${columns}, minmax(0, 1fr))`
  }
  variables['--ae-gap'] = `${finite(props.gap,0,128,16)}px`
  variables['--ae-align'] = ['start','center','end','stretch'].includes(props.align) ? props.align : 'stretch'
  variables['--ae-justify'] = ['start','center','end','space-between','space-around'].includes(props.justify) ? props.justify : 'start'
  return variables
}
function element(definition) {
  return defineBlock({ category:'elements', kind:'element', ...definition,
    defaultProps:{stylePreset:'none',widthMode:'auto',...definition.defaultProps},
    fields:responsiveFields({...definition.fields,...designFields},['layout','columns','gap','align','justify','wrap','fit','objectPosition']), groups:[...definition.groups,...designGroups] })
}
export const BoxBlock = element({
  type:'BoxBlock',label:'Contenedor libre',icon:'layout',slots:{children:{}},
  defaultProps:{widthMode:'fill',layout:'column',columns:2,gap:16,mobileLayout:'column',mobileColumns:1},
  fields:{layout:field('Distribución',layoutOptions(layouts)),columns:{type:'number',label:'Columnas',min:1,max:12},
    gap:{type:'number',label:'Separación (px)',min:0,max:128},align:field('Alinear elementos',['start','center','end','stretch']),
    justify:field('Distribuir espacio',['start','center','end','space-between','space-around']),
    tabletLayout:field('Distribución en tableta',layoutOptions(['inherit',...layouts])),tabletColumns:{type:'number',label:'Columnas en tableta',min:1,max:12},
    mobileLayout:field('Distribución en móvil',layoutOptions(['inherit',...layouts])),mobileColumns:{type:'number',label:'Columnas en móvil',min:1,max:12}},
  groups:[{label:'Composición',fields:['layout','columns','gap','align','justify','wrap']},{label:'Adaptación por pantalla',fields:['tabletLayout','tabletColumns','mobileLayout','mobileColumns']}],
  render:props=><div className={elementClass(props.ctx,'atlas-element-box')} style={{...elementSurfaceStyle(props,props.ctx),...layoutVariables(props)}}>
    <div className="atlas-element-layout">{props.ctx.slot('children')}</div>
  </div>,
})
export const TextElementBlock = element({
  type:'TextElementBlock',label:'Texto libre',icon:'text',defaultProps:{text:'Escribe tu texto',tag:'p'},
  fields:{text:{type:'textarea',label:'Texto'},tag:field('Etiqueta',['p','span','h1','h2','h3','h4']),...typographyFields},
  groups:[{label:'Contenido',fields:['text','tag']},{label:'Tipografía',fields:Object.keys(typographyFields)}],
  render:({ctx,...props})=>{
    const Tag=['p','span','h1','h2','h3','h4'].includes(props.tag)?props.tag:'p'
    return <Tag className={elementClass(ctx,'atlas-element-text')} style={{margin:0,whiteSpace:'pre-wrap',...elementSurfaceStyle(props,ctx)}}>{ctx.inlineText?ctx.inlineText({propName:'text',value:props.text,as:'span',multiline:true}):props.text}</Tag>
  },
})
function linkElement(type,label,preset,decoration) {
  return element({type,label,icon:'button',defaultProps:{label,href:'#',stylePreset:preset},
    fields:{label:{type:'text',label:'Texto'},href:{type:'link',label:'Destino'},newTab:{type:'toggle',label:'Abrir en otra pestaña'},...typographyFields},
    groups:[{label:'Contenido',fields:['label','href','newTab']},{label:'Tipografía',fields:Object.keys(typographyFields)}],
    render:({ctx,...props})=><a className={elementClass(ctx,'atlas-element-link')} href={safeHref(props.href)} target={props.newTab?'_blank':undefined} rel={props.newTab?'noopener noreferrer':undefined}
      style={{display:'inline-flex',alignItems:'center',justifyContent:'center',textDecoration:decoration,...elementSurfaceStyle(props,ctx)}}>{ctx.inlineText?ctx.inlineText({propName:'label',value:props.label,as:'span'}):props.label}</a>})
}
export const LinkElementBlock=linkElement('LinkElementBlock','Enlace','none','underline')
export const ButtonElementBlock=linkElement('ButtonElementBlock','Botón libre','pill','none')
export const ImageElementBlock=element({
  type:'ImageElementBlock',label:'Imagen libre',icon:'image',defaultProps:{src:'',alt:'',widthMode:'fill',fit:'cover'},
  fields:{src:{type:'image',label:'Imagen'},alt:{type:'text',label:'Descripción accesible'},fit:field('Ajuste de imagen',['cover','contain']),
    imageHeight:{type:'number',label:'Alto de imagen (px)',min:1,max:4000}},
  groups:[{label:'Contenido',fields:['src','alt','fit','imageHeight']}],
  render:({ctx,...props})=>{
    const src=typeof props.src==='string'&&/^(https?:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp|gif);base64,)/i.test(props.src)?props.src:''
    const style={display:'block',objectFit:props.fit==='contain'?'contain':'cover',...elementSurfaceStyle(props,ctx)}
    return src?<img className={elementClass(ctx)} src={src} alt={props.alt||''} style={style}/>:<div className={elementClass(ctx)} role="img" aria-label={props.alt||'Imagen sin seleccionar'} style={style}>Selecciona una imagen</div>
  },
})
export const LogoElementBlock=element({
  type:'LogoElementBlock',label:'Logo y marca',icon:'image',defaultProps:{...brandIdentityDefaults,fontSize:24,fontWeight:'700'},
  fields:{...brandIdentityFields,...typographyFields},groups:[{label:'Marca',fields:Object.keys(brandIdentityFields)},{label:'Tipografía',fields:Object.keys(typographyFields)}],
  render:({ctx,...props})=><a className={elementClass(ctx,'atlas-element-brand')} href={safeHref(props.brandHref)} style={{display:'inline-flex',alignItems:'center',fontFamily:'var(--atlas-font-sans)',textDecoration:'none',color:'inherit',...elementSurfaceStyle(props,ctx)}}><BrandIdentity {...props}/></a>,
})
export const elementBlocks=[BoxBlock,TextElementBlock,ButtonElementBlock,LinkElementBlock,ImageElementBlock,LogoElementBlock,AccordionBlock,AccordionItemBlock]
