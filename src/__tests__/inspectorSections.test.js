import { describe, it, expect } from 'vitest'
import { baseBlocks } from '../blocks/index.js'
import { partitionGroups } from '../editor/chrome/propertyGroups.js'

// Inspector sections are keyed by label and remember being collapsed. A field that is not listed in any declared group is appended to a
// category section (often "Contenido"): on blocks that did not have one it creates a stray section, and selecting another block then
// shows that label collapsed. These checks keep every block's first section its own first declared group.
const entriesOf = (def) => Object.entries(def.fields ?? {}).filter(([, spec]) => !spec.responsiveBase && !spec.internalResponsive)
const labelOf = (label) => (label === 'Disposición' ? 'Layout' : label)

describe('inspector sections', () => {
  const elements = baseBlocks.filter((block) => block.kind === 'element' && block.groups?.length)

  it('the first section of every element is its first declared group', () => {
    for (const def of elements) {
      const sections = partitionGroups(entriesOf(def), def.groups)
      expect(sections[0]?.label, def.type).toBe(labelOf(def.groups[0].label))
    }
  })

  it('fields added by Motion/Responsive Pro are always inside a declared group', () => {
    const phase3 = /focal|fluid|fontSize(Min|Max)|kenburns|pressed/i
    for (const def of elements) {
      const listed = new Set(def.groups.flatMap((group) => group.fields ?? []))
      const unlisted = entriesOf(def).map(([key]) => key).filter((key) => phase3.test(key) && !listed.has(key))
      expect(unlisted, `${def.type} leaves Phase 3 fields outside its groups`).toEqual([])
    }
  })

  it('the focal point only exists on image elements, grouped with the image fields', () => {
    for (const def of baseBlocks.filter((block) => block.kind === 'element')) {
      const hasFocal = Object.keys(def.fields).some((key) => /focal/i.test(key))
      expect(hasFocal, def.type).toBe(def.type === 'ImageElementBlock')
    }
    const image = baseBlocks.find((block) => block.type === 'ImageElementBlock')
    expect(image.groups[0].fields).toEqual(expect.arrayContaining(['focalX', 'focalY', 'tabletFocalX', 'mobileFocalY']))
  })
})
