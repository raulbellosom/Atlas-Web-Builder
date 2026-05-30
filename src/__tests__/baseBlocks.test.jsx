import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  baseBlocks,
  baseBlockCategories,
  HeroBlock,
  HeadingBlock,
  ButtonBlock,
  ImageBlock,
} from '../blocks/index.js'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'

function makePage(blocks) {
  const dict = {}
  const children = []
  for (const b of blocks) {
    dict[b.id] = b
    children.push(b.id)
  }
  return {
    schemaVersion: 1,
    id: 'page_t',
    slug: '/',
    title: 't',
    visibility: 'public',
    layoutId: null,
    regions: { main: { id: 'region_main', children } },
    blocks: dict,
    seo: {},
    updatedAt: '',
  }
}

describe('baseBlocks', () => {
  it('exposes the base block definitions in the expected order', () => {
    expect(baseBlocks).toHaveLength(18)
    expect(baseBlocks.map((b) => b.type)).toEqual([
      'NavbarBlock',
      'FooterBlock',
      'HeroBlock',
      'SectionBlock',
      'ContainerBlock',
      'ColumnsBlock',
      'GridBlock',
      'HeadingBlock',
      'TextBlock',
      'RichTextBlock',
      'CardBlock',
      'TestimonialBlock',
      'PricingBlock',
      'ImageBlock',
      'VideoBlock',
      'ButtonBlock',
      'SpacerBlock',
      'DividerBlock',
    ])
  })

  it('every block has type, label, category, render and defaultProps', () => {
    for (const b of baseBlocks) {
      expect(typeof b.type).toBe('string')
      expect(typeof b.label).toBe('string')
      expect(typeof b.category).toBe('string')
      expect(typeof b.render).toBe('function')
      expect(typeof b.defaultProps).toBe('object')
    }
  })

  it('every block category is documented', () => {
    for (const b of baseBlocks) {
      expect(baseBlockCategories[b.category]).toBeDefined()
    }
  })

  it('every block renders with its defaultProps without throwing', () => {
    const page = makePage(
      baseBlocks.map((b, i) => ({
        id: `blk_${i}`,
        type: b.type,
        props: {},
        children: {},
      })),
    )
    const { container } = render(
      <AtlasWebBuilderProvider blocks={baseBlocks}>
        <AtlasWebRenderer page={page} mode="public" />
      </AtlasWebBuilderProvider>,
    )
    expect(container.querySelector('[data-atlas-page]')).toBeTruthy()
  })

  it('HeadingBlock respects the level prop', () => {
    const page = makePage([
      {
        id: 'h',
        type: 'HeadingBlock',
        props: { text: 'Hola', level: 'h3' },
        children: {},
      },
    ])
    const { container } = render(
      <AtlasWebBuilderProvider blocks={[HeadingBlock]}>
        <AtlasWebRenderer page={page} mode="public" />
      </AtlasWebBuilderProvider>,
    )
    expect(container.querySelector('h3')).toBeTruthy()
    expect(container.querySelector('h3')?.textContent).toBe('Hola')
  })

  it('ImageBlock rejects unsafe URLs and renders a placeholder', () => {
    const page = makePage([
      {
        id: 'i',
        type: 'ImageBlock',
        props: { src: 'javascript:alert(1)', alt: 'x' },
        children: {},
      },
    ])
    const { container, queryByRole } = render(
      <AtlasWebBuilderProvider blocks={[ImageBlock]}>
        <AtlasWebRenderer page={page} mode="public" />
      </AtlasWebBuilderProvider>,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(queryByRole('img', { hidden: true })).toBeNull()
  })

  it('ButtonBlock falls back to "#" on unsafe href', () => {
    const page = makePage([
      {
        id: 'b',
        type: 'ButtonBlock',
        props: { label: 'Click', href: 'javascript:bad()' },
        children: {},
      },
    ])
    const { container } = render(
      <AtlasWebBuilderProvider blocks={[ButtonBlock]}>
        <AtlasWebRenderer page={page} mode="public" />
      </AtlasWebBuilderProvider>,
    )
    const a = container.querySelector('a')
    expect(a).toBeTruthy()
    expect(a?.getAttribute('href')).toBe('#')
  })

  it('HeroBlock renders the split variant', () => {
    const page = makePage([
      {
        id: 'hero',
        type: 'HeroBlock',
        props: { variant: 'split', title: 'T', ctaLabel: 'Ir', ctaHref: '/x' },
        children: {},
      },
    ])
    const { container, getByText } = render(
      <AtlasWebBuilderProvider blocks={[HeroBlock]}>
        <AtlasWebRenderer page={page} mode="public" />
      </AtlasWebBuilderProvider>,
    )
    expect(getByText('T')).toBeTruthy()
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/x')
  })
})
