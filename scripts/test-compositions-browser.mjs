import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
import {createRequire} from 'node:module'
import {resolve} from 'node:path'
import {mkdirSync} from 'node:fs'
const {chromium,webkit,expect}=createRequire(process.env.ATLAS_BROWSER_TOOLS??import.meta.url)('@playwright/test')
const server=await createServer({configFile:false,root:resolve('tests/browser'),plugins:[react()],server:{host:'127.0.0.1',port:0,fs:{allow:[process.cwd()]}}})
await server.listen();mkdirSync('.artifacts/compositions',{recursive:true})
try{
 for(const [name,engine,width] of [['chromium',chromium,1440],['webkit',webkit,390]]){
  const browser=await engine.launch();try{
   const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===390}),errors=[];page.on('pageerror',error=>errors.push(error.message))
   await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/compositions.html`)
   await page.getByRole('button',{name:'Probar acordeón'}).click()
   const first=page.getByRole('button',{name:'¿Cómo personalizo esta sección?'}),second=page.getByRole('button',{name:'¿Puedo reutilizar el diseño?'})
   await expect(first).toHaveAttribute('aria-expanded','true');await second.focus();await page.keyboard.press('Enter')
   await expect(first).toHaveAttribute('aria-expanded','false');await expect(second).toHaveAttribute('aria-expanded','true')
   await page.screenshot({path:`.artifacts/compositions/${name}-accordion.png`})
   await page.getByRole('button',{name:'Volver a editar'}).click()
   await page.getByRole('button',{name:'Seleccionar FAQ',exact:true}).click()
   if(width===390)await page.getByRole('navigation',{name:'Herramientas del editor'}).getByRole('button',{name:'Bloques',exact:true}).click()
   await page.getByRole('tab',{name:'Mis bloques',exact:true}).click()
   await page.getByLabel('Nombre del bloque').fill('FAQ propio');await page.getByRole('button',{name:'Guardar selección'}).click()
   await expect(page.getByRole('button',{name:'Insertar FAQ propio'})).toBeVisible()
   await page.screenshot({path:`.artifacts/compositions/${name}-library.png`})
   await page.getByRole('button',{name:'Insertar FAQ propio'}).click()
   if(errors.length)throw Error(errors.join('\n'))
   console.log(`${name}: keyboard accordion, saved selection and reusable insertion passed (${width}px)`)
  }finally{await browser.close()}
 }
}finally{await server.close()}
