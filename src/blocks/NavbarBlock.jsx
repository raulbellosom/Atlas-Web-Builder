import { useEffect, useId, useRef, useState } from 'react'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar, fontSizeVar } from './_tokens.js'
import {BrandIdentity,brandIdentityFields,brandIdentityHref} from './elements/BrandIdentity.jsx'

const VARIANTS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'primary', label: 'Primario' },
  { value: 'transparent', label: 'Transparente' },
]

const BREAKPOINTS = ['640px', '768px', '1024px']

function isSafeHref(u) {
  return typeof u === 'string' && u !== '' && /^(https?:|mailto:|tel:|\/|#)/i.test(u)
}

function parseLinks(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return []
  const lines = raw.split('\n').filter((l) => l.trimEnd() !== '')
  const result = []

  for (const line of lines) {
    // Lines starting with a tab OR 2+ spaces are child items of the previous parent
    const isChild = /^(\t| {2})/.test(line)
    const trimmed = line.trim()
    const sep = trimmed.lastIndexOf('|')
    const item =
      sep === -1
        ? { label: trimmed, href: '#', children: [] }
        : {
            label: trimmed.slice(0, sep).trim(),
            href: trimmed.slice(sep + 1).trim() || '#',
            children: [],
          }

    if (isChild && result.length > 0) {
      result[result.length - 1].children.push({ label: item.label, href: item.href })
    } else {
      result.push(item)
    }
  }
  return result
}

/**
 * Navbar — barra de navegación superior con logo, enlaces y CTA opcional.
 * Los enlaces se definen como "Etiqueta | /ruta" separados por líneas.
 */
export const NavbarBlock = defineBlock({
  type: 'NavbarBlock',
  label: 'Navbar',
  category: 'navigation',
  icon: 'navbar',
  defaultProps: {
    variant: 'light',
    brand: 'Mi sitio',
    logoSrc: '',
    logoHeight: '32',
    links: 'Inicio | /\nProductos | /productos\nNosotros | /nosotros\nContacto | /contacto',
    ctaLabel: 'Empezar',
    ctaHref: '#',
    ctaVariant: 'solid',
    height: '64',
    maxWidth: '1280px',
    paddingX: '24px',
    sticky: false,
    showBrandName: true,
    logoAlt: '',tagline:'',brandDirection:'row',brandGap:8,brandHref:'/',
    mobileBreakpoint: '768px',
    submenuTrigger: 'hover',
    submenuAlignment: 'start',
    mobileCollapse: 'responsive',
    mobileMenuStyle: 'dropdown',
    menuAnimation: 'fade',
  },
  fields: {
    ...brandIdentityFields,
    submenuTrigger: { type: 'select', label: 'Abrir submenús', options: [{value:'hover',label:'Al pasar o enfocar'},{value:'click',label:'Con un clic'}] },
    submenuAlignment: { type: 'select', label: 'Alinear submenús', options: [{value:'start',label:'Al inicio'},{value:'end',label:'Al final'}] },
    mobileCollapse: { type: 'select', label: 'Colapsar navegación', options: [{value:'responsive',label:'Según el ancho'},{value:'always',label:'Siempre'},{value:'never',label:'Nunca'}] },
    mobileMenuStyle: { type: 'select', label: 'Presentación del menú móvil', options: [{value:'dropdown',label:'Desplegable'},{value:'drawer',label:'Panel lateral'},{value:'fullscreen',label:'Pantalla completa'}] },
    menuAnimation: { type: 'select', label: 'Transición de submenús', options: [{value:'none',label:'Sin transición'},{value:'fade',label:'Desvanecer'},{value:'slide',label:'Deslizar'}] },
    variant: { type: 'select', label: 'Estilo', options: VARIANTS },
    brand: { type: 'text', label: 'Nombre de marca' },
    logoSrc: { type: 'image', label: 'Logo (opcional)' },
    logoHeight: {
      type: 'select',
      label: 'Alto del logo',
      options: [
        { value: '24', label: '24px' },
        { value: '32', label: '32px' },
        { value: '40', label: '40px' },
        { value: '48', label: '48px' },
        { value: '64', label: '64px' },
      ],
    },
    showBrandName: { type: 'toggle', label: 'Mostrar nombre de marca' },
    links: {
      type: 'textarea',
      label: 'Enlace | /ruta (uno por línea)\nSub-ítem: comience con 2 espacios o tabulación',
    },
    ctaLabel: { type: 'text', label: 'Botón CTA' },
    ctaHref: { type: 'link', label: 'Enlace CTA' },
    ctaVariant: {
      type: 'select',
      label: 'Estilo del CTA',
      options: [
        { value: 'solid', label: 'Sólido' },
        { value: 'outline', label: 'Contorno' },
        { value: 'ghost', label: 'Fantasma' },
      ],
    },
    height: {
      type: 'select',
      label: 'Altura del navbar',
      options: [
        { value: '48', label: '48px (compacto)' },
        { value: '56', label: '56px' },
        { value: '64', label: '64px (normal)' },
        { value: '80', label: '80px (grande)' },
      ],
    },
    maxWidth: {
      type: 'select',
      label: 'Ancho máximo contenido',
      options: [
        { value: '960px', label: '960px' },
        { value: '1024px', label: '1024px' },
        { value: '1280px', label: '1280px (default)' },
        { value: '1440px', label: '1440px' },
        { value: '100%', label: 'Ancho completo' },
      ],
    },
    paddingX: {
      type: 'select',
      label: 'Padding horizontal',
      options: [
        { value: '12px', label: '12px' },
        { value: '16px', label: '16px' },
        { value: '24px', label: '24px (default)' },
        { value: '40px', label: '40px' },
      ],
    },
    sticky: { type: 'toggle', label: 'Pegajoso (sticky)' },
    mobileBreakpoint: {
      type: 'select',
      label: 'Menú móvil por debajo de',
      options: [
        { value: '640px', label: '640px' },
        { value: '768px', label: '768px (default)' },
        { value: '1024px', label: '1024px' },
      ],
    },
  },
  groups: [
    { label: 'Comportamiento', fields: ['submenuTrigger','submenuAlignment','mobileCollapse','mobileMenuStyle','menuAnimation'] },
    { label: 'Marca', fields: Object.keys(brandIdentityFields) },
    { label: 'Navegación', fields: ['links', 'ctaLabel', 'ctaHref', 'ctaVariant'] },
    { label: 'Estilo', fields: ['variant', 'sticky', 'height', 'maxWidth', 'paddingX', 'mobileBreakpoint'] },
  ],
  render: (props) => <NavbarView {...props} />,
})

function NavbarView({
    variant,
    brand,
    logoSrc,
    logoHeight,
    showBrandName,
    logoAlt,tagline,brandDirection,brandGap,brandHref='/',
    links,
    ctaLabel,
    ctaHref,
    ctaVariant,
    height,
    maxWidth,
    paddingX,
    sticky,
    mobileBreakpoint,
    submenuTrigger = 'hover', submenuAlignment = 'start', mobileCollapse = 'responsive', mobileMenuStyle = 'dropdown', menuAnimation = 'fade',
  }) {
    const bp = BREAKPOINTS.includes(mobileBreakpoint) ? mobileBreakpoint : '768px'
    const [open, setOpen] = useState(false)
    const [activeSubmenu, setActiveSubmenu] = useState(null)
    function submenuKey(event,index) {
      if (event.key === 'Escape' && activeSubmenu === index) {
        event.preventDefault(); event.stopPropagation(); setActiveSubmenu(null)
        event.currentTarget.ownerDocument.getElementById(`${menuId}-toggle-${index}`)?.focus()
      } else if (event.key === 'ArrowDown' && event.currentTarget.tagName === 'BUTTON') {
        event.preventDefault(); setActiveSubmenu(index)
        const owner=event.currentTarget.ownerDocument
        requestAnimationFrame(() => owner.getElementById(`${menuId}-submenu-${index}`)?.querySelector('a')?.focus())
      }
    }
    const menuId = useId()
    const btnRef = useRef(null)
    const menuRef = useRef(null)
    const wasOpen = useRef(false)

    // Move focus into the menu on open and back to the button when it closes.
    useEffect(() => {
      if (open) menuRef.current?.querySelector('a')?.focus()
      else if (wasOpen.current) btnRef.current?.focus()
      wasOpen.current = open
    }, [open])

    useEffect(() => {
      if (!open) return undefined
      const onKey = (e) => {
        if (e.key === 'Escape') setOpen(false)
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }, [open])

    const parsedLinks = parseLinks(links)
    const safeCta = isSafeHref(ctaHref) ? ctaHref : '#'
    const navH = Number(height) || 64

    const isDark = variant === 'dark' || variant === 'primary'
    const bg =
      variant === 'light'
        ? 'white'
        : variant === 'dark'
          ? '#0B0B0F'
          : variant === 'primary'
            ? colorVar('primary', '#0F62FE')
            : 'transparent'
    const fg = isDark ? 'rgba(255,255,255,0.92)' : colorVar('fg', '#0B0B0F')
    const fgMuted = isDark ? 'rgba(255,255,255,0.65)' : colorVar('muted', '#6B7280')
    const dropdownBg = isDark ? '#1a1a2e' : '#ffffff'
    const dropdownFg = isDark ? 'rgba(255,255,255,0.85)' : colorVar('fg', '#0B0B0F')
    const border =
      variant === 'transparent'
        ? 'transparent'
        : isDark
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.06)'

    const ctaBgColor =
      ctaVariant === 'solid'
        ? variant === 'primary'
          ? 'rgba(255,255,255,0.15)'
          : colorVar('primary', '#0F62FE')
        : 'transparent'
    const ctaFgColor = ctaVariant === 'solid' ? 'white' : colorVar('primary', '#0F62FE')
    const ctaBorder =
      ctaVariant === 'outline' ? `1px solid ${colorVar('primary', '#0F62FE')}` : 'none'

    return (
      <nav
        className={`atlas-nb-nav atlas-nb-bp-${parseInt(bp, 10)}`}
        data-open={open ? 'true' : 'false'}
        data-submenu-trigger={submenuTrigger === 'click' ? 'click' : 'hover'}
        data-submenu-align={submenuAlignment === 'end' ? 'end' : 'start'}
        data-collapse={['always','never'].includes(mobileCollapse) ? mobileCollapse : 'responsive'}
        data-menu-style={['drawer','fullscreen'].includes(mobileMenuStyle) ? mobileMenuStyle : 'dropdown'}
        data-menu-animation={['none','slide'].includes(menuAnimation) ? menuAnimation : 'fade'}
        style={{
          background: bg,
          borderBottom: `1px solid ${border}`,
          position: sticky ? 'sticky' : undefined,
          top: sticky ? 0 : undefined,
          zIndex: sticky ? 100 : undefined,
          backdropFilter: variant === 'transparent' ? 'blur(12px)' : undefined,
          '--atlas-nav-height': `${navH}px`,
        }}
        aria-label="Navegación principal"
      >
        <div
          style={{
            maxWidth: maxWidth || '1280px',
            marginInline: 'auto',
            padding: `0 ${paddingX || '24px'}`,
            height: navH,
            display: 'flex',
            alignItems: 'center',
            gap: 32,
          }}
        >
          {/* Brand */}
          <a
            href={brandIdentityHref(brandHref)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              flexShrink: 0,
              fontFamily:'var(--atlas-font-sans)',fontWeight:800,fontSize:fontSizeVar('lg'),color:fg,
            }}
          >
            <BrandIdentity {...{brand,logoSrc,logoAlt,logoHeight,showBrandName,tagline,brandDirection,brandGap}}/>
          </a>

          {/* Nav links with optional dropdown support */}
          {parsedLinks.length > 0 ? (
            <ul className="atlas-nb-list atlas-nb-desktop" style={{ flex: 1 }}>
              {parsedLinks.map((link, i) => {
                const safeHref = isSafeHref(link.href) ? link.href : '#'
                const hasChildren = link.children && link.children.length > 0

                return (
                  <li
                    key={i}
                    className={`atlas-nb-item${hasChildren ? ' atlas-nb-item--parent' : ''}`}
                    data-submenu-open={activeSubmenu === i ? 'true' : 'false'}
                    onMouseEnter={() => { if (submenuTrigger !== 'click' && hasChildren) setActiveSubmenu(i) }}
                    onMouseLeave={event => { if (submenuTrigger !== 'click' && !event.currentTarget.contains(event.currentTarget.ownerDocument.activeElement)) setActiveSubmenu(null) }}
                    onFocus={event => { if (submenuTrigger !== 'click' && hasChildren && event.target === event.currentTarget.querySelector('.atlas-nb-link')) setActiveSubmenu(i) }}
                    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveSubmenu(null) }}
                  >
                    <a
                      href={safeHref}
                      className="atlas-nb-link"
                      style={{
                        color: fgMuted,
                        textDecoration: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontFamily: 'var(--atlas-font-sans)',
                        fontSize: fontSizeVar('sm'),
                        fontWeight: 500,
                        display: 'block',
                      }}
                    >
                      {link.label}
                    </a>

                    {hasChildren && (
                      <button type="button" id={`${menuId}-toggle-${i}`} className="atlas-nb-submenu-toggle" aria-label={`Submenú de ${link.label}`}
                        aria-expanded={activeSubmenu === i} aria-controls={`${menuId}-submenu-${i}`}
                        style={{color:fgMuted}} onClick={() => setActiveSubmenu(activeSubmenu === i ? null : i)}
                        onKeyDown={event => submenuKey(event,i)}>⌄</button>
                    )}
                    {hasChildren && (
                      <ul
                        id={`${menuId}-submenu-${i}`}
                        className="atlas-nb-dropdown atlas-nb-dropdown-list"
                        style={{ background: dropdownBg, color: dropdownFg }}
                      >
                        {link.children.map((child, j) => (
                          <li key={j} className="atlas-nb-dropdown-item">
                            <a
                              href={isSafeHref(child.href) ? child.href : '#'}
                              className="atlas-nb-dropdown-link"
                              onKeyDown={event => submenuKey(event,i)}
                            >
                              {child.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="atlas-nb-desktop" style={{ flex: 1 }} />
          )}

          {/* CTA button */}
          {ctaLabel ? (
            <a
              href={safeCta}
              className="atlas-nb-desktop"
              style={{
                background: ctaBgColor,
                color: ctaFgColor,
                border: ctaBorder,
                padding: '8px 18px',
                borderRadius: 8,
                fontFamily: 'var(--atlas-font-sans)',
                fontSize: fontSizeVar('sm'),
                fontWeight: 700,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              {ctaLabel}
            </a>
          ) : null}

          <button
            ref={btnRef}
            type="button"
            className="atlas-nb-burger"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((v) => !v)}
            style={{ color: fg }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        <div
          id={menuId}
          ref={menuRef}
          className="atlas-nb-menu"
          data-open={open ? 'true' : 'false'}
          style={{ background: bg === 'transparent' ? dropdownBg : bg, borderBottom: `1px solid ${border}`, top: navH }}
        >
          <ul className="atlas-nb-menu-list">
            {parsedLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={isSafeHref(link.href) ? link.href : '#'}
                  className="atlas-nb-menu-link"
                  style={{ color: fg }}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
                {link.children.map((child, j) => (
                  <a
                    key={j}
                    href={isSafeHref(child.href) ? child.href : '#'}
                    className="atlas-nb-menu-link atlas-nb-menu-link--child"
                    style={{ color: fgMuted }}
                    onClick={() => setOpen(false)}
                  >
                    {child.label}
                  </a>
                ))}
              </li>
            ))}
          </ul>
          {ctaLabel ? (
            <a
              href={safeCta}
              className="atlas-nb-menu-cta"
              onClick={() => setOpen(false)}
              style={{ background: ctaBgColor, color: ctaFgColor, border: ctaBorder }}
            >
              {ctaLabel}
            </a>
          ) : null}
        </div>
      </nav>
    )
}
