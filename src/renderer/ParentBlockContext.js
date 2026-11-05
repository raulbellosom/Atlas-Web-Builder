import { createContext } from 'react'

/**
 * The block whose slot is being rendered, as `{ id, type }`, or `null` for a
 * block placed directly in a page region. Exposed to blocks as `ctx.parent`
 * and `ctx.nested` so a block can render differently inside another block.
 */
export const ParentBlockContext = createContext(null)
