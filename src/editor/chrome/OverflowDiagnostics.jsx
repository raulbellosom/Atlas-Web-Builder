import { useEffect, useState } from 'react'
import { useEditorStore } from '../store/EditorStoreProvider.jsx'

export function inspectHorizontalOverflow(root) {
  if (!root) return []
  const bounds=root.getBoundingClientRect()
  return [...root.querySelectorAll('[data-block-id]')].filter(node=>{
    const rect=node.getBoundingClientRect(),style=node.ownerDocument.defaultView.getComputedStyle(node)
    const content=node.querySelector(':scope > .atlas-element-surface')??node
    const leafOverflow=!content.querySelector('[data-block-id]')&&content.scrollWidth>content.clientWidth+1
    return rect.width>0&&style.visibility!=='hidden'&&(rect.left<bounds.left-1||rect.right>bounds.right+1||leafOverflow)
  }).map(node=>node.dataset.blockId)
}
export function OverflowDiagnostics({ canvasRef }) {
  const page=useEditorStore(s=>s.page),device=useEditorStore(s=>s.device),select=useEditorStore(s=>s.select)
  const [ids,setIds]=useState([])
  useEffect(()=>{
    const root=canvasRef.current?.querySelector('.atlas-wb-canvas__frame')
    if(!root)return undefined
    const view=root.ownerDocument.defaultView
    let pending
    const check=()=>{view.cancelAnimationFrame(pending);pending=view.requestAnimationFrame(()=>setIds(inspectHorizontalOverflow(root)))}
    check()
    const observer=view.ResizeObserver?new view.ResizeObserver(check):null
    observer?.observe(root)
    for(const node of root.querySelectorAll('[data-block-id]'))observer?.observe(node)
    view.addEventListener('resize',check)
    root.addEventListener('load',check,true)
    return ()=>{observer?.disconnect();view.removeEventListener('resize',check);view.cancelAnimationFrame(pending);root.removeEventListener('load',check,true)}
  },[canvasRef,page,device])
  if(!ids.length)return null
  return <details className="atlas-wb-overflow-diagnostics">
    <summary>{ids.length} bloques pueden desbordar el lienzo</summary>
    <p>Revisa ancho, márgenes, separación y posición en el Inspector. El diseño se conserva hasta que lo ajustes.</p>
    {ids.slice(0,10).map(id=><button key={id} type="button" className="atlas-wb-btn atlas-wb-btn--secondary" onClick={()=>select(id)}>Revisar {page.blocks[id]?.type} · {id}</button>)}
  </details>
}
