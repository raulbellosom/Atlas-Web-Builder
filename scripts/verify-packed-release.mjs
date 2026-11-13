/* global window, process, console, structuredClone */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Extract the actual release bytes. Reuse each consumer's locked dependencies, never its Atlas installation.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const erp=resolve(root,'../runly'),hub=resolve(root,'../runly-developer-hub')
const {legacyAtlasPackage}=await import(pathToFileURL(join(hub,'tests/support/atlas-legacy-fixture.js')))
const legacyRoot=await legacyAtlasPackage(),legacyRequire=createRequire(join(legacyRoot,'package.json')),legacyAtlas=legacyRequire('@raulbellosom/atlas-web-builder')
assert.equal(legacyAtlas.version,'0.3.5')
const tarball=resolve(process.argv[2]??'.artifacts/releases/0.4.0/raulbellosom-atlas-web-builder-0.4.0.tgz')
const scratch=mkdtempSync(join(tmpdir(),'atlas-040-adoption-'))
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
const report={tarballSha256:sha(readFileSync(tarball)),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),fixtures:[]}
function packageDir(require,name){
  try{return dirname(require.resolve(`${name}/package.json`))}catch{
    let dir=dirname(require.resolve(name))
    while(!existsSync(join(dir,'package.json'))||JSON.parse(readFileSync(join(dir,'package.json'))).name!==name){
      const parent=dirname(dir);assert.notEqual(parent,dir,`Cannot locate ${name}`);dir=parent
    }
    return dir
  }
}
function linkPackage(nm,name,dir){
  const dest=join(nm,...name.split('/'));mkdirSync(dirname(dest),{recursive:true})
  symlinkSync(realpathSync(dir),dest,'junction')
}
function fixture(name,manifest){
  const dir=join(scratch,name),nm=join(dir,'node_modules'),pkg=join(nm,'@raulbellosom/atlas-web-builder')
  mkdirSync(pkg,{recursive:true});writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,type:'module'}))
  execFileSync('tar',['-xzf',tarball,'--strip-components=1','-C',pkg])
  const original=createRequire(manifest),originalAtlas=createRequire(join(packageDir(original,'@raulbellosom/atlas-web-builder'),'package.json'))
  const metadata=JSON.parse(readFileSync(join(pkg,'package.json')))
  for(const dep of Object.keys(metadata.dependencies))linkPackage(nm,dep,packageDir(originalAtlas,dep))
  for(const dep of ['react','react-dom'])linkPackage(nm,dep,packageDir(original,dep))
  return {dir,nm,pkg,require:createRequire(join(dir,'package.json')),original}
}

const environments=[fixture('react18',join(root,'package.json')),fixture('hub',join(hub,'package.json')),fixture('erp',join(erp,'apps/desktop/package.json'))]
// Exercise the baseline loader with 0.4.0 actually installed: post-publication verification must keep testing real 0.3.5 bytes.
const copiedLegacyHelper=join(environments[1].dir,'tests/support/atlas-legacy-fixture.js')
mkdirSync(dirname(copiedLegacyHelper),{recursive:true});cpSync(join(hub,'tests/support/atlas-legacy-fixture.js'),copiedLegacyHelper)
const afterAdoption=await (await import(pathToFileURL(copiedLegacyHelper))).legacyAtlasPackage()
assert.equal(JSON.parse(readFileSync(join(afterAdoption,'package.json'))).version,'0.3.5');report.legacyAfterAdoption=true
const sourcemap=JSON.parse(readFileSync(join(environments[0].pkg,'dist/atlas-web-builder.js.map')))
let sourceCount=0
for(const [index,name] of sourcemap.sources.entries()){
  if(!name.includes('/src/'))continue
  const path=`src/${name.split('/src/')[1]}`
  const expected=execFileSync('git',['show',`${report.source}:${path}`],{cwd:root,encoding:'utf8'})
  assert.equal(sourcemap.sourcesContent[index].replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'),path);sourceCount++
}
assert(sourceCount>=112);report.sourcesVerified=sourceCount
for(const path of ['package.json','README.md','CHANGELOG.md','LICENSE','docs/contracts/WEBSITE_EDITOR_CAPABILITIES_V1.md','docs/releases/0.3.5-provenance.md','docs/releases/0.4.0-migration.md']){
  const expected=execFileSync('git',['show',`${report.source}:${path}`],{cwd:root,encoding:'utf8'})
  const actual=readFileSync(join(environments[0].pkg,path),'utf8')
  if(path==='package.json')assert.deepEqual(JSON.parse(actual),JSON.parse(expected))
  else assert.equal(actual.replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'),path)
}
const page={schemaVersion:1,id:'packed',slug:'/',title:'Packed',visibility:'public',regions:{main:{children:['h']}},blocks:{h:{id:'h',type:'HeadingBlock',props:{text:'Packed release · ñ',_opacity:0.6,_hover:{scale:'1.05',shadow:'md'},customHistorical:'preserved'}}},seo:{title:'SEO preservado'}}
for(const f of environments){
  const atlas=f.require('@raulbellosom/atlas-web-builder'),esm=await import(pathToFileURL(join(f.pkg,'dist/atlas-web-builder.js')))
  const original=legacyAtlas,React=f.require('react'),server=f.require('react-dom/server')
  assert.equal(atlas.version,'0.4.0');assert.equal(atlas.getVersion(),'0.4.0');assert.equal(atlas.editorCapabilitiesVersion,1)
  assert.deepEqual(Object.keys(atlas).sort(),Object.keys(esm).sort());assert.equal(Object.keys(atlas).length,140)
  assert(Object.keys(original).every(key=>key in atlas));assert.equal(React,f.original('react'))
  assert.deepEqual(atlas.EFFECT_PRESETS,original.EFFECT_PRESETS);assert.deepEqual(atlas.EFFECT_SHAPES,original.EFFECT_SHAPES)
  assert(readFileSync(f.require.resolve('@raulbellosom/atlas-web-builder/styles')).equals(readFileSync(legacyRequire.resolve('@raulbellosom/atlas-web-builder/styles'))))
  assert.equal(JSON.parse(readFileSync(f.require.resolve('@raulbellosom/atlas-web-builder/package.json'))).version,'0.4.0')
  const reopened=atlas.parsePage(atlas.serializePage(page));assert.deepEqual(reopened.blocks,page.blocks);assert.deepEqual(reopened.seo,page.seo)
  const head=atlas.renderSeoHead(reopened,{}, {baseUrl:'https://example.test'})
  assert(head.includes('SEO preservado'));assert(head.includes('https://example.test/'))
  const html=server.renderToString(React.createElement(atlas.AtlasWebBuilderProvider,{blocks:atlas.baseBlocks},React.createElement(atlas.AtlasWebRenderer,{page:reopened})))
  assert(html.includes('Packed release · ñ'));assert(html.includes('opacity:0.6'));assert(html.includes(':hover'))
  for(const name of ['CHANGELOG.md','docs/releases/0.4.0-migration.md','docs/contracts/WEBSITE_EDITOR_CAPABILITIES_V1.md'])assert(existsSync(join(f.pkg,name)))
  const item={consumer:basename(f.dir),react:React.version,reactDom:f.require('react-dom').version,exports:Object.keys(atlas).length,packageRoot:f.pkg,cssSha256:sha(readFileSync(join(f.pkg,'dist/style.css'))),roundtrip:true,ssr:true}
  report.fixtures.push(item);console.log(JSON.stringify(item))
}

const hubFixture=environments[1]
try{
  const output=execFileSync(process.execPath,['--test','tests/website-capabilities.test.js','tests/website-capabilities-browser.test.js'],{cwd:hub,env:{...process.env,ATLAS_TEST_PACKAGE_ROOT:hubFixture.pkg,ATLAS_TEST_LEGACY_PACKAGE_ROOT:legacyRoot},encoding:'utf8'})
  console.log(output);report.hubTests='7 passed, including Chromium Frame roundtrip and legacy rejection'
}catch(error){console.error(error.stdout?.toString());console.error(error.stderr?.toString());throw error}
for(const f of [environments[0],environments[2]]){
  try{
    console.log(execFileSync(process.execPath,['--test','tests/website-capabilities-browser.test.js'],{cwd:hub,env:{...process.env,ATLAS_TEST_PACKAGE_ROOT:f.pkg,ATLAS_TEST_LEGACY_PACKAGE_ROOT:legacyRoot},encoding:'utf8'}))
    report.fixtures.find(item=>item.consumer===basename(f.dir)).editorBrowser=true
  }catch(error){console.error(error.stdout?.toString());console.error(error.stderr?.toString());throw error}
}
report.fixtures.find(item=>item.consumer==='hub').editorBrowser=true

// Build the real ERP public client + SSR from an isolated source snapshot and the extracted package.
const f=environments[2]
for(const path of ['scripts/build-website-public-runtime.mjs','apps/api/package.json','apps/api/src/services/website-block-effects.js','apps/desktop/package.json','apps/desktop/src/website','apps/desktop/src/lib/runtimeConfig.js']){
  const target=join(f.dir,path);mkdirSync(dirname(target),{recursive:true});cpSync(join(erp,path),target,{recursive:true})
}
const blocks=join(f.nm,'@runly/website-blocks');mkdirSync(dirname(blocks),{recursive:true});cpSync(join(erp,'packages/website-blocks'),blocks,{recursive:true,filter:path=>!path.split(/[\\/]/).includes('node_modules')})
linkPackage(f.nm,'esbuild',packageDir(createRequire(join(erp,'apps/api/package.json')),'esbuild'))
const {isValidEffect}=await import(pathToFileURL(join(f.dir,'apps/api/src/services/website-block-effects.js')))
assert(isValidEffect('_opacity',0.6));assert(isValidEffect('_animation',{preset:'fade-in',duration:600,delay:0,easing:'ease'}))
assert.equal(isValidEffect('_opacity',2),false);assert.equal(isValidEffect('_animation',{preset:'bad;css'}),false)
const builder=await import(pathToFileURL(join(f.dir,'scripts/build-website-public-runtime.mjs')))
const files=await builder.buildWebsitePublicRuntime()
assert.equal(files['entry.js'].rendererVersion,'0.4.0');assert.equal(files['style.css'].rendererVersion,'0.4.0')
const ssr=await builder.buildWebsiteSsr(undefined,files['entry.js'].hash),ssrFile=join(f.dir,'ssr.mjs');writeFileSync(ssrFile,ssr)
const {renderPage}=await import(pathToFileURL(ssrFile))
const publicPage=structuredClone(page)
publicPage.blocks.n={id:'n',type:'NavbarBlock',props:{brand:'Packed Runly',links:'Inicio | /',mobileBreakpoint:'768px'}}
publicPage.regions.main.children.unshift('n')
const result=renderPage({page:{publishedBuilderData:publicPage},theme:null,config:{apiUrl:'https://api.example.test',siteId:'fixture'}})
assert(result.html.includes('Packed release · ñ'));assert(result.html.includes('opacity:0.6'));assert.equal(result.hydrate,true)
const metadataPath=join(f.pkg,'package.json'),metadataBytes=readFileSync(metadataPath)
try{
  const metadata=JSON.parse(metadataBytes);metadata.version='0.4.99';writeFileSync(metadataPath,JSON.stringify(metadata))
  await assert.rejects(builder.buildWebsitePublicRuntime(),/explicitly reviewed runtime update/)
}finally{writeFileSync(metadataPath,metadataBytes)}
report.erpRuntime={rendererVersion:'0.4.0',clientSha256:files['entry.js'].hash,cssSha256:files['style.css'].hash,ssrSha256:sha(ssr),ssr:true,unknownVersionRejected:true}
const server=createServer((req,res)=>{
  if(req.url.startsWith('/public/website/resolve')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({releaseId:'packed',site:{id:'fixture',company:'example'},page:{publishedBuilderData:publicPage},theme:null}));return}
  if(req.url==='/entry.js'){res.setHeader('Content-Type','text/javascript');res.end(files['entry.js'].bytes);return}
  if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(files['style.css'].bytes);return}
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<html data-release="packed"><head><link rel="stylesheet" href="/style.css"></head><body><div id="runly-public-root" data-ssr="hydrate">${result.html}</div><script type="module" src="/entry.js"></script></body></html>`)
})
server.listen(0,'127.0.0.1');await once(server,'listening')
let browser
try{
  const {chromium}=createRequire(join(hub,'package.json'))('@playwright/test')
  browser=await chromium.launch({headless:true});const browserPage=await browser.newPage({viewport:{width:390,height:850}}),errors=[]
  browserPage.on('pageerror',error=>errors.push(error.message));browserPage.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())})
  await browserPage.goto(`http://127.0.0.1:${server.address().port}`)
  await browserPage.waitForFunction(()=>window.RUNLY_CONFIG?.siteId==='fixture')
  const menu=browserPage.getByRole('button',{name:/menú/i});await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true')
  assert.equal(await browserPage.getByRole('heading',{name:'Packed release · ñ',exact:true}).count(),1)
  assert.deepEqual(errors,[]);report.erpRuntime.hydrationBrowser=true
}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify(report.erpRuntime))
mkdirSync(join(root,'.artifacts/releases/0.4.0'),{recursive:true})
writeFileSync(join(root,'.artifacts/releases/0.4.0/adoption.json'),JSON.stringify(report,null,2)+'\n')
console.log(`Adoption verified. Isolated fixtures retained at ${scratch}`)
