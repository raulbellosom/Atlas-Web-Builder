// Only the affine part is needed for deltas. Using the transformed center also
// maps absolute pointer positions correctly through zoom and rotated ancestors.
export function elementCoordinateSpace(element) {
  const view=element.ownerDocument.defaultView
  let matrix=new view.DOMMatrix()
  for(let node=element;node;node=node.parentElement){
    const transform=view.getComputedStyle(node).transform
    if(transform!=='none')matrix=new view.DOMMatrix(transform).multiply(matrix)
  }
  if(!matrix.is2D||Math.abs(matrix.a*matrix.d-matrix.b*matrix.c)<.00001)return null
  const inverse=matrix.inverse(),rect=element.getBoundingClientRect()
  return {inverse,scale:Math.max(.01,Math.hypot(matrix.a,matrix.b)),scaleY:Math.max(.01,Math.hypot(matrix.c,matrix.d)),point(x,y){
    const dx=x-rect.left-rect.width/2,dy=y-rect.top-rect.height/2
    return {x:inverse.a*dx+inverse.c*dy+element.offsetWidth/2-element.clientLeft,
      y:inverse.b*dx+inverse.d*dy+element.offsetHeight/2-element.clientTop}
  }}
}
