# SEO per page with social preview

## Goal
First-class SEO: richer `page.seo`, pure helpers to build/serialize head metadata, a page analyzer and an editor panel with Google and social previews.

## Schema (no version bump)
`PageSeo` only gains optional fields, so `CURRENT_SCHEMA_VERSION` stays 1 and old documents keep working (`ogImageAssetId` is still honored through an optional `resolveAsset(id)` callback).

```
title, description, canonical,
robots: { index, follow }   (a string like "noindex,nofollow" is also accepted)
ogTitle, ogDescription, ogImage (url string | { url, assetId? }), ogImageAssetId (legacy),
ogType (website|article|product|profile), twitterCard (summary|summary_large_image),
keywords (string | string[]),
structuredData: [{ type: Organization|LocalBusiness|WebSite|Article|Product|FAQPage|BreadcrumbList, ...simple fields }]
```
Site defaults live in `site.settings.defaultSeo` (same shape); `site.name` feeds `og:site_name`, `site.locale` feeds `og:locale`. Private pages are always noindex.

## Modules (`src/seo/`)
- `content.js`: walks regions/blocks in order and collects headings (HeadingBlock, HeroBlock title as H1, headings inside RichText html), images and the first text. `resolveSeo` applies the fallback chain page -> site default -> page content.
- `jsonld.js`: whitelisted presets built from simple fields (never raw JSON); `serializeJsonLd` escapes `<`, `>`, `&`, U+2028/9.
- `buildSeoMeta(page, site, { baseUrl, resolveAsset })` -> `{ title, meta, link, jsonLd }`. Title clamped to 60, description to 160, URLs made absolute (http/https only).
- `analyzeSeo(page, site)` -> `[{ level, code, message }]` (Spanish messages).
- `renderSeoHead(page, site, opts)` -> HTML string with every text and attribute escaped.

## Editor
`src/editor/seo/SeoPanel.jsx` replaces the inline SEO section of the Page tab (small edit in `RightPanel.jsx`): fields with live counters, Google preview, Facebook/Twitter card preview, structured-data editor and the analyzer checklist. The OG image is a URL field (an asset picker is left for later).

## Heading semantics
HeroBlock renders its title as the single H1 (both variants); HeadingBlock defaults to H2 and exposes `level`. No block change is needed. A page with a Hero plus a HeadingBlock set to H1 gets the "several H1" warning, which is the intended signal.
