import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {AtlasWebBuilderEditor,AtlasWebBuilderProvider,AtlasWebRenderer,baseBlocks,useEditorStore,defaultTheme} from '../../src/index.js'
const page={schemaVersion:1,id:'page',slug:'/',title:'FAQ',regions:{main:{id:'main',children:['faq']}},blocks:{
 faq:{id:'faq',type:'AccordionBlock',props:{multiple:false,initialOpen:'first',activeBackground:'#184638',activeColor:'#ffffff',questionBackground:'#f2eee6',itemPadding:24,itemRadius:20,icon:'chevron',gap:16},children:{children:['q1','q2']}},
 q1:{id:'q1',type:'AccordionItemBlock',props:{title:'¿Cómo personalizo esta sección?'},children:{children:['answer']}},
 answer:{id:'answer',type:'TextElementBlock',props:{text:'Esta respuesta es un elemento editable con su propio diseño.',fontSize:18},children:{}},
 q2:{id:'q2',type:'AccordionItemBlock',props:{title:'¿Puedo reutilizar el diseño?'},children:{children:[]}},
},seo:{}}
let items=[]
const compositions={list:async()=>items,get:async id=>items.find(item=>item.id===id),save:async input=>{items=[{...input,id:'saved',revision:1}]},remove:async()=>{items=[]}}
function Select(){const select=useEditorStore(state=>state.select);return <button onClick={()=>select('faq')}>Seleccionar FAQ</button>}
function App(){const [preview,setPreview]=useState(false);return <><button onClick={()=>setPreview(!preview)}>{preview?'Volver a editar':'Probar acordeón'}</button><div style={{height:'calc(100dvh - 30px)'}}>{preview?<AtlasWebBuilderProvider blocks={baseBlocks} theme={defaultTheme}><AtlasWebRenderer page={page}/></AtlasWebBuilderProvider>:<AtlasWebBuilderEditor initialPage={page} blocks={baseBlocks} compositions={compositions} defaultAppearance="dark" brandLogo={<Select/>}/>}</div></>}
createRoot(document.getElementById('root')).render(<App/> )
