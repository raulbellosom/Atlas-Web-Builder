const size=(value,min,max,fallback)=>Number.isFinite(Number(value))&&Number(value)>=min&&Number(value)<=max?Number(value):fallback
const option=(label,options)=>({type:'select',label,options})
export const brandIdentityHref=value=>typeof value==='string'&&value.length<=2048&&/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value)&&!Array.from(value).some(c=>c.charCodeAt(0)<=32||c.charCodeAt(0)===127)?value:'/'
export const brandIdentityDefaults={brand:'Mi marca',logoSrc:'',logoAlt:'',logoHeight:'32',showBrandName:true,tagline:'',brandDirection:'row',brandGap:8,brandHref:'/'}
export const brandIdentityFields={
  brand:{type:'text',label:'Nombre de marca'},logoSrc:{type:'image',label:'Imagen del logo'},logoAlt:{type:'text',label:'Descripción del logo'},
  logoHeight:option('Alto del logo',['24','32','40','48','64']),showBrandName:{type:'toggle',label:'Mostrar nombre de marca'},
  tagline:{type:'text',label:'Texto adicional (opcional)'},brandDirection:option('Distribución de la marca',[{value:'row',label:'Logo al lado del texto'},{value:'column',label:'Logo encima del texto'}]),
  brandGap:{type:'number',label:'Separación entre logo y texto',min:0,max:64},brandHref:{type:'link',label:'Enlace de la marca'},
}

// Shared presentation for the basic element and navigation. Asset URLs are
// resolved by the host before rendering; text is always rendered as text.
export function BrandIdentity({brand,logoSrc,logoAlt,logoHeight,showBrandName=true,tagline,brandDirection='row',brandGap=8}) {
  const src=typeof logoSrc==='string'&&/^(https?:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp|gif);base64,)/i.test(logoSrc)?logoSrc:''
  const name=showBrandName!==false&&typeof brand==='string'?brand:''
  const detail=typeof tagline==='string'?tagline:''
  return <span className="atlas-brand-identity" style={{display:'inline-flex',alignItems:'center',flexDirection:brandDirection==='column'?'column':'row',gap:size(brandGap,0,64,8),minWidth:0,maxWidth:'100%'}}>
    {src&&<img className="atlas-brand-logo" src={src} alt={logoAlt||brand||'Logo'} style={{height:size(logoHeight,8,160,32),width:'auto',maxWidth:'100%',objectFit:'contain',flexShrink:0}}/>}
    {(name||detail)&&<span className="atlas-brand-copy" style={{display:'flex',flexDirection:'column',minWidth:0,lineHeight:1.2,textAlign:brandDirection==='column'?'center':undefined}}>
      {name&&<span className="atlas-brand-name" style={{overflowWrap:'anywhere'}}>{name}</span>}
      {detail&&<span className="atlas-brand-tagline" style={{fontSize:'.65em',fontWeight:400,opacity:.8,lineHeight:1.4,overflowWrap:'anywhere'}}>{detail}</span>}
    </span>}
  </span>
}
