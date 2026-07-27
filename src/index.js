/**
 * @raulbellosom/atlas-web-builder
 *
 * Phase 3 public API: provider, registry, theme, renderer, editor chrome.
 */

// CSS side-effect import so Vite emits `dist/style.css` for the
// `@raulbellosom/atlas-web-builder/styles` sub-path export.
import './styles/editor.css'

/** Package version. Kept in lockstep with package.json. */
export const version = '0.2.2'

/**
 * @returns {string}
 */
export function getVersion() {
  return version
}

// Provider
export { AtlasWebBuilderProvider } from './provider/AtlasWebBuilderProvider.jsx'
export { BuilderContext, useBuilder } from './provider/BuilderContext.js'

// Registry
export { defineBlock, createBlockRegistry } from './registry/createBlockRegistry.js'

// Theme
export { ThemeProvider, useTheme, useThemeTokens } from './theme/ThemeProvider.jsx'
export { defaultTheme, defineTheme } from './theme/defaultTheme.js'
export { applyThemeVars } from './theme/applyThemeVars.js'

// Renderer
export { AtlasWebRenderer } from './renderer/AtlasWebRenderer.jsx'
export { BlockRenderer } from './renderer/BlockRenderer.jsx'
export { SafeRichText } from './renderer/SafeRichText.jsx'
export { ResourceBoundary } from './renderer/ResourceBoundary.jsx'

// Schema
export { migrateContent, CURRENT_SCHEMA_VERSION } from './schema/migrate.js'

// Persistence (Phase 6)
export {
  serializePage,
  parsePage,
  validatePage,
  garbageCollect,
  regenerateIds,
  listUnknownBlockTypes,
  PageValidationError,
} from './persistence/serializePage.js'

// Templates (Phase 6)
export { defineTemplate, createTemplateRegistry } from './templates/defineTemplate.js'
export { applyTemplate } from './templates/applyTemplate.js'

// Layouts (Phase 8A)
export { defineLayout, createLayoutRegistry, applyLayoutToDraft } from './layouts/defineLayout.js'

// Assets (Phase 8B)
export { createInMemoryAssetSource } from './assets/createAssetSource.js'
export { AssetPicker } from './editor/assets/AssetPicker.jsx'

// Inline editing + backgrounds (Phase 8D)
export { InlineText, createInlineTextHelper } from './editor/inline/InlineText.jsx'
export { resolveBackground, resolveBackgroundCss } from './blocks/_background.js'
export { BackgroundField } from './editor/fields/BackgroundField.jsx'
export { AnimationField } from './editor/fields/AnimationField.jsx'
export { FilterField, resolveFilter } from './editor/fields/FilterField.jsx'
export { HoverField } from './editor/fields/HoverField.jsx'
export { TransformField } from './editor/fields/TransformField.jsx'
export { EffectsWrapper, resolveAnimation, resolveTransform } from './renderer/EffectsWrapper.jsx'

// Notifications (Phase 7)
export {
  NotificationsProvider,
  useNotifications,
} from './editor/notifications/NotificationsProvider.jsx'
export { NotificationCenter } from './editor/notifications/NotificationCenter.jsx'

// Editor (Phase 3)
export { AtlasWebBuilderEditor } from './editor/AtlasWebBuilderEditor.jsx'
export {
  EditorStoreProvider,
  useEditorStore,
  useEditorStoreInstance,
  useTemporal,
} from './editor/store/EditorStoreProvider.jsx'
export { createEditorStore, DEVICE_WIDTHS } from './editor/store/createEditorStore.js'
export { defaultFields, defineField } from './editor/fields/index.js'

// Base block library (Phase 4+)
export {
  baseBlocks,
  baseBlockCategories,
  SectionBlock,
  ContainerBlock,
  HeadingBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  SpacerBlock,
  DividerBlock,
  ColumnsBlock,
  GridBlock,
  HeroBlock,
  RichTextBlock,
  CardBlock,
  TestimonialBlock,
  PricingBlock,
  NavbarBlock,
  FooterBlock,
  VideoBlock,
} from './blocks/index.js'
