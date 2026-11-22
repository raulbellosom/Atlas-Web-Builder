import { useEffect, useState } from 'react'
import { useEditorStore, useEditorStoreInstance } from '../store/EditorStoreProvider.jsx'
import { NumberInput } from '../ui/NumericControls.jsx'
import { resolveResponsive, responsiveKey } from '../../blocks/elements/responsive.js'

export function inspectHorizontalOverflow(root) {
  return inspectOverflowDetails(root).map(item=>item.blockId)
}
export function inspectOverflowDetails(root,{page,device='desktop'}={}) {
  if(!root)return []
  const view=root.ownerDocument.defaultView,scale=root.getBoundingClientRect().width/root.clientWidth||1
  const nodes=[...root.querySelectorAll('[data-block-id], [data-atlas-block]')]
  return nodes.flatMap(node=>{
    const rect=node.getBoundingClientRect(),style=view.getComputedStyle(node)
    if(!rect.width||style.visibility==='hidden')return []
    const parent=node.parentElement,ps=view.getComputedStyle(parent),bounds=parent.getBoundingClientRect()
    if(['auto','scroll','hidden','clip'].includes(ps.overflowX))return []
    const content=node.querySelector(':scope > .atlas-element-surface')??node
    const leafOverflow=!content.querySelector('[data-block-id]')&&content.scrollWidth>content.clientWidth+1
    const left=bounds.left+(parseFloat(ps.paddingLeft)||0)*scale,right=bounds.right-(parseFloat(ps.paddingRight)||0)*scale
    const excess=Math.max(0,(left-rect.left)/scale,(rect.right-right)/scale,leafOverflow?content.scrollWidth-content.clientWidth:0)
    if(excess<=1)return []
    const blockId=node.dataset.blockId??node.dataset.atlasBlock,parentId=parent.closest('[data-block-id],[data-atlas-block]')?.dataset.blockId??parent.closest('[data-atlas-block]')?.dataset.atlasBlock??null
    const props=resolveResponsive(page?.blocks[blockId]?.props??{},device),availableWidth=Math.max(0,(right-left)/scale)
    const property=props.minWidth>availableWidth?'minWidth':props.widthMode==='fixed'&&props.width>availableWidth?'width':props.widthMode==='percent'&&props.widthPercent===100&&parseFloat(ps.gap)>0?'widthPercent':style.position==='absolute'||parseFloat(style.left)?'offsetX':parseFloat(style.marginLeft)||parseFloat(style.marginRight)?'marginLeft':view.getComputedStyle(content).whiteSpace==='nowrap'?'whiteSpace':rect.width/scale>availableWidth?'width':'contenido'
    return [{blockId,parentId,property,availableWidth:Math.round(availableWidth),actualWidth:Math.round(Math.max(rect.width/scale,content.scrollWidth)),excess:Math.round(excess),device}]
  })
}
export function OverflowDiagnostics({ canvasRef }) {
  const page=useEditorStore(s=>s.page),device=useEditorStore(s=>s.device),select=useEditorStore(s=>s.select)
  const store=useEditorStoreInstance(),[issues,setIssues]=useState([])
  useEffect(()=>{
    const root=canvasRef.current?.querySelector('.atlas-wb-canvas__frame')
    if(!root)return undefined
    const view=root.ownerDocument.defaultView
    let pending
    const check=()=>{view.cancelAnimationFrame(pending);pending=view.requestAnimationFrame(()=>{const next=inspectOverflowDetails(root,{page,device});setIssues(next);store.setState({overflowDiagnostics:next})})}
    check()
    const observer=view.ResizeObserver?new view.ResizeObserver(check):null
    observer?.observe(root)
    for(const node of root.querySelectorAll('[data-block-id]'))observer?.observe(node)
    view.addEventListener('resize',check)
    root.addEventListener('load',check,true)
    return ()=>{observer?.disconnect();view.removeEventListener('resize',check);view.cancelAnimationFrame(pending);root.removeEventListener('load',check,true)}
  },[canvasRef,page,device,store])
  if(!issues.length)return null
  return <details className="atlas-wb-overflow-diagnostics">
    <summary>{issues.length} bloques pueden desbordar el lienzo</summary>
    <p>Revisa ancho, márgenes, separación y posición en el Inspector. El diseño se conserva hasta que lo ajustes.</p>
    {issues.slice(0,10).map(issue=><div key={issue.blockId}><button type="button" className="atlas-wb-btn atlas-wb-btn--secondary" onClick={()=>select(issue.blockId)}>Revisar {page.blocks[issue.blockId]?.type} · {issue.blockId}</button><p>{issue.actualWidth} px en {issue.availableWidth} px disponibles · exceso {issue.excess} px · {issue.device}. Padre: {issue.parentId??'lienzo'}. Causa probable: {issue.property}.</p></div>)}
  </details>
}

export function OverflowCorrection({blockId,definition}) {
  const diagnostics=useEditorStore(s=>s.overflowDiagnostics),device=useEditorStore(s=>s.device),update=useEditorStore(s=>s.updateBlockProps)
  const [limit,setLimit]=useState(undefined)
  const issue=diagnostics?.find(item=>item.blockId===blockId)
  if(!issue)return null
  const key=responsiveKey('maxWidth',device)
  return <div className="atlas-wb-overflow-correction" role="note">
    <p>{issue.actualWidth} px / {issue.availableWidth} px disponibles. Padre: {issue.parentId??'lienzo'}. Exceso: {issue.excess} px. Revisa {issue.property} ({device}).</p>
    {definition.fields?.[key]&&!definition.fields[key].readOnly&&<><NumberInput label="Límite de ancho para corregir" value={limit??Math.min(4000,issue.availableWidth)} onChange={setLimit} min={1} max={4000}/><button type="button" className="atlas-wb-btn atlas-wb-btn--secondary" disabled={!Number.isFinite(limit??issue.availableWidth)||(limit??issue.availableWidth)<1} onClick={()=>update(blockId,{[key]:Math.min(4000,limit??issue.availableWidth)})}>Aplicar límite de ancho</button></>}
  </div>
}
