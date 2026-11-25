import React from 'react'
import { createRoot } from 'react-dom/client'
import { AtlasWebBuilderEditor, AtlasWebBuilderProvider, AtlasWebRenderer, baseBlocks } from '../../src/index.js'
import { kyntraHero } from './kyntra-hero.js'
// Read-only revision 8 hero extract; asset handles use local SVGs with the original natural dimensions.
import revision8 from './kyntra-revision-8.json'

const params = new URLSearchParams(location.search)
const width = Number(params.get('width')) || 1280
const mode = params.get('mode') || 'public'
const fixture = params.has('revision8') ? revision8 : kyntraHero
// Measure the real editor at the same page-container width as presentation, independent of its chrome and zoom.
const frameStyle = `.atlas-wb-canvas__frame{width:${width}px!important;transform:none!important;--awb-canvas-scale:1!important}`
createRoot(document.getElementById('root')).render(mode === 'edit'
  ? <><style>{frameStyle}</style><div style={{ height: '100vh' }}><AtlasWebBuilderEditor initialPage={fixture} blocks={baseBlocks} /></div></>
  : <div style={{ width }}><AtlasWebBuilderProvider blocks={baseBlocks}><AtlasWebRenderer page={fixture} mode={mode} /></AtlasWebBuilderProvider></div>)
