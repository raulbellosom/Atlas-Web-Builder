/**
 * Palette block icons — simple 20×20 SVGs that give each block type
 * an instantly recognisable visual identity in the palette.
 */

const ICONS = {
  hero: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="7" width="12" height="2" rx="1" fill="currentColor" opacity=".8" />
      <rect x="6" y="10.5" width="8" height="1.5" rx=".75" fill="currentColor" opacity=".5" />
      <rect x="7" y="13" width="6" height="1.5" rx=".75" fill="currentColor" opacity=".35" />
    </svg>
  ),
  section: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="1" width="18" height="5" rx="2" fill="currentColor" opacity=".15" />
      <rect x="4" y="8.5" width="12" height="1.5" rx=".75" fill="currentColor" opacity=".6" />
      <rect x="4" y="11" width="8" height="1.5" rx=".75" fill="currentColor" opacity=".4" />
    </svg>
  ),
  container: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
      <rect x="6" y="7" width="8" height="1.5" rx=".75" fill="currentColor" opacity=".5" />
      <rect x="6" y="10" width="5" height="1.5" rx=".75" fill="currentColor" opacity=".35" />
    </svg>
  ),
  columns: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="7.5" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="3" width="7.5" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="6" width="4" height="1.5" rx=".75" fill="currentColor" opacity=".5" />
      <rect x="13.5" y="6" width="4" height="1.5" rx=".75" fill="currentColor" opacity=".5" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="1" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="11.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  heading: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4v12M3 10h14M17 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="16" height="1.5" rx=".75" fill="currentColor" />
      <rect x="2" y="7.5" width="16" height="1.5" rx=".75" fill="currentColor" opacity=".7" />
      <rect x="2" y="11" width="12" height="1.5" rx=".75" fill="currentColor" opacity=".7" />
      <rect x="2" y="14.5" width="14" height="1.5" rx=".75" fill="currentColor" opacity=".5" />
    </svg>
  ),
  richtext: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="7" height="1.5" rx=".75" fill="currentColor" />
      <rect x="2" y="7" width="16" height="1.5" rx=".75" fill="currentColor" opacity=".6" />
      <rect x="2" y="10" width="16" height="1.5" rx=".75" fill="currentColor" opacity=".6" />
      <rect x="2" y="13" width="10" height="1.5" rx=".75" fill="currentColor" opacity=".6" />
      <rect x="2" y="16" width="4" height="1.5" rx=".75" fill="currentColor" opacity=".35" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="3" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="8" r="1.5" fill="currentColor" opacity=".6" />
      <path d="M1.5 14l5-5 3.5 3.5 3-3 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  button: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="14" height="8" rx="4" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="9.25" width="8" height="1.5" rx=".75" fill="currentColor" opacity=".8" />
    </svg>
  ),
  spacer: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
      <path d="M5 3h10M5 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  divider: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="2" width="16" height="6" rx="3" fill="currentColor" opacity=".2" />
      <rect x="4" y="10.5" width="8" height="1.5" rx=".75" fill="currentColor" opacity=".7" />
      <rect x="4" y="13" width="5" height="1.5" rx=".75" fill="currentColor" opacity=".45" />
    </svg>
  ),
  testimonial: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H8l-4 3V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="6" y="7" width="8" height="1.5" rx=".75" fill="currentColor" opacity=".6" />
      <rect x="6" y="9.5" width="5" height="1.5" rx=".75" fill="currentColor" opacity=".4" />
    </svg>
  ),
  pricing: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="14" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5" y="5.5" width="10" height="2" rx="1" fill="currentColor" opacity=".6" />
      <rect x="6" y="9" width="8" height="1.5" rx=".75" fill="currentColor" opacity=".35" />
      <rect x="6" y="11.5" width="6" height="1.5" rx=".75" fill="currentColor" opacity=".35" />
      <rect x="5" y="14.5" width="10" height="1.5" rx=".75" fill="currentColor" opacity=".7" />
    </svg>
  ),
  navbar: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="4" width="18" height="12" rx="2" fill="currentColor" opacity=".05" />
      <rect x="3" y="7.5" width="4" height="1.5" rx=".75" fill="currentColor" opacity=".8" />
      <rect x="9" y="7.5" width="2.5" height="1.5" rx=".75" fill="currentColor" opacity=".4" />
      <rect x="12.5" y="7.5" width="2.5" height="1.5" rx=".75" fill="currentColor" opacity=".4" />
      <rect x="14" y="11" width="4" height="2" rx="1" fill="currentColor" opacity=".6" />
    </svg>
  ),
  footer: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="7" width="3.5" height="1.5" rx=".75" fill="currentColor" opacity=".7" />
      <rect x="3" y="9.5" width="3.5" height="1" rx=".5" fill="currentColor" opacity=".4" />
      <rect x="3" y="11" width="3.5" height="1" rx=".5" fill="currentColor" opacity=".4" />
      <rect x="9" y="7" width="3.5" height="1.5" rx=".75" fill="currentColor" opacity=".7" />
      <rect x="9" y="9.5" width="3.5" height="1" rx=".5" fill="currentColor" opacity=".4" />
      <rect x="13.5" y="7" width="3.5" height="1.5" rx=".75" fill="currentColor" opacity=".7" />
      <rect x="1" y="14.5" width="18" height="1" rx=".5" fill="currentColor" opacity=".25" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 8l5-2.5v9L14 12V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7" cy="10" r="2" fill="currentColor" opacity=".5" />
    </svg>
  ),
}

const CATEGORY_ICONS = {
  navigation: ICONS.navbar,
  hero: ICONS.hero,
  layout: ICONS.section,
  content: ICONS.text,
  media: ICONS.image,
}

/**
 * Resolve the icon for a block definition. Priority:
 * 1. def.icon key in ICONS map
 * 2. def.category key in CATEGORY_ICONS map
 * 3. Generic block icon
 */
export function blockIconFor(def) {
  if (def && def.icon && ICONS[def.icon]) return ICONS[def.icon]
  if (def && def.category && CATEGORY_ICONS[def.category]) return CATEGORY_ICONS[def.category]
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5" y="8" width="10" height="1.5" rx=".75" fill="currentColor" opacity=".6" />
      <rect x="5" y="10.5" width="7" height="1.5" rx=".75" fill="currentColor" opacity=".4" />
    </svg>
  )
}

/** Inline SVG icon wrapper for the palette. */
export function BlockIcon({ def, size = 20 }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.75 }}
    >
      {blockIconFor(def)}
    </span>
  )
}
