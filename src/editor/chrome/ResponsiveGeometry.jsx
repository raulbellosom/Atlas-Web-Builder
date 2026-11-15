import {useEditorStore} from '../store/EditorStoreProvider.jsx'
import {geometryKeys,geometryKey,resolveGeometry} from '../../blocks/elements/geometry.js'
import {PropertyField} from './PropertyField.jsx'

export function ResponsiveGeometry({block,definition}) {
  const device=useEditorStore(state=>state.device),update=useEditorStore(state=>state.updateBlockProps),reset=useEditorStore(state=>state.resetBlockProps)
  const label=device==='mobile'?'Teléfono':device==='tablet'?'Tableta':'Escritorio'
  const props={...definition.defaultProps,...block.props},resolved=resolveGeometry(props,device)
  const inherited=resolveGeometry(props,device==='mobile'?'tablet':'desktop')
  return <div className="atlas-wb-responsive-geometry" aria-label={`Posición y tamaño · ${label}`}>
    <p className="atlas-wb-field__hint">Editando {label}. {device==='desktop'?'Los tamaños menores heredan estos valores.':'Estos ajustes no cambian las pantallas mayores.'}</p>
    {device!=='desktop'&&<button type="button" className="atlas-wb-btn atlas-wb-btn--secondary" onClick={()=>reset(block.id,geometryKeys.map(key=>geometryKey(key,device)))}>Restablecer ajustes de {label}</button>}
    {geometryKeys.map(key=>{
      const property=geometryKey(key,device),spec=definition.fields[property]
      if(!spec)return null
      return <PropertyField key={property} propName={property} spec={spec} value={resolved[key]}
        hasValue={Object.hasOwn(block.props,property)} defaultValue={device==='desktop'?definition.defaultProps[key]:inherited[key]}
        onChange={value=>update(block.id,{[property]:value})} onReset={()=>reset(block.id,[property])}/>
    })}
  </div>
}
