import { defineBlock } from '../registry/createBlockRegistry.js'
import { SafeRichText } from '../renderer/SafeRichText.jsx'
import { colorVar, fontSizeVar, COLOR_TOKENS, FONT_SIZE_TOKENS } from './_tokens.js'

/**
 * RichText — sanitized HTML content. Authors edit raw HTML in Phase 4; a
 * WYSIWYG editor lands in Phase 11. Output is always passed through
 * DOMPurify with the renderer's narrow allowlist.
 */
export const RichTextBlock = defineBlock({
  type: 'RichTextBlock',
  icon: 'richtext',
  label: 'Texto enriquecido',
  category: 'content',
  defaultProps: {
    html: '<p>Texto enriquecido con <strong>énfasis</strong>.</p>',
    size: 'md',
    color: 'fg',
  },
  fields: {
    html: { type: 'rich-text', label: 'Contenido HTML' },
    size: { type: 'select', label: 'Tamaño', options: FONT_SIZE_TOKENS },
    color: { type: 'select', label: 'Color', options: COLOR_TOKENS },
  },
  render: ({ html, size, color }) => (
    <div
      style={{
        color: colorVar(color, 'inherit'),
        fontFamily: 'var(--atlas-font-sans)',
        fontSize: fontSizeVar(size),
        lineHeight: 1.6,
      }}
    >
      <SafeRichText html={html} />
    </div>
  ),
})
