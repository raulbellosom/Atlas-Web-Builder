import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { elementBlocks, BoxBlock, TextElementBlock, ButtonElementBlock } from '../blocks/elements/ElementBlocks.jsx'
import { elementItemStyle, elementSurfaceStyle } from '../blocks/elements/design.js'
import { serializePage, parsePage } from '../persistence/serializePage.js'
import { render, screen, cleanup } from '@testing-library/react'
import { LinkField } from '../editor/fields/LinkField.jsx'

export const elementPage = () => ({schemaVersion:1,id:'elements',slug:'/',title:'Composición',visibility:'public',
  regions:{main:{id:'main',children:['box']}},blocks:{
    box:{id:'box',type:'BoxBlock',props:{layout:'grid',columns:2,gap:24,mobileLayout:'column',stylePreset:'card',widthMode:'fill'},children:{children:['text','button']}},
    text:{id:'text',type:'TextElementBlock',props:{text:'Diseño propio',tag:'h1',fontSize:48,textColor:'#ff7700'},children:{}},
    button:{id:'button',type:'ButtonElementBlock',props:{label:'Comenzar',href:'/inicio',stylePreset:'pill',cornerRadius:12},children:{}},
  }})
describe('element composition',()=>{
  it('link controls accept anchors consistently and reject active or protocol-relative URLs',()=>{
    for (const [value,invalid] of [['#',false],['#contacto',false],['/ruta',false],['https://example.test',false],['javascript:alert(1)',true],['//example.test',true]]) {
      render(<LinkField label="Destino" value={value} onChange={()=>{}}/>)
      expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe(String(invalid));cleanup()
    }
  })
  it('renders editable elements inside a nested layout and preserves every design value through JSON',()=>{
    const page=elementPage(),copy=parsePage(serializePage(page))
    expect(copy.blocks).toEqual(page.blocks)
    const html=renderToStaticMarkup(<AtlasWebBuilderProvider blocks={elementBlocks}><AtlasWebRenderer page={copy}/></AtlasWebBuilderProvider>)
    expect(html).toContain('Diseño propio');expect(html).toContain('href="/inicio"')
    expect(html).toContain('--ae-desktop-display:grid');expect(html).toContain('--ae-mobile-direction:column')
    expect(html).toContain('font-size:48px');expect(html).toContain('border-radius:12px')
  })
  it('supports style presets with independent overrides and never accepts CSS strings as layout values',()=>{
    expect(elementSurfaceStyle({stylePreset:'pill',cornerRadius:4,textColor:'#123456'},{})).toMatchObject({borderRadius:4,color:'#123456'})
    const style=elementSurfaceStyle({backgroundColor:'url(https://example.test/track)',textColor:'red;position:fixed',width:'200px',position:'fixed',fontSize:Infinity,rotation:NaN},{})
    expect(style.background).toBeUndefined();expect(style.color).toBeUndefined();expect(style.position).toBeUndefined();expect(style.fontSize).toBeUndefined()
    expect(elementItemStyle({widthMode:'fixed',width:320,position:'absolute',offsetX:-20,offsetY:40,rotation:15})).toMatchObject({width:320,position:'absolute',left:-20,top:40,transform:'rotate(15deg)'})
  })
  it('rejects active links and never treats element text as HTML',()=>{
    const html=renderToStaticMarkup(ButtonElementBlock.render({...ButtonElementBlock.defaultProps,href:'javascript:alert(1)',label:'<script>test</script>',ctx:{}}))
    expect(html).toContain('href="#"');expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('javascript:')
  })
  it('provides primitives separately from complete sections with independently editable design fields',()=>{
    for(const block of elementBlocks){expect(block.kind).toBe('element');expect(block.fields.stylePreset.options.length).toBeGreaterThan(3)}
    expect(BoxBlock.slots).toHaveProperty('children')
    expect(TextElementBlock.fields).toHaveProperty('fontSize')
  })
})
