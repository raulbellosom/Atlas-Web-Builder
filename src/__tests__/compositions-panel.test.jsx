import React from 'react'
import {it,expect,vi} from 'vitest'
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react'
import {AtlasWebBuilderProvider} from '../provider/AtlasWebBuilderProvider.jsx'
import {EditorStoreProvider,useEditorStore} from '../editor/store/EditorStoreProvider.jsx'
import {CompositionsPanel} from '../editor/chrome/CompositionsPanel.jsx'
import {baseBlocks} from '../blocks/index.js'

it('saves a selection, inserts an editable copy, and confirms replacement and deletion',async()=>{
  let saved=[]
  const source={schemaVersion:1,id:'page',slug:'/',title:'Prueba',regions:{main:{id:'main',children:['box']}},blocks:{box:{id:'box',type:'BoxBlock',props:{layout:'column'},children:{children:['text']}},text:{id:'text',type:'TextElementBlock',props:{text:'Contenido propio'},children:{}}},seo:{}}
  const adapter={list:vi.fn(async()=>saved),get:vi.fn(async()=>saved[0]),save:vi.fn(async input=>{saved=[{...input,id:'saved',revision:(input.expectedRevision??0)+1}]}),remove:vi.fn(async()=>{saved=[]})}
  function Harness(){const select=useEditorStore(state=>state.select),page=useEditorStore(state=>state.page);return <><button onClick={()=>select('box')}>Seleccionar contenedor</button><output data-testid="count">{Object.keys(page.blocks).length}</output><CompositionsPanel/></>}
  render(<AtlasWebBuilderProvider blocks={baseBlocks} compositions={adapter}><EditorStoreProvider initialPage={source}><Harness/></EditorStoreProvider></AtlasWebBuilderProvider>)
  try{
    fireEvent.click(screen.getByRole('button',{name:'Seleccionar contenedor'}));fireEvent.change(screen.getByLabelText('Nombre del bloque'),{target:{value:'Mi sección'}})
    fireEvent.click(screen.getByRole('button',{name:'Guardar selección'}));await screen.findByRole('button',{name:'Insertar Mi sección'})
    expect(adapter.save.mock.calls[0][0].fragment.blocks).toEqual(source.blocks)
    fireEvent.click(screen.getByRole('button',{name:'Insertar Mi sección'}));await waitFor(()=>expect(screen.getByTestId('count').textContent).toBe('4'))
    fireEvent.click(screen.getByRole('button',{name:'Reemplazar por selección'}));fireEvent.click(screen.getByRole('button',{name:'Confirmar'}));await waitFor(()=>expect(adapter.save).toHaveBeenCalledTimes(2))
    await waitFor(()=>expect(screen.queryByRole('button',{name:'Confirmar'})).toBeNull())
    fireEvent.click(screen.getByRole('button',{name:'Eliminar Mi sección'}));expect(adapter.remove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button',{name:'Confirmar'}));await waitFor(()=>expect(adapter.remove).toHaveBeenCalledWith('saved',2))
    expect(screen.getByTestId('count').textContent).toBe('4')
  }finally{cleanup()}
})
