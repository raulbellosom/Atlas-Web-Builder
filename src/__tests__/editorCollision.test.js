import { describe, expect, it } from 'vitest'
import { editorCollisionDetection } from '../editor/dnd/collision.js'

const rect = (top, height, width = 306) => ({ top, bottom: top + height, left: 42, right: 42 + width, width, height })
function fixture(pointerCoordinates) {
  return { active: { id: 'heading' }, collisionRect: rect(274.07, 30.75), pointerCoordinates,
    droppableContainers: ['heading', 'paragraph', 'section'].map(id => ({ id })),
    droppableRects: new Map([['heading', rect(247.05, 27.02)], ['paragraph', rect(274.07, 90.09)], ['section', rect(202, 330, 366)]]) }
}
describe('nested, scaled editor drop targets', () => {
  it('keyboard movement intersects the next taller sibling rather than the shorter origin', () => {
    expect(editorCollisionDetection(fixture(null))[0].id).toBe('paragraph')
  })
  it('touch/mouse hits prefer the leaf block over its enclosing section', () => {
    expect(editorCollisionDetection(fixture({ x: 90, y: 320 }))[0].id).toBe('paragraph')
  })
})
