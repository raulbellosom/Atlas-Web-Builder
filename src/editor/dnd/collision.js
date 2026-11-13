import { closestCenter, pointerWithin, rectIntersection } from '@dnd-kit/core'

/** Prefer the deepest hit under the finger; intersections also handle keyboard
 * movement between differently sized, scaled blocks without selecting the origin. */
export function editorCollisionDetection(args) {
  const pointer = pointerWithin(args)
  if (pointer.length) {
    const area = id => {
      const rect = args.droppableRects.get(id)
      return rect ? rect.width * rect.height : Infinity
    }
    return pointer.sort((a, b) => area(a.id) - area(b.id))
  }
  const intersections = rectIntersection(args)
  return intersections.length ? intersections : closestCenter(args)
}
