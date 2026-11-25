export const geometryKeys = ['position','anchorX','anchorY','offsetX','offsetY','widthMode','width','widthPercent','heightMode','height','minHeight','rotation']
export const geometryKey = (key, device = 'desktop') => device === 'desktop' ? key : `${device}${key[0].toUpperCase()}${key.slice(1)}`
export const geometryDefaults = {position:'flow',anchorX:'left',anchorY:'top',offsetX:0,offsetY:0,widthMode:'auto',width:200,widthPercent:100,heightMode:'auto',height:100,minHeight:0,rotation:0}
export function resolveElementLayout(props,device='desktop') {
  return (device==='mobile'?['tablet','mobile']:device==='tablet'?['tablet']:[]).reduce((value,current)=>props[geometryKey('layout',current)]&&props[geometryKey('layout',current)]!=='inherit'?props[geometryKey('layout',current)]:value,props.layout)
}
export function resolveGeometry(props, device = 'desktop') {
  const result={...geometryDefaults,...Object.fromEntries(geometryKeys.filter(key=>props[key]!==undefined).map(key=>[key,props[key]]))}
  if (props.heightMode === undefined && Number.isFinite(props.imageHeight)) { result.heightMode='fixed';result.height=props.imageHeight }
  const inherited=device === 'mobile' ? ['tablet','mobile'] : device === 'tablet' ? ['tablet'] : []
  for (const current of inherited)
    for (const key of geometryKeys) if (props[geometryKey(key,current)] !== undefined) result[key]=props[geometryKey(key,current)]
  const layout=resolveElementLayout(props,device)
  if(layout==='free'&&result.heightMode==='auto'&&!['desktop',...inherited].some(current=>props[geometryKey('minHeight',current)]!==undefined))result.minHeight=360
  for(const [key,min,max] of [['offsetX',-2000,4000],['offsetY',-2000,4000],['width',1,4000],['widthPercent',1,100],['height',1,4000],['minHeight',0,4000],['rotation',-180,180]])
    result[key]=finite(result[key],min,max,geometryDefaults[key])
  for(const [key,options] of Object.entries({position:['flow','relative','absolute','sticky'],anchorX:['left','center','right'],anchorY:['top','center','bottom'],widthMode:['auto','fill','fixed','percent'],heightMode:['auto','fixed']}))
    if(!options.includes(result[key]))result[key]=geometryDefaults[key]
  return result
}
export const geometryPatch = (partial,device) => Object.fromEntries(Object.entries(partial).map(([key,value])=>[geometryKey(key,device),value]))
const finite=(value,min,max,fallback)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max?value:fallback
export function geometryStyle(props,device='desktop') {
  const g=resolveGeometry(props,device),absolute=g.position==='absolute'
  const x=finite(g.offsetX,-2000,4000,0),y=finite(g.offsetY,-2000,4000,0)
  const anchorX=['left','center','right'].includes(g.anchorX)?g.anchorX:'left',anchorY=['top','center','bottom'].includes(g.anchorY)?g.anchorY:'top'
  return {position:['relative','absolute','sticky'].includes(g.position)?g.position:'relative',
    width:g.widthMode==='fill'?'100%':g.widthMode==='fixed'?`${finite(g.width,1,4000,200)}px`:g.widthMode==='percent'?`${finite(g.widthPercent,1,100,100)}%`:'fit-content',
    height:g.heightMode==='fixed'?`${finite(g.height,1,4000,100)}px`:'auto',
    minheight:`${finite(g.minHeight,0,4000,0)}px`,
    flex:g.widthMode==='fill'?'var(--ae-fill-flex, 0 1 auto)':g.widthMode==='fixed'?'0 0 auto':'0 1 auto',
    left:absolute&&anchorX==='right'?'auto':g.position==='flow'?'auto':absolute&&anchorX==='center'?`calc(50% + ${x}px)`:`${x}px`,
    right:absolute&&anchorX==='right'?`${x}px`:'auto',
    top:absolute&&anchorY==='bottom'?'auto':g.position==='flow'?'auto':absolute&&anchorY==='center'?`calc(50% + ${y}px)`:`${y}px`,
    bottom:absolute&&anchorY==='bottom'?`${y}px`:'auto',
    translate:`translate(${absolute&&anchorX==='center'?'-50%':'0%'},${absolute&&anchorY==='center'?'-50%':'0%'})`,
    rotate:`${finite(g.rotation,-180,180,0)}deg`,
  }
}
export function geometryVariables(props) {
  return Object.fromEntries(['desktop','tablet','mobile'].flatMap(device=>Object.entries(geometryStyle(props,device)).map(([key,value])=>[`--ae-${device}-${key}`,value])))
}
export function offsetsForRect(rect,parent,geometry) {
  const offsetX=geometry.anchorX==='right'?parent.width-rect.x-rect.width:geometry.anchorX==='center'?rect.x+rect.width/2-parent.width/2:rect.x
  const offsetY=geometry.anchorY==='bottom'?parent.height-rect.y-rect.height:geometry.anchorY==='center'?rect.y+rect.height/2-parent.height/2:rect.y
  return {offsetX:Math.round(Math.max(-2000,Math.min(4000,offsetX))*100)/100,offsetY:Math.round(Math.max(-2000,Math.min(4000,offsetY))*100)/100}
}
export function resizeRect(rect,delta,handle,rotation=0,lockRatio=false,limits={}) {
  const radians=rotation*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians)
  const dx=c*delta.x+s*delta.y,dy=-s*delta.x+c*delta.y
  const horizontal=handle.includes('e')?1:handle.includes('w')?-1:0,vertical=handle.includes('s')?1:handle.includes('n')?-1:0
  const minHeight=Math.max(16,finite(limits.minHeight,0,4000,16)),maxWidth=finite(limits.maxWidth,16,4000,4000)
  let width=Math.max(16,Math.min(maxWidth,rect.width+horizontal*dx)),height=Math.max(minHeight,Math.min(4000,rect.height+vertical*dy))
  if(lockRatio){
    const factor=horizontal?width/rect.width:height/rect.height
    const bounded=Math.max(16/rect.width,minHeight/rect.height,Math.min(maxWidth/rect.width,4000/rect.height,factor))
    width=rect.width*bounded;height=rect.height*bounded
  }
  const shiftX=horizontal*(width-rect.width)/2,shiftY=vertical*(height-rect.height)/2
  return {x:rect.x+(rect.width-width)/2+c*shiftX-s*shiftY,y:rect.y+(rect.height-height)/2+s*shiftX+c*shiftY,width,height}
}
export function snapRect(rect,parent,tolerance=6) {
  const result={...rect},guides=[]
  for(const [axis,size] of [['x','width'],['y','height']]) {
    let best=null
    for(const target of [0,parent[size]/2,parent[size]]) for(const fraction of [0,.5,1]) {
      const distance=target-(rect[axis]+rect[size]*fraction)
      if(Math.abs(distance)<=(typeof tolerance==='number'?tolerance:tolerance[axis])&&(!best||Math.abs(distance)<Math.abs(best.distance)))best={distance,target}
    }
    if(best){result[axis]+=best.distance;guides.push({axis,value:best.target})}
  }
  return {rect:result,guides}
}
