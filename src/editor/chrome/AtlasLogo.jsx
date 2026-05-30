/**
 * Atlas WB logotype — inline SVG, no external file dependency.
 * Matches the WB monogram: cobalt-blue letterforms + cyan downward-triangle accent.
 */
export function AtlasLogo({ size = 28, className, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Atlas WB"
      className={className}
      style={style}
    >
      {/* ── W ── thick strokes, royal blue */}
      <path
        d="M1.5 2 L7.5 22 L13.5 8.5 L19.5 22 L25.5 2"
        stroke="#1B35CC"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Cyan downward-pointing triangle between the two inner W peaks ── */}
      <path
        d="M11 2 L16 2 L13.5 7.5 Z"
        fill="#29D4FA"
      />

      {/* ── B vertical bar ── */}
      <path
        d="M27.5 2 L27.5 22"
        stroke="#1B35CC"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* ── B top bump ── */}
      <path
        d="M27.5 2 C35 2 35 12.5 27.5 12.5"
        stroke="#1B35CC"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── B bottom bump (slightly wider than top) ── */}
      <path
        d="M27.5 12.5 C37 12.5 37 22 27.5 22"
        stroke="#1B35CC"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
