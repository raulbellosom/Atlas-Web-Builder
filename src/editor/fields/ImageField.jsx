import { useRef, useState } from 'react'
import { useBuilder } from '../../provider/BuilderContext.js'
import { AssetPicker } from '../assets/AssetPicker.jsx'

function isSafeUrl(value) {
  if (typeof value !== 'string') return false
  if (value === '') return true
  return /^(https?:|\/|data:image\/)/i.test(value)
}

export function ImageField({ value, onChange, label, spec }) {
  const { assets } = useBuilder()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading]   = useState(false)
  const dropRef = useRef(null)

  const safe      = isSafeUrl(value)
  const canUpload = !!(assets && typeof assets.upload === 'function')

  async function handleDroppedFile(file) {
    if (!file) return
    if (canUpload) {
      try {
        setUploading(true)
        const asset = await assets.upload(file)
        if (asset?.url) onChange(asset.url)
      } catch { /* surface nothing — user can use URL tab instead */ }
      finally { setUploading(false) }
    } else {
      // No upload backend: read as data URL (temporary, works for preview)
      const reader = new FileReader()
      reader.onload = (e) => onChange(String(e.target?.result ?? ''))
      reader.readAsDataURL(file)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleDroppedFile(file)
  }

  return (
    <label className="atlas-wb-field">
      <span className="atlas-wb-field__label">{label}</span>

      {/* Drop zone wrapping the row */}
      <div
        ref={dropRef}
        className={isDragOver ? 'atlas-wb-image-field--dragover' : undefined}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={(e) => { if (!dropRef.current?.contains(e.relatedTarget)) setIsDragOver(false) }}
        onDrop={onDrop}
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <div className="atlas-wb-field__row">
          <input
            type="url"
            className="atlas-wb-field__input"
            value={value ?? ''}
            placeholder={spec?.placeholder || 'https://... o arrastra imagen aquí'}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!safe}
          />
          <button
            type="button"
            className="atlas-wb-field__button"
            onClick={() => setPickerOpen(true)}
            aria-label="Abrir selector de medios"
            disabled={uploading}
          >
            {uploading ? '↑' : '⊞'}
          </button>
        </div>

        {/* Thumbnail preview */}
        {value && safe ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={value}
              alt=""
              style={{ maxHeight: 80, maxWidth: '100%', borderRadius: 6, display: 'block', border: '1px solid var(--awb-border)', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.55)', color: 'white', border: 0, borderRadius: 4, padding: '1px 5px', fontSize: 11, cursor: 'pointer', lineHeight: 1.4 }}
              aria-label="Quitar imagen"
            >
              ✕
            </button>
          </div>
        ) : null}

        {isDragOver ? (
          <p style={{ fontSize: 11, color: 'var(--awb-accent)', textAlign: 'center', margin: 0 }}>
            Suelta para cargar
          </p>
        ) : null}
      </div>

      {!safe && value ? (
        <span style={{ color: 'var(--awb-danger)', fontSize: 11 }}>URL no permitida (usa https://).</span>
      ) : null}

      {pickerOpen ? (
        <AssetPicker
          accept="image/*"
          onPick={(asset) => { onChange(asset.url); setPickerOpen(false) }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </label>
  )
}
