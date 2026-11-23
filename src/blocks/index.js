/**
 * @file Base block library shipped with `@racoondevs/atlas-web-builder`.
 *
 * All blocks are theme-token driven (no hard-coded colors or spacing) and
 * have safe defaults so they render correctly without configuration.
 *
 * Usage:
 *   import { baseBlocks } from '@racoondevs/atlas-web-builder'
 *   <AtlasWebBuilderEditor blocks={baseBlocks} />
 */
import { SectionBlock } from './SectionBlock.jsx'
import { ContainerBlock } from './ContainerBlock.jsx'
import { HeadingBlock } from './HeadingBlock.jsx'
import { TextBlock } from './TextBlock.jsx'
import { ImageBlock } from './ImageBlock.jsx'
import { ButtonBlock } from './ButtonBlock.jsx'
import { SpacerBlock } from './SpacerBlock.jsx'
import { DividerBlock } from './DividerBlock.jsx'
import { ColumnsBlock } from './ColumnsBlock.jsx'
import { GridBlock } from './GridBlock.jsx'
import { HeroBlock } from './HeroBlock.jsx'
import { RichTextBlock } from './RichTextBlock.jsx'
import { CardBlock } from './CardBlock.jsx'
import { TestimonialBlock } from './TestimonialBlock.jsx'
import { PricingBlock } from './PricingBlock.jsx'
import { NavbarBlock } from './NavbarBlock.jsx'
import { FooterBlock } from './FooterBlock.jsx'
import { VideoBlock } from './VideoBlock.jsx'
import { AudioBlock } from './AudioBlock.jsx'
import { CounterBlock } from './CounterBlock.jsx'
import { TypewriterBlock } from './TypewriterBlock.jsx'
import { elementBlocks } from './elements/ElementBlocks.jsx'
export { AccordionBlock, AccordionItemBlock } from './elements/AccordionBlocks.jsx'
export { elementBlocks, BoxBlock, TextElementBlock, ButtonElementBlock, LinkElementBlock, ImageElementBlock, LogoElementBlock } from './elements/ElementBlocks.jsx'
export { IconElementBlock } from './elements/IconElement.jsx'
export { elementStylePresets } from './elements/design.js'

export {
  SectionBlock,
  ContainerBlock,
  HeadingBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  SpacerBlock,
  DividerBlock,
  ColumnsBlock,
  GridBlock,
  HeroBlock,
  RichTextBlock,
  CardBlock,
  TestimonialBlock,
  PricingBlock,
  NavbarBlock,
  FooterBlock,
  VideoBlock,
  AudioBlock,
  CounterBlock,
  TypewriterBlock,
}

/**
 * The full set of base blocks, ordered for a sensible palette. Hosts can
 * spread this and append their own blocks:
 *
 *   <AtlasWebBuilderEditor blocks={[...baseBlocks, MyCustomBlock]} />
 *
 * @type {import('../registry/createBlockRegistry.js').BlockDefinition[]}
 */
export const baseBlocks = [
  ...elementBlocks,
  // Navigation
  NavbarBlock,
  FooterBlock,
  // Hero / Sections
  HeroBlock,
  SectionBlock,
  ContainerBlock,
  // Layout
  ColumnsBlock,
  GridBlock,
  // Content
  HeadingBlock,
  TextBlock,
  RichTextBlock,
  CardBlock,
  TestimonialBlock,
  PricingBlock,
  // Media
  ImageBlock,
  VideoBlock,
  AudioBlock,
  ButtonBlock,
  SpacerBlock,
  DividerBlock,
  CounterBlock,
  TypewriterBlock,
]

/**
 * Spanish labels for each category surfaced by the base library.
 */
export const baseBlockCategories = {
  elements: 'Elementos de diseño',
  navigation: 'Navegación',
  hero: 'Hero',
  layout: 'Diseño',
  content: 'Contenido',
  media: 'Multimedia',
}

// Data-driven blocks (opt-in: hosts add them next to baseBlocks and supply `resources`).
import { FormBlock } from './FormBlock.jsx'
import { ProductGridBlock } from './ProductGridBlock.jsx'
import { ProductDetailBlock } from './ProductDetailBlock.jsx'
import { CategoryListBlock } from './CategoryListBlock.jsx'
import { AddToCartButtonBlock } from './AddToCartButtonBlock.jsx'
import { CartBlock } from './CartBlock.jsx'
import { CheckoutSummaryBlock } from './CheckoutSummaryBlock.jsx'

export {
  FormBlock,
  ProductGridBlock,
  ProductDetailBlock,
  CategoryListBlock,
  AddToCartButtonBlock,
  CartBlock,
  CheckoutSummaryBlock,
}

/** @type {import('../registry/createBlockRegistry.js').BlockDefinition[]} */
export const formBlocks = [FormBlock]

/** @type {import('../registry/createBlockRegistry.js').BlockDefinition[]} */
export const commerceBlocks = [
  ProductGridBlock,
  ProductDetailBlock,
  CategoryListBlock,
  AddToCartButtonBlock,
  CartBlock,
  CheckoutSummaryBlock,
]

export { BrandIdentity, brandIdentityFields, brandIdentityDefaults, brandIdentityHref } from './elements/BrandIdentity.jsx'
