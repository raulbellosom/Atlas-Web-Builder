import React from 'react'
import {describe,it,expect,afterEach} from 'vitest'
import {render,screen,fireEvent,cleanup} from '@testing-library/react'
import {AtlasWebBuilderProvider} from '../provider/AtlasWebBuilderProvider.jsx'
import {AtlasWebRenderer} from '../renderer/AtlasWebRenderer.jsx'
import {baseBlocks} from '../blocks/index.js'
import {extractComposition} from '../templates/compositions.js'
import {createEditorStore} from '../editor/store/createEditorStore.js'
import {EditorStoreProvider} from '../editor/store/EditorStoreProvider.jsx'

afterEach(cleanup)
const page=()=>({schemaVersion:1,id:'page',slug:'/',title:'FAQ',regions:{main:{id:'main',children:['faq']}},blocks:{
  faq:{id:'faq',type:'AccordionBlock',props:{multiple:false,initialOpen:'first'},children:{children:['one','two']}},
  one:{id:'one',type:'AccordionItemBlock',props:{title:'Primera pregunta'},children:{children:['answer']}},
  answer:{id:'answer',type:'TextElementBlock',props:{text:'Respuesta editable'},children:{}},
  two:{id:'two',type:'AccordionItemBlock',props:{title:'Segunda pregunta'},children:{children:[]}},
},seo:{}})
describe('composable accordion',()=>{
  it('opens and closes accessibly, preserving rich children and exclusive opening',()=>{
    render(<AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={page()}/></AtlasWebBuilderProvider>)
    const first=screen.getByRole('button',{name:'Primera pregunta'}),second=screen.getByRole('button',{name:'Segunda pregunta'})
    expect(first.getAttribute('aria-expanded')).toBe('true');expect(second.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(second);expect(first.getAttribute('aria-expanded')).toBe('false');expect(second.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(second);expect(second.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Respuesta editable')).toBeTruthy()
  })
  it('allows multiple answers and keeps all content exposed when editing',()=>{
    const doc=page();doc.blocks.faq.props.multiple=true
    const {unmount}=render(<AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={doc}/></AtlasWebBuilderProvider>)
    fireEvent.click(screen.getByRole('button',{name:'Segunda pregunta'}));expect(screen.getAllByRole('button').every(button=>button.getAttribute('aria-expanded')==='true')).toBe(true)
    unmount();render(<AtlasWebBuilderProvider blocks={baseBlocks}><EditorStoreProvider initialPage={doc}><AtlasWebRenderer page={doc} mode="edit"/></EditorStoreProvider></AtlasWebBuilderProvider>)
    expect(screen.getAllByRole('button').every(button=>button.getAttribute('aria-expanded')==='true')).toBe(true)
  })
  it('extracts and reinserts independent editable compositions without ID collisions',()=>{
    const doc=page(),fragment=extractComposition(doc,'faq'),store=createEditorStore({page:doc})
    store.getState().applyTemplate({build:()=>fragment},{regionName:'main'})
    const updated=store.getState().page;expect(Object.keys(updated.blocks)).toHaveLength(8)
    expect(updated.regions.main.children).toHaveLength(2);expect(doc.blocks).toEqual(fragment.blocks)
  })
})
