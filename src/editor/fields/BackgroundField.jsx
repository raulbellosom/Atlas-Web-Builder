import { useThemeTokens } from '../../theme/ThemeProvider.jsx'
import { useBuilder } from '../../provider/BuilderContext.js'
import clsx from 'clsx'
import { useState } from 'react'
import { AssetPicker } from '../assets/AssetPicker.jsx'

const KINDS = [
  { value: 'color', label: 'Color' },
  { value: 'gradient', label: 'Degradado' },
  { value: 'image', label: 'Imagen' },
]

const ANGLES = [
  { value: 0, label: '↑ 0°' },
  { value: 45, label: '↗ 45°' },
  { value: 90, label: '→ 90°' },
  { value: 135, label: '↘ 135°' },
  { value: 180, label: '↓ 180°' },
  { value: 225, label: '↙ 225°' },
  { value: 270, label: '← 270°' },
  { value: 315, label: '↖ 315°' },
]

/** Coerce legacy string token into the new object form. */
function normalize(value) {
  if (!value) return { kind: 'color', token: '', value: '' }
  if (typeof value === 'string') return { kind: 'color', token: value, value: '' }
  if (typeof value === 'object' && value.kind) return value
  return { kind: 'color', token: '', value: '' }
}

function TokenSelect({ value, onChange, tokens, allowEmpty = true }) {
  const keys = Object.keys(tokens || {})
  return (
    <select
      className="atlas-wb-field__select"
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      {allowEmpty ? <option value="">— ninguno —</option> : null}
      {keys.map((k) => (
        <option key={k} value={k}>
          {k}
        </option>
      ))}
    </select>
  )
}

export function BackgroundField({ value, onChange, label }) {
  const tokens = useThemeTokens()
  const colorTokens = (tokens && tokens.color) || {}
  const { assets } = useBuilder()
  const v = normalize(value)
  const [pickerOpen, setPickerOpen] = useState(false)

  function update(patch) {
    onChange({ ...v, ...patch })
  }

  function setKind(kind) {
    onChange({ ...v, kind })
  }

  return (
    <div className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>
      <div className="atlas-wb-bg-field__tabs" role="tablist">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="tab"
            aria-selected={v.kind === k.value}
            className={clsx(
              'atlas-wb-bg-field__tab',
              v.kind === k.value && 'atlas-wb-bg-field__tab--active',
            )}
            onClick={() => setKind(k.value)}
          >
            {k.label}
          </button>
        ))}
      </div>

      {v.kind === 'color' ? (
        <div className="atlas-wb-bg-field__group">
          <div className="atlas-wb-bg-field__row">
            <span>Token</span>
            <TokenSelect
              value={v.token}
              onChange={(t) => update({ token: t || '', value: '' })}
              tokens={colorTokens}
            />
          </div>
          <div className="atlas-wb-bg-field__row">
            <span>Personalizado</span>
            <input
              type="color"
              aria-label="Color personalizado"
              className="atlas-wb-theme__color"
              value={v.value || '#ffffff'}
              onChange={(e) => update({ value: e.target.value, token: '' })}
            />
          </div>
        </div>
      ) : null}

      {v.kind === 'gradient' ? (
        <div className="atlas-wb-bg-field__group">
          <div className="atlas-wb-bg-field__row">
            <span>De</span>
            <input
              type="color"
              aria-label="Color inicial"
              className="atlas-wb-theme__color"
              value={v.from || '#0F62FE'}
              onChange={(e) => update({ from: e.target.value })}
            />
          </div>
          <div className="atlas-wb-bg-field__row">
            <span>A</span>
            <input
              type="color"
              aria-label="Color final"
              className="atlas-wb-theme__color"
              value={v.to || '#F59E0B'}
              onChange={(e) => update({ to: e.target.value })}
            />
          </div>
          <div className="atlas-wb-bg-field__row">
            <span>Ángulo</span>
            <select
              aria-label="Ángulo del degradado"
              className="atlas-wb-field__select"
              value={v.angle ?? 135}
              onChange={(e) => update({ angle: Number(e.target.value) })}
            >
              {ANGLES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div
            aria-hidden="true"
            className="atlas-wb-bg-field__preview"
            style={{
              background: `linear-gradient(${v.angle ?? 135}deg, ${v.from || '#0F62FE'}, ${
                v.to || '#F59E0B'
              })`,
            }}
          />
        </div>
      ) : null}

      {v.kind === 'image' ? (
        <div className="atlas-wb-bg-field__group">
          <div className="atlas-wb-field__row" style={{ position: 'relative' }}>
            <input
              type="url"
              className="atlas-wb-field__input"
              value={v.url || ''}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="https://..."
            />
            {assets ? (
              <button
                type="button"
                className="atlas-wb-field__button"
                onClick={() => setPickerOpen((s) => !s)}
              >
                Examinar...
              </button>
            ) : null}
            {pickerOpen && assets ? (
              <AssetPicker
                source={assets}
                onPick={(asset) => {
                  update({ url: asset.url })
                  setPickerOpen(false)
                }}
                onClose={() => setPickerOpen(false)}
                accept="image/*"
              />
            ) : null}
          </div>
          <div className="atlas-wb-bg-field__row">
            <span>Ajuste</span>
            <select
              aria-label="Ajuste de la imagen"
              className="atlas-wb-field__select"
              value={v.size || 'cover'}
              onChange={(e) => update({ size: e.target.value })}
            >
              <option value="cover">Cubrir</option>
              <option value="contain">Contener</option>
              <option value="auto">Tamaño original</option>
            </select>
          </div>
          <div className="atlas-wb-bg-field__row">
            <span>Velo</span>
            <select
              aria-label="Velo sobre la imagen"
              className="atlas-wb-field__select"
              value={v.overlay || ''}
              onChange={(e) => update({ overlay: e.target.value || undefined })}
            >
              <option value="">Ninguno</option>
              <option value="rgba(0,0,0,0.25)">Oscuro suave</option>
              <option value="rgba(0,0,0,0.45)">Oscuro</option>
              <option value="rgba(0,0,0,0.65)">Oscuro fuerte</option>
              <option value="rgba(255,255,255,0.35)">Claro</option>
            </select>
          </div>
          {v.url ? (
            <div
              aria-hidden="true"
              className="atlas-wb-bg-field__preview"
              style={{
                backgroundImage: `${v.overlay ? `linear-gradient(${v.overlay}, ${v.overlay}), ` : ''}url("${v.url}")`,
                backgroundSize: v.size || 'cover',
                backgroundPosition: 'center',
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
