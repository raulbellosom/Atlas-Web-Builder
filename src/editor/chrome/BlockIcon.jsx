import {
  AlignLeft, BadgeDollarSign, Box, Columns2, FileText, FormInput, Hash, Heading, Image, LayoutGrid, List,
  Menu, Minus, MousePointerClick, MoveVertical, Package, PanelBottom, PanelTop, Quote, Receipt, Rows3,
  ShoppingCart, SquareDashed, SquareStack, Type, Video,
} from 'lucide-react'

/** Palette and inspector block icons (editor UI only; never rendered in published sites). */
const ICONS = {
  hero: PanelTop,
  section: Rows3,
  container: SquareDashed,
  columns: Columns2,
  grid: LayoutGrid,
  heading: Heading,
  text: AlignLeft,
  type: Type,
  richtext: FileText,
  image: Image,
  button: MousePointerClick,
  spacer: MoveVertical,
  divider: Minus,
  card: SquareStack,
  testimonial: Quote,
  pricing: BadgeDollarSign,
  navbar: Menu,
  footer: PanelBottom,
  video: Video,
  form: FormInput,
  list: List,
  hash: Hash,
  cart: ShoppingCart,
  product: Package,
  receipt: Receipt,
}

const CATEGORY_ICONS = {
  navigation: Menu,
  hero: PanelTop,
  layout: Rows3,
  content: AlignLeft,
  media: Image,
}

/**
 * Resolve the icon for a block definition. Priority:
 * 1. def.icon key in ICONS map
 * 2. def.category key in CATEGORY_ICONS map
 * 3. Generic block icon
 */
export function blockIconFor(def) {
  const Icon = (def?.icon && ICONS[def.icon]) || (def?.category && CATEGORY_ICONS[def.category]) || Box
  return <Icon aria-hidden="true" />
}

/** Icon wrapper for the palette and inspector header. */
export function BlockIcon({ def, size = 20 }) {
  return (
    <span aria-hidden="true" className="atlas-wb-block-icon" style={{ '--awb-icon-size': `${size}px` }}>
      {blockIconFor(def)}
    </span>
  )
}
