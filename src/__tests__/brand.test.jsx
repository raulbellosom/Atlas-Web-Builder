import {describe,it,expect} from 'vitest'
import {render,screen,cleanup} from '@testing-library/react'
import {LogoElementBlock} from '../blocks/elements/ElementBlocks.jsx'
import {NavbarBlock} from '../blocks/NavbarBlock.jsx'
import {FooterBlock} from '../blocks/FooterBlock.jsx'
import {BrandIdentity,brandIdentityHref} from '../blocks/elements/BrandIdentity.jsx'

describe('brand identity',()=>{
  it('supports a footer logo without a name, preserves the tagline and hides the whole brand when requested',()=>{
    const props={...FooterBlock.defaultProps,brand:'Marca',logoSrc:'/logo.png',showBrandName:false,tagline:'Pie adicional',brandHref:'/inicio'}
    render(FooterBlock.render(props))
    expect(screen.getByRole('img',{name:'Marca'}).closest('a')).toHaveAttribute('href','/inicio')
    expect(screen.queryByText('Marca')).toBeNull();expect(screen.getByText('Pie adicional')).toBeInTheDocument();cleanup()
    render(FooterBlock.render({...props,showBrand:false}))
    expect(screen.queryByRole('img')).toBeNull();expect(screen.queryByText('Pie adicional')).toBeNull();cleanup()
    render(FooterBlock.render({...FooterBlock.defaultProps,brand:'Histórica'}))
    expect(screen.getByText('Histórica')).toBeInTheDocument();expect(screen.queryByRole('img')).toBeNull();cleanup()
  })
  it('supports logo only, name only and logo with optional additional text',()=>{
    render(<BrandIdentity brand="Marca" logoSrc="/logo.png" showBrandName={false}/>)
    expect(screen.getByRole('img',{name:'Marca'})).toBeInTheDocument();expect(screen.queryByText('Marca')).toBeNull();cleanup()
    render(<BrandIdentity brand="Marca" tagline="Texto adicional"/>)
    expect(screen.queryByRole('img')).toBeNull();expect(screen.getByText('Texto adicional')).toBeInTheDocument();cleanup()
    render(LogoElementBlock.render({...LogoElementBlock.defaultProps,brand:'Marca',logoSrc:'/logo.png',tagline:'Texto adicional',brandHref:'/inicio',ctx:{mode:'public'}}))
    expect(screen.getByRole('link')).toHaveAttribute('href','/inicio');expect(screen.getByRole('img')).toHaveStyle({objectFit:'contain',height:'32px'});expect(screen.getByText('Marca')).toBeInTheDocument();cleanup()
  })
  it('uses the same identity inside the navbar, preserves legacy text-only navigation and safely handles links and image sources',()=>{
    render(NavbarBlock.render({...NavbarBlock.defaultProps,brand:'Marca',logoSrc:'/logo.png',tagline:'Texto adicional',brandHref:'/inicio'}))
    expect(screen.getByRole('img',{name:'Marca'}).closest('a')).toHaveAttribute('href','/inicio');expect(screen.getByText('Texto adicional')).toBeInTheDocument();cleanup()
    render(NavbarBlock.render({...NavbarBlock.defaultProps,brand:'Histórica'}))
    expect(screen.getByText('Histórica')).toBeInTheDocument();expect(screen.queryByRole('img')).toBeNull();cleanup()
    render(<BrandIdentity brand="<script>" logoSrc="javascript:alert(1)" logoHeight={Infinity}/>)
    expect(screen.queryByRole('img')).toBeNull();expect(screen.getByText('<script>')).toBeInTheDocument();cleanup()
    for(const href of ['javascript:alert(1)','//example.test','/ bad','data:text/html,x'])expect(brandIdentityHref(href)).toBe('/')
  })
})
