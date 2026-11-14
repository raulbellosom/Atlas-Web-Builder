import { useState } from 'react'
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
 * Fase 4 — La biblioteca base ya vive dentro del paquete. El playground sólo
 * la importa y la pasa al editor; no se redefinen bloques aquí.
 * ----------------------------------------------------------------------- */

const initialPage = {
  schemaVersion: 1,
  id: 'page_home',
  slug: '/',
  title: 'Inicio',
  visibility: 'public',
  layoutId: null,
  regions: {
    main: {
      id: 'region_main',
      children: ['blk_hero', 'blk_heading', 'blk_text', 'blk_button', 'blk_section'],
    },
  },
  blocks: {
    blk_hero: {
      id: 'blk_hero',
      type: 'HeroBlock',
      props: {
        variant: 'centered',
        eyebrow: 'Atlas',
        title: 'Componedor de sitios para Atlas ERP',
        subtitle:
          'Una biblioteca React controlada, sin dependencias pesadas y con tipografía + color basados en tokens.',
        ctaLabel: 'Empezar',
        ctaHref: '#',
      },
      children: {},
    },
    blk_heading: {
      id: 'blk_heading',
      type: 'HeadingBlock',
      props: { text: 'Bloques base', level: 'h2', align: 'center' },
      children: {},
    },
    blk_text: {
      id: 'blk_text',
      type: 'TextBlock',
      props: {
        text: 'Arrastra desde la paleta para añadir más secciones, columnas, imágenes y botones.',
        align: 'center',
      },
      children: {},
    },
    blk_button: {
      id: 'blk_button',
      type: 'ButtonBlock',
      props: { label: 'Ver documentación', href: '#', variant: 'outline' },
      children: {},
    },
    blk_section: {
      id: 'blk_section',
      type: 'SectionBlock',
      props: { background: 'muted', paddingY: '8' },
      children: { children: ['blk_nested', 'blk_image'] },
    },
    blk_nested: {
      id: 'blk_nested', type: 'HeadingBlock',
      props: { text: 'Prueba táctil anidada', level: 'h3', _opacity: 0.85, customHistorical: { keep: true } },
    },
    blk_image: {
      id: 'blk_image', type: 'ImageBlock',
      props: { src: '/mobile-sample.svg', alt: 'Paisaje de prueba local', caption: 'Imagen local, sin servicios externos', width: '100%' },
    },
  },
  seo: { title: '', description: '', canonical: null, ogImageAssetId: null },
  updatedAt: new Date().toISOString(),
}

const customTheme = defineTheme({
  ...defaultTheme,
  id: 'theme_playground',
  name: 'Playground',
  tokens: {
    ...defaultTheme.tokens,
    color: { ...defaultTheme.tokens.color, primary: '#6D28D9', primaryFg: '#FFFFFF' },
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
export default function App() {
  const [page, setPage] = useState(initialPage)
  const [session, setSession] = useState(0)
  const [status, setStatus] = useState('Prueba local: guarda y reabre antes de recargar.')
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
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <AtlasWebBuilderEditor
          key={session}
          blocks={baseBlocks}
          templates={demoTemplates}
          theme={customTheme}
          initialPage={page}
          brandLogo={
            <img
              src="/logo.png"
              alt="Atlas WB"
              height={26}
              width={26}
              style={{ display: 'block', objectFit: 'contain' }}
            />
          }
          brandName="Atlas WB"
          onSaveDraft={save}
        />
      </div>
      <div
        style={{
          padding: '4px 12px max(4px, env(safe-area-inset-bottom))',
          fontSize: 12,
          color: '#6b7280',
          borderTop: '1px solid #e5e7eb',
          background: '#fafafa',
        }}
      >
        <button type="button" onClick={reopen} style={{ minHeight: 44 }}>Reabrir guardado</button>
        <span role="status" aria-label="Estado del playground" style={{ marginInlineStart: 8 }}>{status}</span>
        <small style={{ display: 'block' }}>Atlas v{getVersion()} · Prueba local · Sin publicación</small>
      </div>
    </div>
  )
}
