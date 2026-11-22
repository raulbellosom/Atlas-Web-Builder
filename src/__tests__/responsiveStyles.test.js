import { describe, it, expect } from 'vitest'
import { resolveResponsive } from '../blocks/elements/responsive.js'
import { elementSurfaceStyle, elementOuterStyle } from '../blocks/elements/design.js'
import { BoxBlock, TextElementBlock } from '../blocks/elements/ElementBlocks.jsx'
import { createEditorStore } from '../editor/store/createEditorStore.js'
import { parsePage, serializePage } from '../persistence/serializePage.js'

describe('responsive styles use the existing portable property format', () => {
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
