import { useRef, useState } from 'react'
import { Film, LoaderCircle, Music, X } from 'lucide-react'
import { useBuilder } from '../../provider/BuilderContext.js'
import { AssetPicker } from '../assets/AssetPicker.jsx'
import { assetKind, readDraggedAsset, resolveAsset, uploadAsset } from '../assets/assetSource.js'

const isSafeUrl = (value) => typeof value === 'string' && /^(https?:|\/|blob:)/i.test(value)
const LABELS = { video: { noun: 'video', accept: 'video/*' }, audio: { noun: 'audio', accept: 'audio/*' } }

/**
 * `video` / `audio` field: always a library asset (never a typed URL), so a template can package it.
 * Picking, dropping a listed asset or uploading a file (when the host supports it) fills the field.
 */
export function MediaField({ value, onChange, label, spec }) {
  const kind = spec?.type === 'audio' ? 'audio' : 'video', { noun, accept } = LABELS[kind]
  const { assets } = useBuilder()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const trigger = useRef(null)
  const canUpload = typeof assets?.upload === 'function'

  async function take(asset) {
    setError(null)
    if (!asset || assetKind(asset) !== kind) { setError(`Elige un ${noun} de la biblioteca.`); return }
    setBusy(true)
    try { const resolved = await resolveAsset(assets, asset); if (resolved?.url) onChange(resolved.url) }
    catch (err) { setError(err?.message || String(err)) }
    finally { setBusy(false) }
  }

  function onDrop(e) {
    e.preventDefault()
    const listed = readDraggedAsset(e)
    if (listed) { take(listed); return }
    const file = e.dataTransfer?.files?.[0]
    if (file && canUpload && file.type.startsWith(`${kind}/`)) {
      setBusy(true); setError(null)
      uploadAsset(assets, file).then(take).catch((err) => setError(err?.message || String(err))).finally(() => setBusy(false))
    }
  }

  const Icon = kind === 'audio' ? Music : Film
  return (
    <div className="atlas-wb-field" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <span className="atlas-wb-field__label">{label}</span>
      <div className="atlas-wb-field__row">
        <button ref={trigger} type="button" className="atlas-wb-btn atlas-wb-btn--ghost" disabled={busy || !assets} onClick={() => setPickerOpen(true)}>
          {busy ? <LoaderCircle className="atlas-wb-spin" aria-hidden="true" /> : <Icon aria-hidden="true" />}
          {value ? `Cambiar ${noun}` : `Elegir ${noun}`}
        </button>
        {value ? (
          <button type="button" className="atlas-wb-field__button" onClick={() => onChange('')} aria-label={`Quitar ${noun}`}><X /></button>
        ) : null}
      </div>
      {value && isSafeUrl(value) ? (
        kind === 'audio'
          // eslint-disable-next-line jsx-a11y/media-has-caption
          ? <audio src={value} controls preload="metadata" style={{ width: '100%' }} aria-label={`Vista previa de ${label}`} />
          // eslint-disable-next-line jsx-a11y/media-has-caption
          : <video src={value} controls preload="metadata" playsInline style={{ width: '100%', maxHeight: 120, borderRadius: 6, background: '#000' }} aria-label={`Vista previa de ${label}`} />
      ) : null}
      {!assets ? <span role="note">Este editor no tiene biblioteca de medios.</span> : null}
      {error ? <span role="alert" style={{ color: 'var(--awb-danger)', fontSize: 11 }}>{error}</span> : null}
      {pickerOpen ? (
        <AssetPicker returnFocusRef={trigger} accept={accept} kind={kind}
          onPick={(asset) => { setPickerOpen(false); take(asset) }} onClose={() => setPickerOpen(false)} />
      ) : null}
    </div>
  )
}
