import {
  AtlasWebBuilderEditor,
  baseBlocks,
  defineTemplate,
  defineTheme,
  defaultTheme,
  getVersion,
} from '@racoondevs/atlas-web-builder'
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
      children: { children: [] },
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

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <AtlasWebBuilderEditor
          blocks={baseBlocks}
          templates={demoTemplates}
          theme={customTheme}
          initialPage={initialPage}
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
          onSaveDraft={(page) => {
            // eslint-disable-next-line no-console
            console.log('Guardar borrador →', page)
          }}
          onPublish={(page) => {
            // eslint-disable-next-line no-console
            console.log('Publicar →', page)
          }}
        />
      </div>
      <div
        style={{
          padding: '4px 12px',
          fontSize: 12,
          color: '#6b7280',
          borderTop: '1px solid #e5e7eb',
          background: '#fafafa',
        }}
      >
        Atlas WB v{getVersion()} · @racoondevs/atlas-web-builder
      </div>
    </div>
  )
}
