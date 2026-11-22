import { describe, it, expect } from 'vitest'
import { resolveResponsive } from '../blocks/elements/responsive.js'
import { elementSurfaceStyle, elementOuterStyle, containerLimit } from '../blocks/elements/design.js'
import { BoxBlock, TextElementBlock } from '../blocks/elements/ElementBlocks.jsx'
import { createEditorStore } from '../editor/store/createEditorStore.js'
import { parsePage, serializePage } from '../persistence/serializePage.js'

describe('responsive styles use the existing portable property format', () => {
  it('supports container presets, full bleed, background clearing and collapsed visibility',()=>{
    expect(containerLimit({containerPreset:'xl'})).toBe('1280px')
    expect(containerLimit({containerPreset:'2xl'})).toBe('1536px')
    expect(elementOuterStyle({containerPreset:'xl'})).toMatchObject({maxWidth:'1280px',marginInline:'auto'})
    expect(elementOuterStyle({containerPreset:'xl',fullBleed:true}).maxWidth).toBeUndefined()
    expect(elementOuterStyle({visibility:'hidden'})).toMatchObject({visibility:'hidden'})
    const visibility=elementOuterStyle({visibility:'visible',mobileVisibility:'collapsed'})
    expect(visibility['--ar-mobile-display']).toBe('none')
    expect(visibility['--ar-desktop-display']).not.toBe('none')
    const surface=elementSurfaceStyle({backgroundImage:'https://example.test/photo.webp',mobileBackgroundImage:''},{mode:'edit'})
    expect(surface['--ar-mobile-backgroundImage']).toBe('none')
    expect(surface['--ar-desktop-backgroundImage']).toBe('url("https://example.test/photo.webp")')
    expect(elementSurfaceStyle({backgroundImage:'javascript:alert(1)'},{}).backgroundImage).toBeUndefined()
  })
  it('keeps historical mobile defaults until an explicit inheritance reset, including after reopen',()=>{
    const props={...BoxBlock.defaultProps,layout:'grid',columns:3,tabletColumns:2}
    expect(resolveResponsive(props,'mobile').columns).toBe(1)
    const store=createEditorStore()
    store.getState().insertBlock('BoxBlock',BoxBlock)
    const id=store.getState().selectedId
    store.getState().updateBlockProps(id,props)
    store.getState().resetBlockProps(id,['mobileColumns'],{mobileColumnsInherit:true})
    const saved=parsePage(serializePage(store.getState().page)).blocks[id].props
    expect(resolveResponsive({...BoxBlock.defaultProps,...saved},'mobile').columns).toBe(2)
    expect(resolveResponsive({...BoxBlock.defaultProps,...saved,tabletColumns:4},'mobile').columns).toBe(4)
    store.temporal.getState().undo()
    expect(resolveResponsive({...BoxBlock.defaultProps,...store.getState().page.blocks[id].props},'mobile').columns).toBe(1)
  })
  it('inherits independently and keeps zero, false and explicit resets', () => {
    const props = { fontSize: 64, paddingLeft: 24, tabletFontSize: 40, mobilePaddingLeft: 0, mobileFontSize: 'inherit' }
    expect(resolveResponsive(props, 'mobile')).toMatchObject({ fontSize: 40, paddingLeft: 0 })
    expect(resolveResponsive(props)).toMatchObject({ fontSize: 64, paddingLeft: 24 })
  })
  it('generates validated surface and outer variables without leaking CSS strings', () => {
    const props = { fontSize: 64, tabletFontSize: 40, mobileFontSize: 28, mobilePaddingLeft: 0, mobileTextColor: '#123456', mobileMarginTop: 0 }
    expect(elementSurfaceStyle(props, { mode: 'edit' })).toMatchObject({
      fontSize: 'var(--ar-fontSize)', '--ar-desktop-fontSize': '64px', '--ar-tablet-fontSize': '40px', '--ar-mobile-fontSize': '28px', '--ar-mobile-paddingLeft': '0px', '--ar-mobile-color': '#123456',
    })
    expect(elementOuterStyle(props)).toMatchObject({ marginTop: 'var(--ar-marginTop)', '--ar-mobile-marginTop': '0px' })
    const style=elementSurfaceStyle({ mobileTextColor: 'url(https://example.test)', mobileFontSize: Infinity }, {})
    expect(JSON.stringify(style)).not.toContain('example.test')
    expect(JSON.stringify(style)).not.toContain('Infinity')
  })
  it('advertises only fields that the renderer implements', () => {
    expect(TextElementBlock.fields.fontSize.responsive).toBe(true)
    expect(TextElementBlock.fields.mobileFontSize.responsiveBase).toBe('fontSize')
    expect(BoxBlock.fields.mobileGap).toMatchObject({ type: 'number', min: 0, max: 128 })
    expect(TextElementBlock.fields.text.responsive).toBeUndefined()
  })
  it('tracks override edits and resets through undo, redo, save and reopen', () => {
    const store=createEditorStore()
    store.getState().insertBlock('TextElementBlock',TextElementBlock)
    const id=store.getState().selectedId
    store.getState().updateBlockProps(id,{fontSize:64,mobileFontSize:28})
    store.getState().resetBlockProps(id,['mobileFontSize'])
    expect(store.getState().page.blocks[id].props.mobileFontSize).toBeUndefined()
    store.temporal.getState().undo()
    expect(store.getState().page.blocks[id].props.mobileFontSize).toBe(28)
    const reopened=parsePage(serializePage(store.getState().page))
    expect(reopened.blocks[id].props).toMatchObject({fontSize:64,mobileFontSize:28})
    store.temporal.getState().redo()
    expect(store.getState().page.blocks[id].props.fontSize).toBe(64)
    expect(store.getState().page.blocks[id].props.mobileFontSize).toBeUndefined()
  })
})
