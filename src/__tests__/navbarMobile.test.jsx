import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { NavbarBlock } from '../blocks/index.js'

const Nav = (props) => NavbarBlock.render({ ...NavbarBlock.defaultProps, ...props })

describe('NavbarBlock mobile menu', () => {
  it('opens click submenus with their own disclosure button and closes with Escape', () => {
    const { container } = render(<Nav submenuTrigger="click" links={'Servicios | /servicios\n  Consulta | /consulta'} mobileCollapse="always" mobileMenuStyle="drawer" />)
    const button = screen.getByRole('button', { name: 'Submenú de Servicios' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    fireEvent.mouseEnter(button.closest('li'))
    expect(button.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    const dropdown = document.getElementById(button.getAttribute('aria-controls'))
    expect(dropdown.textContent).toContain('Consulta')
    fireEvent.keyDown(dropdown.querySelector('a'), { key: 'Escape' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button)
    expect(container.querySelector('nav').dataset.collapse).toBe('always')
    expect(container.querySelector('nav').dataset.menuStyle).toBe('drawer')
  })
  it('toggles aria-expanded and links the button to the menu', () => {
    const { container } = render(<Nav />)
    const btn = screen.getByRole('button', { name: 'Abrir menú' })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    const menu = container.querySelector('.atlas-nb-menu')
    expect(btn.getAttribute('aria-controls')).toBe(menu.id)
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(menu.dataset.open).toBe('true')
    expect(menu.contains(document.activeElement)).toBe(true)
  })

  it('closes on Escape and returns focus to the button', () => {
    render(<Nav />)
    const btn = screen.getByRole('button', { name: 'Abrir menú' })
    fireEvent.click(btn)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(btn)
  })

  it('closes when a menu link is clicked', () => {
    const { container } = render(<Nav />)
    const btn = screen.getByRole('button', { name: 'Abrir menú' })
    fireEvent.click(btn)
    fireEvent.click(container.querySelector('.atlas-nb-menu-link'))
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('includes the CTA in the menu and honours the breakpoint', () => {
    const { container } = render(<Nav mobileBreakpoint="1024px" />)
    expect(container.querySelector('.atlas-nb-menu-cta').textContent).toBe('Empezar')
    expect(container.querySelector('nav').className).toContain('atlas-nb-bp-1024')
  })

  it('server-renders without throwing for every variant', () => {
    for (const variant of ['light', 'dark', 'primary', 'transparent']) {
      const html = renderToString(<Nav variant={variant} sticky />)
      expect(html).toContain('atlas-nb-menu')
      expect(html).toContain('atlas-nb-list')
    }
  })
})
