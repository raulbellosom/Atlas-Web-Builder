import {useCallback,useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {Move} from 'lucide-react'
import {useEditorStoreInstance} from '../store/EditorStoreProvider.jsx'
import {geometryVariables,geometryPatch,resolveGeometry,offsetsForRect,resizeRect,snapRect} from '../../blocks/elements/geometry.js'
import {elementCoordinateSpace} from '../dnd/coordinates.js'

const handles={nw:'esquina superior izquierda',n:'borde superior',ne:'esquina superior derecha',e:'borde derecho',se:'esquina inferior derecha',s:'borde inferior',sw:'esquina inferior izquierda',w:'borde izquierdo'}
const number=value=>Number.parseFloat(value)||0
function applyPreview(node,props) {
  for(const [key,value] of Object.entries(geometryVariables(props)))node.style.setProperty(key,value)
}
function measuredRect(node,g) {
  const style=node.ownerDocument.defaultView.getComputedStyle(node),width=node.offsetWidth,height=node.offsetHeight
  const marginX=g.position==='absolute'&&g.anchorX==='right'?-number(style.marginRight):number(style.marginLeft)
  const marginY=g.position==='absolute'&&g.anchorY==='bottom'?-number(style.marginBottom):number(style.marginTop)
  return {x:node.offsetLeft-(g.position==='absolute'&&g.anchorX==='center'?width/2:0)-marginX,
    y:node.offsetTop-(g.position==='absolute'&&g.anchorY==='center'?height/2:0)-marginY,width,height}
}
export function FreeTransformControls({blockId,definition,elementRef,device,label,free}) {
  const store=useEditorStoreInstance(),gesture=useRef(null)
  const [visual,setVisual]=useState(null)
  const [available,setAvailable]=useState({wide:false,tall:false,edgeX:false,edgeY:false})
  useEffect(()=>{
    const node=elementRef.current,view=node.ownerDocument.defaultView
    const measure=()=>{
      const space=node.offsetParent&&elementCoordinateSpace(node.offsetParent)
      const width=node.offsetWidth*(space?.scale??1),height=node.offsetHeight*(space?.scaleY??1)
      const next={wide:width>=24,tall:height>=24,edgeX:width>=48,edgeY:height>=48}
      setAvailable(previous=>Object.keys(next).every(key=>next[key]===previous[key])?previous:next)
    }
    const observer=view.ResizeObserver?new view.ResizeObserver(measure):null
    observer?.observe(node)
    const stage=node.closest('.atlas-wb-canvas__stage');if(stage)observer?.observe(stage)
    view.addEventListener('resize',measure)
    measure();return()=>{observer?.disconnect();view.removeEventListener('resize',measure)}
  },[elementRef])
  const cancel=useCallback(()=>{
    const active=gesture.current
    if(!active)return
    gesture.current=null
    active.endSignals?.()
    const block=store.getState().page.blocks[blockId]
    if(block&&active.node.isConnected)applyPreview(active.node,{...definition.defaultProps,...block.props})
  },[store,blockId,definition])
  useEffect(()=>cancel,[cancel])
  function start(event,handle) {
    if(event.button!==0||event.isPrimary===false)return
    event.preventDefault();event.stopPropagation()
    event.currentTarget.focus({preventScroll:true})
    const node=elementRef.current,parent=node?.offsetParent,matrix=parent&&elementCoordinateSpace(parent)
    if(!node||!parent||!matrix)return
    const state=store.getState(),props={...definition.defaultProps,...state.page.blocks[blockId].props},geometry=resolveGeometry(props,device)
    const rect=measuredRect(node,geometry)
    gesture.current={node,parent,matrix,rect,props,geometry,page:state.page,handle,pointerId:event.pointerId,
      x:event.clientX,y:event.clientY,parentSize:{width:parent.clientWidth,height:parent.clientHeight},patch:null}
    const view=node.ownerDocument.defaultView,blur=()=>{cancel();setVisual(null)}
    view.addEventListener('blur',blur,{once:true})
    gesture.current.endSignals=()=>view.removeEventListener('blur',blur)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event) {
    const active=gesture.current
    if(!active||active.pointerId!==event.pointerId)return
    event.preventDefault();event.stopPropagation()
    if(store.getState().page!==active.page){cancel();setVisual(null);return}
    const dx=event.clientX-active.x,dy=event.clientY-active.y,{inverse}=active.matrix
    const delta={x:inverse.a*dx+inverse.c*dy,y:inverse.b*dx+inverse.d*dy}
    if(Math.abs(delta.x)+Math.abs(delta.y)<.1)return
    let rect,guides=[]
    if(active.handle==='move'){
      if(event.shiftKey){if(Math.abs(delta.x)>=Math.abs(delta.y))delta.y=0;else delta.x=0}
      rect={...active.rect,x:active.rect.x+delta.x,y:active.rect.y+delta.y}
      if(!event.altKey){const snapped=snapRect(rect,active.parentSize,{x:6/active.matrix.scale,y:6/active.matrix.scaleY});rect=snapped.rect;guides=snapped.guides}
    } else rect=resizeRect(active.rect,delta,active.handle,active.geometry.rotation,event.shiftKey,
      {minHeight:resolveGeometry({...active.props,...geometryPatch({heightMode:'fixed'},device)},device).minHeight,maxWidth:active.props.maxWidth})
    const geometry=free?{position:'absolute',anchorX:active.geometry.anchorX,anchorY:active.geometry.anchorY,...offsetsForRect(rect,active.parentSize,active.geometry)}:{}
    if(active.handle!=='move')Object.assign(geometry,{widthMode:'fixed',width:Math.round(rect.width*100)/100,heightMode:'fixed',height:Math.round(rect.height*100)/100})
    else if(active.geometry.position!=='absolute')Object.assign(geometry,{widthMode:'fixed',width:active.rect.width})
    active.patch=geometryPatch(geometry,device)
    applyPreview(active.node,{...active.props,...active.patch})
    setVisual({parent:active.parent,guides,width:rect.width,height:rect.height})
  }
  function finish(event) {
    const active=gesture.current
    if(!active||active.pointerId!==event.pointerId)return
    event.preventDefault();event.stopPropagation()
    if(active.patch&&store.getState().page===active.page){gesture.current=null;active.endSignals?.();store.getState().updateBlockProps(blockId,active.patch)}
    else cancel()
    setVisual(null)
  }
  function keyDown(event,handle) {
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return
    event.preventDefault();event.stopPropagation()
    const step=event.shiftKey?10:1
    const node=elementRef.current,parent=node?.offsetParent
    if(!node||!parent)return
    const props={...definition.defaultProps,...store.getState().page.blocks[blockId].props},g=resolveGeometry(props,device)
    const delta={x:event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,y:event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0}
    const rect=measuredRect(node,g)
    const next=handle==='move'?{...rect,x:rect.x+delta.x,y:rect.y+delta.y}:resizeRect(rect,delta,handle,g.rotation,false,{minHeight:resolveGeometry({...props,...geometryPatch({heightMode:'fixed'},device)},device).minHeight,maxWidth:props.maxWidth})
    store.getState().updateBlockProps(blockId,geometryPatch({...(free?{position:'absolute',anchorX:g.anchorX,anchorY:g.anchorY,...offsetsForRect(next,{width:parent.clientWidth,height:parent.clientHeight},g)}:{}),
      ...(handle==='move'?(g.position==='absolute'?{}:{widthMode:'fixed',width:rect.width}):{widthMode:'fixed',width:Math.round(next.width*100)/100,heightMode:'fixed',height:Math.round(next.height*100)/100})},device))
  }
  const events=handle=>({onPointerDown:event=>start(event,handle),onPointerMove:move,onPointerUp:finish,
    onPointerCancel:()=>{cancel();setVisual(null)},onLostPointerCapture:()=>{cancel();setVisual(null)},onKeyDown:event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();setVisual(null)}else keyDown(event,handle)
    }})
  const visibleHandle=handle=>handle==='se'||handle==='s'&&available.edgeX||handle==='e'&&available.edgeY||
    free&&(handle==='sw'&&available.wide||handle==='ne'&&available.tall||handle==='nw'&&available.wide&&available.tall||handle==='n'&&available.edgeX||handle==='w'&&available.edgeY)
  return <>
    <div className="atlas-wb-transform-controls" aria-label={`Transformar ${label}`}>
      {free&&<button type="button" className="atlas-wb-transform-move" aria-label={`Mover libremente ${label}`} title="Mover · Mayús: un eje · Alt: sin ajuste" {...events('move')}><Move/></button>}
      {Object.entries(handles).filter(([handle])=>visibleHandle(handle)).map(([handle,name])=><button type="button" key={handle} className={`atlas-wb-transform-handle atlas-wb-transform-handle--${handle}`} aria-label={`Cambiar tamaño desde ${name}`} title="Arrastrar · Mayús: conservar proporción" {...events(handle)}/>)}
      {visual&&<span className="atlas-wb-transform-size" aria-live="off">{Math.round(visual.width)} × {Math.round(visual.height)}</span>}
    </div>
    {visual&&createPortal(<div className="atlas-wb-transform-guides" aria-hidden="true">{visual.guides.map(guide=><i key={guide.axis} data-axis={guide.axis} style={guide.axis==='x'?{left:guide.value}:{top:guide.value}}/>)}</div>,visual.parent)}
  </>
}
