# Media, loading performance and branding

## AtlasImage
`<AtlasImage>` (exported) is the single image primitive used by ImageBlock and the Hero image. It always sets
`decoding="async"`, defaults to `loading="lazy"`, reserves space (`width`/`height` or `aspectRatio`, or the asset
size) and paints `dominantColor` as placeholder. `priority` forces `loading="eager"` + `fetchpriority="high"`
(Hero image uses it; ImageBlock offers a "Prioritaria" loading option).

Responsive sources, in order of precedence:
1. `variants` / `asset.variants` (`[{width,url,format}]`): grouped by format into a `<picture>` (AVIF, then WebP,
   then the original format as the `<img srcset>`).
2. `imageUrlBuilder(src, {width, format})` (prop, or `imageUrlBuilder` on `AtlasWebBuilderProvider`) plus `widths`:
   builds the same `<picture>`. Default: no builder, plain `<img src>`.

Asset schema gains optional `variants`, `dominantColor`, `blurhash` (`width`/`height` already existed). ImageBlock
stores `variants`, `dominantColor`, `naturalWidth/Height` next to `src` when the image field has
`withAssetMeta`; any manual URL edit clears them so stale variants never outlive the source.

## Client-side optimization
`optimizeImageFile(file, {maxWidth, widths, format, quality})` resizes with `createImageBitmap` + canvas to
WebP variants and computes an average color. SVG/GIF (or no canvas support) return `{original, variants: []}`.
The AssetPicker calls it only when the host source implements `uploadVariants(file, optimized)`; otherwise the
upload flow is unchanged (`upload(file)`). If no variant is produced it falls back to `upload`.

## Lazy blocks
Opt-in: `defineBlock({ lazy: true, lazyMinHeight })` or per-instance `_lazy` / `_lazyMinHeight`. `LazyMount` renders
a min-height placeholder and mounts the body via IntersectionObserver (`rootMargin: 300px 0`). Never in `edit`
mode, never for the first `eagerBlocks` root blocks (default 2, prop of `AtlasWebRenderer`) nor their descendants,
and immediate render when IntersectionObserver is missing (SSR).

## Branding
`createBrandTheme({primary, accent, neutral, fontHeading, fontBody, radius, mood})` derives a full theme: readable
foregrounds by luminance contrast, tints, surface/border, shadow scale, radius from `mood` (sharp/balanced/soft).
Guard: `muted` is nudged to >= 4.5:1 on the background (`ensureContrast`). `FONT_PAIRS` are presets and
`fontLinks(theme)` returns the Google Fonts stylesheet href (or `null`); the host decides whether to load it.
The ThemeTab shows a "Marca" section (palette presets, three colors, font pair, mood) that replaces the theme.

## Not done
Blurhash decoding, AVIF generation in the browser (canvas AVIF encoding is not widely supported), server-side
transforms, background-image variants (`resolveBackground` is unchanged).
