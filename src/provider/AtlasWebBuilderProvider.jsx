import { useMemo } from 'react'
import { BuilderContext } from './BuilderContext.js'
import { ThemeProvider } from '../theme/ThemeProvider.jsx'
import { createBlockRegistry } from '../registry/createBlockRegistry.js'
import { createTemplateRegistry } from '../templates/defineTemplate.js'
import { createLayoutRegistry } from '../layouts/defineLayout.js'
import { defaultTheme } from '../theme/defaultTheme.js'

/**
 * Root provider for the Atlas Web Builder. Wires the block registry, theme,
 * and host-supplied resources/actions/permissions into context so both the
 * editor (later phases) and the renderer can read them.
 *
 * Either pass a pre-built registry via `blockRegistry` or an array of block
 * definitions via `blocks`. If both are provided, `blockRegistry` wins.
 *
 * @param {{
 *   blockRegistry?: ReturnType<typeof createBlockRegistry>,
 *   blocks?: import('../registry/createBlockRegistry.js').BlockDefinition[],
 *   templates?: import('../templates/defineTemplate.js').TemplateDefinition[],
 *   layouts?: import('../layouts/defineLayout.js').LayoutDefinition[],
 *   assets?: import('../assets/createAssetSource.js').AssetSource,
 *   theme?: import('../schema/theme.js').Theme,
 *   resources?: Object<string, Object>,
 *   mockResources?: Object<string, Object>,
 *   actions?: Object<string, Function>,
 *   permissions?: (action: string, ctx?: any) => boolean | Promise<boolean>,
 *   children: React.ReactNode,
 * }} props
 */
export function AtlasWebBuilderProvider({
  blockRegistry,
  blocks = [],
  templates,
  layouts,
  assets,
  theme = defaultTheme,
  resources,
  mockResources,
  actions,
  permissions,
  children,
}) {
  const registry = useMemo(
    () => blockRegistry || createBlockRegistry(blocks),
    [blockRegistry, blocks],
  )

  const templateRegistry = useMemo(() => createTemplateRegistry(templates || []), [templates])
  const layoutRegistry = useMemo(() => createLayoutRegistry(layouts || []), [layouts])

  const value = useMemo(
    () => ({
      blocks: registry,
      templates: templateRegistry,
      layouts: layoutRegistry,
      assets: assets || null,
      resources,
      mockResources,
      actions,
      permissions,
    }),
    [
      registry,
      templateRegistry,
      layoutRegistry,
      assets,
      resources,
      mockResources,
      actions,
      permissions,
    ],
  )

  return (
    <BuilderContext.Provider value={value}>
      {/* display:contents makes this div layout-transparent so the editor's
          height:100% can resolve against the host's bounded container.
          CSS custom properties still inherit through display:contents. */}
      <ThemeProvider theme={theme} style={{ display: 'contents' }}>{children}</ThemeProvider>
    </BuilderContext.Provider>
  )
}
