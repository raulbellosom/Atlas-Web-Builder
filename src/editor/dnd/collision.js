import { closestCenter, pointerWithin, rectIntersection } from '@dnd-kit/core'
import {findParent} from '../../utils/tree.js'

export function pointerDropTarget(scope,point,page) {
  const elements=scope.ownerDocument.elementsFromPoint(point.x,point.y)
  for(const element of elements){
    if(!scope.contains(element))continue
    const target=element.closest('[data-parent][data-slot], [data-region], [data-block-id]')
    if(!target||!scope.contains(target))continue
    if(target.dataset.parent&&target.dataset.slot)return {parentId:target.dataset.parent,slotName:target.dataset.slot}
    if(target.dataset.region)return {regionName:target.dataset.region}
    const block=page.blocks[target.dataset.blockId]
    if(block?.type==='BoxBlock')return {parentId:block.id,slotName:'children'}
    const location=findParent(page,target.dataset.blockId)
    if(location)return location.kind==='slot'?{parentId:location.parentBlockId,slotName:location.slotName,index:location.index}:{regionName:location.regionName,index:location.index}
  }
  return null
}

/** Prefer the deepest hit under the finger; intersections also handle keyboard
 * movement between differently sized, scaled blocks without selecting the origin. */
export function editorCollisionDetection(args) {
  const pointer = pointerWithin(args)
  if (pointer.length) {
    const nodes = new Map(args.droppableContainers.map(container => [container.id,container.node?.current]))
    const depths = new Map(pointer.map(hit => {
      let node=nodes.get(hit.id), depth=0
      while (node?.parentElement) { depth += 1; node=node.parentElement }
      return [hit.id,depth]
    }))
    const area = id => {
      const rect = args.droppableRects.get(id)
      return rect ? rect.width * rect.height : Infinity
    }
    return pointer.sort((a, b) => {
      // A slot and its enclosing editable block can have identical bounds.
      // Depth gives a stable priority even when an absolute child exceeds its parent.
      return depths.get(b.id) - depths.get(a.id) || area(a.id) - area(b.id)
    })
  }
  const intersections = rectIntersection(args)
  return intersections.length ? intersections : closestCenter(args)
}
