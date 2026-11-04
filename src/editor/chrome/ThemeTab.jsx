import { useEditorStore } from '../store/EditorStoreProvider.jsx'
import { useState } from 'react'
import { es } from '../i18n/es.js'
import { brandEs, BRAND_PRESETS } from '../i18n/brand.es.js'
import { createBrandTheme, FONT_PAIRS, contrastRatio, readableOn } from '../../theme/brand.js'

/**
 * Detect which control to render for a token value. Hex colors get a
 * `<input type="color">` companion; everything else falls back to text.
 */
function isHexColor(v) {
  return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)
}

function TokenRow({ category, name, value, onChange }) {
  const color = isHexColor(value)
  return (
    <div className="atlas-wb-theme__row">
      <label className="atlas-wb-theme__name">
        {category}.{name}
      </label>
      <input
        type="text"
        className="atlas-wb-field__input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
      {color ? (
        <input
          type="color"
          className="atlas-wb-theme__color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${category}.${name}`}
        />
      ) : null}
    </div>
  )
}

function BrandSection({ onApply }) {
  const [b, setB] = useState({ primary: '#0F62FE', accent: '#F59E0B', neutral: '#64748B', pair: 'modern', mood: 'balanced' })
  const set = (k) => (e) => setB({ ...b, [k]: e.target.value })
  const apply = (next) => {
    const pair = FONT_PAIRS.find((p) => p.id === next.pair) || FONT_PAIRS[0]
    onApply(createBrandTheme({ ...next, fontHeading: pair.heading, fontBody: pair.body }))
  }
  const ratio = contrastRatio(b.primary, readableOn(b.primary))
  return (
    <fieldset className="atlas-wb-theme__group" data-testid="brand-section">
      <legend>{brandEs.title}</legend>
      <div className="atlas-wb-theme__row">
        <span className="atlas-wb-theme__name">{brandEs.presets}</span>
        {BRAND_PRESETS.map((p) => (
          <button key={p.id} type="button" className="atlas-wb-field__button" title={p.label}
            onClick={() => { const next = { ...b, ...p }; setB(next); apply(next) }}>
            {p.label}
          </button>
        ))}
      </div>
      {['primary', 'accent', 'neutral'].map((k) => (
        <div key={k} className="atlas-wb-theme__row">
          <label className="atlas-wb-theme__name">{brandEs[k]}</label>
          <input type="color" className="atlas-wb-theme__color" value={b[k]} onChange={set(k)} aria-label={brandEs[k]} />
        </div>
      ))}
      <div className="atlas-wb-theme__row">
        <label className="atlas-wb-theme__name">{brandEs.fonts}</label>
        <select className="atlas-wb-field__input" value={b.pair} onChange={set('pair')} aria-label={brandEs.fonts}>
          {FONT_PAIRS.map((p) => <option key={p.id} value={p.id}>{p.label} ({p.heading} / {p.body})</option>)}
        </select>
      </div>
      <div className="atlas-wb-theme__row">
        <label className="atlas-wb-theme__name">{brandEs.mood}</label>
        <select className="atlas-wb-field__input" value={b.mood} onChange={set('mood')} aria-label={brandEs.mood}>
          {Object.entries(brandEs.moods).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <p className="atlas-wb-empty">{brandEs.contrast}: {ratio.toFixed(1)}:1{ratio < 3 ? ` - ${brandEs.lowContrast}` : ''}</p>
      <button type="button" className="atlas-wb-field__button" onClick={() => apply(b)}>{brandEs.apply}</button>
    </fieldset>
  )
}

export function ThemeTab() {
  const theme = useEditorStore((s) => s.theme)
  const setThemeToken = useEditorStore((s) => s.setThemeToken)
  const resetTheme = useEditorStore((s) => s.resetTheme)
  const setTheme = useEditorStore((s) => s.setTheme)
  const tokens = (theme && theme.tokens) || {}

  // Render flat categories only (skip nested non-string values like button/card).
  const categories = Object.entries(tokens).filter(
    ([, val]) =>
      val &&
      typeof val === 'object' &&
      Object.values(val).every((v) => typeof v === 'string' || typeof v === 'number'),
  )

  return (
    <div className="atlas-wb-theme">
      <div className="atlas-wb-theme__toolbar">
        <strong>{theme && theme.name ? theme.name : es.theme.untitled}</strong>
        <button type="button" className="atlas-wb-field__button" onClick={resetTheme}>
          {es.theme.reset}
        </button>
      </div>
      <BrandSection onApply={setTheme} />
      {categories.length === 0 ? (
        <p className="atlas-wb-empty">{es.theme.empty}</p>
      ) : (
        categories.map(([category, group]) => (
          <fieldset key={category} className="atlas-wb-theme__group">
            <legend>{es.theme.categories[category] || category}</legend>
            {Object.entries(group).map(([k, v]) => (
              <TokenRow
                key={k}
                category={category}
                name={k}
                value={v}
                onChange={(next) => setThemeToken(category, k, next)}
              />
            ))}
          </fieldset>
        ))
      )}
    </div>
  )
}
