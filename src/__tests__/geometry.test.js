import {describe,it,expect} from 'vitest'
import {resolveGeometry,geometryPatch,geometryVariables,geometryStyle,offsetsForRect,resizeRect,snapRect} from '../blocks/elements/geometry.js'
import {createEditorStore} from '../editor/store/createEditorStore.js'

describe('responsive free geometry',()=>{
  it('inherits each field independently, with mobile overrides never mutating larger breakpoints',()=>{
    const props={position:'absolute',offsetX:40,offsetY:50,widthMode:'fixed',width:200,tabletOffsetX:20,mobileOffsetY:80}
    expect(resolveGeometry(props,'desktop')).toMatchObject({offsetX:40,offsetY:50,width:200})
    expect(resolveGeometry(props,'tablet')).toMatchObject({offsetX:20,offsetY:50,width:200})
    expect(resolveGeometry(props,'mobile')).toMatchObject({offsetX:20,offsetY:80,width:200})
    expect(geometryPatch({offsetX:90,width:120},'mobile')).toEqual({mobileOffsetX:90,mobileWidth:120})
    expect(props.offsetX).toBe(40)
  })
  it('expresses right/center/bottom anchors and percentages as bounded CSS variables',()=>{
    const props={position:'absolute',anchorX:'right',anchorY:'center',offsetX:12,offsetY:-20,widthMode:'percent',widthPercent:80,mobileAnchorX:'center'}
    expect(geometryStyle(props)).toMatchObject({left:'auto',right:'12px',top:'calc(50% + -20px)',width:'80%',translate:'translate(0%,-50%)'})
    expect(geometryVariables(props)['--ae-mobile-left']).toBe('calc(50% + 12px)')
    expect(geometryVariables({...props,mobileOffsetX:Infinity,mobileWidthMode:'url(invalid)'})['--ae-mobile-width']).toBe('fit-content')
  })
  it('keeps a resized rotated opposite corner stationary and preserves ratio when requested',()=>{
    const rect={x:10,y:20,width:200,height:100}
    expect(resizeRect(rect,{x:40,y:20},'se')).toEqual({x:10,y:20,width:240,height:120})
    expect(resizeRect(rect,{x:-40,y:-20},'nw')).toEqual({x:-30,y:0,width:240,height:120})
    const rotated=resizeRect(rect,{x:0,y:40},'e',90)
    expect(rotated.width).toBeCloseTo(240);expect(rotated.x).toBeCloseTo(-10);expect(rotated.y).toBeCloseTo(40)
    const ratio=resizeRect(rect,{x:60,y:0},'se',0,true)
    expect(ratio.width/ratio.height).toBe(2)
    expect(resizeRect(rect,{x:-9999,y:-9999},'se',0,false,{minHeight:80})).toMatchObject({width:16,height:80})
  })
  it('converts logical rectangles back to anchor offsets without absolute page coordinates',()=>{
    expect(offsetsForRect({x:40,y:50,width:200,height:100},{width:800,height:600},{anchorX:'right',anchorY:'bottom'})).toEqual({offsetX:560,offsetY:450})
    expect(offsetsForRect({x:300,y:250,width:200,height:100},{width:800,height:600},{anchorX:'center',anchorY:'center'})).toEqual({offsetX:0,offsetY:0})
    expect(snapRect({x:297,y:249,width:200,height:100},{width:800,height:600},6)).toMatchObject({rect:{x:300,y:250},guides:[{axis:'x',value:400},{axis:'y',value:300}]})
  })
  it('reset deletes only that breakpoint and a gesture-sized mutation undoes atomically',()=>{
    const page={schemaVersion:1,id:'test',slug:'/',title:'Test',visibility:'public',regions:{main:{id:'main',children:['text']}},blocks:{text:{id:'text',type:'TextElementBlock',props:{offsetX:40,tabletOffsetX:20,mobileOffsetX:80},children:{}}}}
    const store=createEditorStore({page})
    store.getState().updateBlockProps('text',geometryPatch({position:'absolute',offsetX:120,offsetY:60,width:180},'mobile'))
    expect(store.temporal.getState().pastStates).toHaveLength(1)
    store.temporal.getState().undo()
    expect(store.getState().page.blocks.text.props).toEqual(page.blocks.text.props)
    store.temporal.getState().redo()
    store.getState().resetBlockProps('text',['mobileOffsetX'])
    const props=store.getState().page.blocks.text.props
    expect(props).not.toHaveProperty('mobileOffsetX');expect(resolveGeometry(props,'mobile').offsetX).toBe(20);expect(props.offsetX).toBe(40)
  })
  it('free containers have an initial editing area while explicit height can make them smaller',()=>{
    expect(resolveGeometry({layout:'free'}).minHeight).toBe(360)
    expect(resolveGeometry({layout:'free',mobileHeightMode:'fixed',mobileHeight:180},'mobile')).toMatchObject({height:180,minHeight:0})
  })
  it('palette placement and insertion form a single undoable document mutation',()=>{
    const page={schemaVersion:1,id:'test',slug:'/',title:'Test',visibility:'public',regions:{main:{id:'main',children:['box']}},blocks:{box:{id:'box',type:'BoxBlock',props:{layout:'free'},children:{children:[]}}}}
    const store=createEditorStore({page}),def={defaultProps:{text:'Elemento',widthMode:'auto'}}
    const id=store.getState().insertBlock('TextElementBlock',def,{parentId:'box',slotName:'children'},geometryPatch({position:'absolute',offsetX:40,offsetY:60},'mobile'))
    expect(store.getState().page.blocks[id].props).toMatchObject({mobilePosition:'absolute',mobileOffsetX:40,mobileOffsetY:60})
    expect(store.temporal.getState().pastStates).toHaveLength(1)
    store.temporal.getState().undo();expect(store.getState().page.blocks[id]).toBeUndefined()
  })
})
