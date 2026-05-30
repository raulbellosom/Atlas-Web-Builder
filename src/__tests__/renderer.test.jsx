import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AtlasWebBuilderProvider } from '../provider/AtlasWebBuilderProvider.jsx'
import { AtlasWebRenderer } from '../renderer/AtlasWebRenderer.jsx'
import { defineBlock } from '../registry/createBlockRegistry.js'

const HeroDef = defineBlock({
  type: 'HeroBlock',
  label: 'Hero',
  defaultProps: { title: 'Predeterminado' },
  render: ({ title, ctx }) => (
    <h1 data-testid="hero" data-mode={ctx.mode}>
      {title}
    </h1>
  ),
})

/** @type {import('../schema/page.js').Page} */
const page = {
  schemaVersion: 1,
  id: 'page_home',
  slug: '/',
  title: 'Inicio',
  visibility: 'public',
  layoutId: null,
  regions: {
    main: { id: 'region_main', children: ['blk_hero_1', 'blk_unknown_1'] },
  },
  blocks: {
    blk_hero_1: {
      id: 'blk_hero_1',
      type: 'HeroBlock',
      props: { title: 'Hola Atlas' },
      children: {},
    },
    blk_unknown_1: {
      id: 'blk_unknown_1',
      type: 'NotRegisteredBlock',
      props: {},
      children: {},
    },
  },
}

describe('AtlasWebRenderer', () => {
  it('renders a registered block with its props and mode in context', () => {
    render(
      <AtlasWebBuilderProvider blocks={[HeroDef]}>
        <AtlasWebRenderer page={page} mode="public" />
      </AtlasWebBuilderProvider>,
    )
    const h1 = screen.getByTestId('hero')
    expect(h1.textContent).toBe('Hola Atlas')
    expect(h1.dataset.mode).toBe('public')
  })

  it('rejects unregistered block types via the allowlist', () => {
    render(
      <AtlasWebBuilderProvider blocks={[HeroDef]}>
        <AtlasWebRenderer page={page} />
      </AtlasWebBuilderProvider>,
    )
    // The fallback alert mentions the rejected type.
    const fallback = screen.getByRole('alert')
    expect(fallback.textContent).toMatch(/NotRegisteredBlock/)
    expect(fallback.dataset.atlasFallback).toBe('true')
  })

  it('emits a region wrapper with data attributes', () => {
    const { container } = render(
      <AtlasWebBuilderProvider blocks={[HeroDef]}>
        <AtlasWebRenderer page={page} />
      </AtlasWebBuilderProvider>,
    )
    const region = container.querySelector('[data-atlas-region="main"]')
    expect(region).not.toBeNull()
    expect(region.getAttribute('data-atlas-region-id')).toBe('region_main')
  })

  it('injects theme CSS variables on the provider wrapper', () => {
    const { container } = render(
      <AtlasWebBuilderProvider blocks={[HeroDef]}>
        <AtlasWebRenderer page={page} />
      </AtlasWebBuilderProvider>,
    )
    const themed = container.querySelector('[data-atlas-theme]')
    expect(themed).not.toBeNull()
    expect(themed.style.getPropertyValue('--atlas-color-primary')).toBe('#0F62FE')
  })
})
