import { useEffect, useState } from 'react'
import './playground.css'
import {
  AtlasWebBuilderEditor,
  baseBlocks,
  defineTemplate,
  defineTheme,
  defaultTheme,
  getVersion,
  serializePage,
  parsePage,
} from '@raulbellosom/atlas-web-builder'
/* CSS loaded automatically via the source alias in vite.config.js */

/* --------------------------------------------------------------------------
 * Landing de ejemplo construida sólo con bloques reales del motor (baseBlocks).
 * Marca ficticia, enlaces internos (#) e imágenes locales: sin servicios externos.
 * blk_heading, blk_nested y blk_image se mantienen para la verificación LAN.
 * ----------------------------------------------------------------------- */
const block = (id, type, props, children) => ({ id, type, props, ...(children ? { children } : {}) })
const section = (id, children, props = {}) => block(id, 'SectionBlock', { paddingY: '16', paddingX: '6', maxWidth: '1280px', ...props }, { children })

const initialPage = {
  schemaVersion: 1,
  id: 'page_home',
  slug: '/',
  title: 'Alba Studio — Landing de ejemplo',
  visibility: 'public',
  layoutId: null,
  regions: {
    main: {
      id: 'region_main',
      children: ['blk_nav', 'blk_hero', 'blk_stats', 'blk_services', 'blk_process', 'blk_voices', 'blk_plans', 'blk_cta', 'blk_footer'],
    },
  },
  blocks: {
    blk_nav: block('blk_nav', 'NavbarBlock', {
      variant: 'light', brand: 'Alba Studio', links: 'Servicios | #servicios\nProceso | #proceso\nPlanes | #planes\nContacto | #contacto',
      ctaLabel: 'Agenda una llamada', ctaHref: '#contacto', ctaVariant: 'solid', sticky: false,
    }),
    blk_hero: block('blk_hero', 'HeroBlock', {
      variant: 'image-bg', imageSrc: '/landing-hero.svg',
      eyebrow: 'Estudio de producto digital',
      title: 'Sitios que convierten visitas en clientes',
      subtitle: 'Estrategia, diseño y desarrollo en un solo equipo. Lanzamos tu nueva web en semanas, con contenido que puedes editar sin depender de nadie.',
      ctaLabel: 'Ver servicios', ctaHref: '#servicios', ctaVariant: 'solid',
      ctaSecondLabel: 'Conocer el proceso', ctaSecondHref: '#proceso',
      align: 'center', paddingY: '16', minHeight: '600px', titleSize: '3xl', contentMaxWidth: '768px',
    }),
    blk_stats: section('blk_stats', ['blk_stats_cols'], { paddingY: '12', background: { kind: 'color', value: '#f5f3ff' } }),
    blk_stats_cols: block('blk_stats_cols', 'ColumnsBlock', { count: '3', gap: '6', valign: 'center', stackOnMobile: true }, { col0: ['blk_stat_1'], col1: ['blk_stat_2'], col2: ['blk_stat_3'] }),
    blk_stat_1: block('blk_stat_1', 'CounterBlock', { value: 120, suffix: '+', label: 'Proyectos publicados', duration: 900, color: 'primary', size: '3xl' }),
    blk_stat_2: block('blk_stat_2', 'CounterBlock', { value: 98, suffix: '%', label: 'Clientes que repiten', duration: 900, color: 'primary', size: '3xl' }),
    blk_stat_3: block('blk_stat_3', 'CounterBlock', { value: 21, suffix: ' días', label: 'Lanzamiento promedio', duration: 900, color: 'primary', size: '3xl' }),
    blk_services: section('blk_services', ['blk_eyebrow', 'blk_heading', 'blk_text', 'blk_cards']),
    blk_eyebrow: block('blk_eyebrow', 'TextBlock', { text: 'SERVICIOS', size: 'sm', color: 'primary', align: 'center', weight: '700', letterSpacing: '0.08em' }),
    blk_heading: block('blk_heading', 'HeadingBlock', { text: 'Todo lo que tu marca necesita para crecer en línea', level: 'h2', size: '2xl', align: 'center', maxWidth: '768px', paddingY: '2' }),
    blk_text: block('blk_text', 'TextBlock', { text: 'Un proceso claro, entregables medibles y un sitio que tu equipo puede actualizar desde el primer día.', size: 'lg', color: 'muted', align: 'center', maxWidth: '640px', paddingY: '2' }),
    blk_cards: block('blk_cards', 'ColumnsBlock', { count: '3', gap: '6', valign: 'stretch', stackOnMobile: true, paddingY: '6' }, { col0: ['blk_card_1'], col1: ['blk_card_2'], col2: ['blk_card_3'] }),
    blk_card_1: block('blk_card_1', 'CardBlock', { imageSrc: '/card-strategy.svg', imageAlt: 'Gráfica de crecimiento', title: 'Estrategia', description: 'Investigamos a tu audiencia y definimos mensajes, estructura y métricas de éxito antes de diseñar.', ctaLabel: 'Saber más', ctaHref: '#proceso', shadow: 'sm', padding: '8' }),
    blk_card_2: block('blk_card_2', 'CardBlock', { imageSrc: '/card-design.svg', imageAlt: 'Boceto de interfaz', title: 'Diseño', description: 'Interfaces claras y accesibles, con un sistema visual coherente en escritorio, tableta y móvil.', ctaLabel: 'Ver planes', ctaHref: '#planes', shadow: 'sm', padding: '8' }),
    blk_card_3: block('blk_card_3', 'CardBlock', { imageSrc: '/card-build.svg', imageAlt: 'Editor de código', title: 'Desarrollo', description: 'Sitios rápidos, optimizados para buscadores y listos para medir conversiones desde el lanzamiento.', ctaLabel: 'Hablemos', ctaHref: '#contacto', shadow: 'sm', padding: '8' }),
    blk_process: section('blk_process', ['blk_process_cols'], { background: { kind: 'color', value: '#faf9ff' } }),
    blk_process_cols: block('blk_process_cols', 'ColumnsBlock', { count: '2', gap: '12', valign: 'center', stackOnMobile: true }, { col0: ['blk_image'], col1: ['blk_typewriter', 'blk_nested', 'blk_process_text', 'blk_button'] }),
    blk_image: block('blk_image', 'ImageBlock', { src: '/mobile-sample.svg', alt: 'Ilustración geométrica de montañas', caption: 'Imagen local, sin servicios externos', width: '100%', aspectRatio: '4 / 3', radius: 'lg', shadow: 'md' }),
    blk_typewriter: block('blk_typewriter', 'TypewriterBlock', { prefix: 'Creamos', phrases: 'sitios rápidos\nlandings que venden\nexperiencias claras', size: 'lg', color: 'primary', align: 'left' }),
    blk_nested: block('blk_nested', 'HeadingBlock', { text: 'Un proceso claro, de la idea al lanzamiento', level: 'h3', size: 'xl', _opacity: 0.92, customHistorical: { keep: true } }),
    blk_process_text: block('blk_process_text', 'TextBlock', { text: 'Descubrimiento, prototipo, contenido y lanzamiento en ciclos de una semana. Revisas cada avance y apruebas antes de publicar.', color: 'muted', lineHeight: '1.75', paddingY: '3' }),
    blk_button: block('blk_button', 'ButtonBlock', { label: 'Ver cómo trabajamos', href: '#proceso', variant: 'outline', radius: 'pill' }),
    blk_voices: section('blk_voices', ['blk_voices_title', 'blk_voices_grid']),
    blk_voices_title: block('blk_voices_title', 'HeadingBlock', { text: 'Lo que dicen nuestros clientes', level: 'h2', size: '2xl', align: 'center', paddingY: '4' }),
    blk_voices_grid: block('blk_voices_grid', 'ColumnsBlock', { count: '2', gap: '6', valign: 'stretch', stackOnMobile: true, paddingY: '4' }, { col0: ['blk_quote_1'], col1: ['blk_quote_2'] }),
    blk_quote_1: block('blk_quote_1', 'TestimonialBlock', { quote: 'En tres semanas teníamos un sitio nuevo y nuestro equipo ya publica contenido sin ayuda técnica.', author: 'Lucía R.', role: 'Directora de marketing (testimonio de ejemplo)', stars: '5', shadow: 'sm' }),
    blk_quote_2: block('blk_quote_2', 'TestimonialBlock', { quote: 'El proceso fue transparente de principio a fin. Cada decisión estaba respaldada por datos.', author: 'Diego M.', role: 'Fundador (testimonio de ejemplo)', stars: '5', shadow: 'sm' }),
    blk_plans: section('blk_plans', ['blk_plans_title', 'blk_plans_text', 'blk_plans_grid'], { background: { kind: 'color', value: '#f5f3ff' } }),
    blk_plans_title: block('blk_plans_title', 'HeadingBlock', { text: 'Planes simples, sin sorpresas', level: 'h2', size: '2xl', align: 'center', paddingY: '2' }),
    blk_plans_text: block('blk_plans_text', 'TextBlock', { text: 'Precios de ejemplo para probar el bloque de precios.', color: 'muted', align: 'center', paddingY: '2' }),
    blk_plans_grid: block('blk_plans_grid', 'ColumnsBlock', { count: '3', gap: '6', valign: 'stretch', stackOnMobile: true, paddingY: '6' }, { col0: ['blk_plan_1'], col1: ['blk_plan_2'], col2: ['blk_plan_3'] }),
    blk_plan_1: block('blk_plan_1', 'PricingBlock', { plan: 'Esencial', price: '990', currency: '$', period: '/ proyecto', description: 'Landing de una página para validar una idea.', features: 'Diseño a medida\nHasta 5 secciones\nFormulario de contacto', ctaLabel: 'Elegir Esencial', ctaHref: '#contacto', shadow: 'sm' }),
    blk_plan_2: block('blk_plan_2', 'PricingBlock', { plan: 'Crecimiento', price: '2,400', currency: '$', period: '/ proyecto', description: 'Sitio completo listo para captar clientes.', features: 'Hasta 8 páginas\nBlog y SEO técnico\nAnalítica de conversiones\nCapacitación del equipo', ctaLabel: 'Elegir Crecimiento', ctaHref: '#contacto', highlighted: true, badge: 'Más elegido', shadow: 'md' }),
    blk_plan_3: block('blk_plan_3', 'PricingBlock', { plan: 'Escala', price: '4,800', currency: '$', period: '/ proyecto', description: 'Para equipos con varias marcas o idiomas.', features: 'Páginas ilimitadas\nMultilenguaje\nSoporte prioritario', ctaLabel: 'Elegir Escala', ctaHref: '#contacto', shadow: 'sm' }),
    blk_cta: section('blk_cta', ['blk_cta_title', 'blk_cta_text', 'blk_cta_button'], { paddingY: '16', background: { kind: 'gradient', fromToken: 'primary', to: '#1e1b4b', angle: 135 } }),
    blk_cta_title: block('blk_cta_title', 'HeadingBlock', { text: '¿Listo para tu próximo lanzamiento?', level: 'h2', size: '2xl', align: 'center', color: 'primaryFg', paddingY: '2' }),
    blk_cta_text: block('blk_cta_text', 'TextBlock', { text: 'Cuéntanos tu proyecto y recibe una propuesta en 48 horas.', size: 'lg', align: 'center', color: 'primaryFg', paddingY: '3' }),
    blk_cta_button: block('blk_cta_button', 'ButtonBlock', { label: 'Agenda una llamada', href: '#contacto', variant: 'solid', color: 'accent', size: 'lg', radius: 'pill', align: 'center' }),
    blk_footer: block('blk_footer', 'FooterBlock', {
      variant: 'dark', brand: 'Alba Studio', tagline: 'Sitio de demostración de Atlas Web Builder.',
      columns: 'Estudio | Estudio\nServicios | #servicios\nProceso | #proceso\n---\nRecursos | Recursos\nPlanes | #planes\nContacto | #contacto',
      copyright: '© 2026 Alba Studio · Marca ficticia de ejemplo', showBrand: true,
    }),
  },
  seo: { title: 'Alba Studio — Landing de ejemplo', description: 'Página de demostración construida con los bloques de Atlas Web Builder.', canonical: null, ogImageAssetId: null },
  updatedAt: new Date().toISOString(),
}

const customTheme = defineTheme({
  ...defaultTheme,
  id: 'theme_playground',
  name: 'Playground',
  tokens: {
    ...defaultTheme.tokens,
    color: { ...defaultTheme.tokens.color, primary: '#5B3DF5', primaryFg: '#FFFFFF' },
    radius: { ...defaultTheme.tokens.radius, md: '12px' },
  },
})

const demoTemplates = [
  defineTemplate({
    id: 'hero-cta',
    label: 'Hero con CTA',
    description: 'Sección destacada con titular y botón.',
    category: 'landing',
    build() {
      return {
        rootIds: ['s'],
        blocks: {
          s: {
            id: 's',
            type: 'SectionBlock',
            props: { background: 'muted', paddingY: '12' },
            children: { children: ['h', 't', 'b'] },
          },
          h: {
            id: 'h',
            type: 'HeadingBlock',
            props: { text: 'Título destacado', level: 'h2', align: 'center' },
            children: {},
          },
          t: {
            id: 't',
            type: 'TextBlock',
            props: { text: 'Describe brevemente tu propuesta de valor.', align: 'center' },
            children: {},
          },
          b: {
            id: 'b',
            type: 'ButtonBlock',
            props: { label: 'Empezar', href: '#', variant: 'primary' },
            children: {},
          },
        },
      }
    },
  }),
  defineTemplate({
    id: 'two-columns',
    label: 'Dos columnas con texto',
    description: 'Layout sencillo de dos columnas con un titular en cada una.',
    category: 'layout',
    build() {
      return {
        rootIds: ['c'],
        blocks: {
          c: {
            id: 'c',
            type: 'ColumnsBlock',
            props: { columns: 2, gap: '6' },
            children: { col0: ['h1', 't1'], col1: ['h2', 't2'] },
          },
          h1: {
            id: 'h1',
            type: 'HeadingBlock',
            props: { text: 'Columna A', level: 'h3' },
            children: {},
          },
          t1: {
            id: 't1',
            type: 'TextBlock',
            props: { text: 'Texto de la columna A.' },
            children: {},
          },
          h2: {
            id: 'h2',
            type: 'HeadingBlock',
            props: { text: 'Columna B', level: 'h3' },
            children: {},
          },
          t2: {
            id: 't2',
            type: 'TextBlock',
            props: { text: 'Texto de la columna B.' },
            children: {},
          },
        },
      }
    },
  }),
]

const storageKey = 'atlas-playground-0.5.0-page'
const appearanceKey = 'atlas-playground-appearance'
const readAppearance = () => { try { return localStorage.getItem(appearanceKey) || 'system' } catch { return 'system' } }

/** Resolve "system" for the playground's own footer; the editor resolves it internally. */
function useResolvedDark(appearance) {
  const [query] = useState(() => typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null)
  const [systemDark, setSystemDark] = useState(() => !!query?.matches)
  useEffect(() => {
    if (!query) return
    const update = () => setSystemDark(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [query])
  return appearance === 'dark' || (appearance === 'system' && systemDark)
}

export default function App() {
  const [page, setPage] = useState(initialPage)
  const [session, setSession] = useState(0)
  const [appearance, setAppearance] = useState(readAppearance)
  const dark = useResolvedDark(appearance)
  const [status, setStatus] = useState('Prueba local: guarda y reabre antes de recargar.')
  function changeAppearance(next) {
    setAppearance(next)
    try { localStorage.setItem(appearanceKey, next) } catch { /* preference only */ }
  }
  function save(document) {
    try {
      localStorage.setItem(storageKey, serializePage(document))
      setStatus('Borrador guardado en este navegador. Pulsa Reabrir guardado.')
    } catch (error) { setStatus(`No se pudo guardar: ${error.message}`) }
  }
  function reopen() {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) { setStatus('No hay borrador guardado en este navegador.'); return }
      setPage(parsePage(saved))
      setSession(value => value + 1)
      setStatus('Borrador reabierto. El historial comienza una sesión nueva.')
    } catch (error) { setStatus(`No se pudo reabrir; el borrador se conserva: ${error.message}`) }
  }
  return (
    <div className="pg-shell" data-theme={dark ? 'dark' : 'light'}>
      <div className="pg-editor">
        <AtlasWebBuilderEditor
          key={session}
          blocks={baseBlocks}
          templates={demoTemplates}
          theme={customTheme}
          initialPage={page}
          appearance={appearance}
          onAppearanceChange={changeAppearance}
          brandLogo={<img src="/atlas-logo-64.png" alt="" height={28} width={28} style={{ display: 'block', objectFit: 'contain' }} />}
          brandName="Atlas"
          onSaveDraft={save}
        />
      </div>
      {/* Test bench, not package UI: own styles, labelled as such, follows the chosen appearance. */}
      <footer className="pg-bench" aria-label="Banco de pruebas del playground">
        <span className="pg-bench__tag">Playground</span>
        <button type="button" className="pg-bench__button" onClick={reopen}>Reabrir guardado</button>
        <span className="pg-bench__status" role="status" aria-label="Estado del playground">{status}</span>
        <small className="pg-bench__meta">Atlas v{getVersion()} · Prueba local · Sin publicación</small>
      </footer>
    </div>
  )
}
