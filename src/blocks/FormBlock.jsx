import { useId, useRef, useState } from 'react'
import { defineBlock } from '../registry/createBlockRegistry.js'
import { colorVar, radiusVar } from './_tokens.js'
import { parseFieldsDsl, normalizeFields, validateFields } from '../forms/fields.js'
import { useResources, ResourceView } from '../resources/useResources.jsx'
import { followRedirect } from '../resources/navigate.js'

const DEFAULT_DSL = [
  'Nombre | text | required',
  'Correo | email | required',
  'Teléfono | tel',
  'Mensaje | textarea | required',
].join('\n')

const controlStyle = (invalid) => ({
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  font: 'inherit',
  color: colorVar('fg', 'inherit'),
  background: colorVar('bg', '#fff'),
  border: `1px solid ${invalid ? colorVar('danger', '#DC2626') : colorVar('border', '#CBD5E1')}`,
  borderRadius: radiusVar('md', '8px'),
})

function Field({ field, id, value, error, onChange, disabled }) {
  const errId = `${id}-err`
  const common = {
    id,
    name: field.name,
    disabled,
    required: field.required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errId : undefined,
  }
  let control
  if (field.type === 'textarea') {
    control = <textarea {...common} rows={4} placeholder={field.placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={controlStyle(error)} />
  } else if (field.type === 'select') {
    control = (
      <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={controlStyle(error)}>
        <option value="">Selecciona…</option>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  } else if (field.type === 'checkbox') {
    control = (
      <label htmlFor={id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input {...common} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 4 }} />
        <span>
          {field.label}
          {field.required ? ' *' : ''}
        </span>
      </label>
    )
  } else if (field.type === 'radio') {
    control = (
      <fieldset aria-describedby={error ? errId : undefined} style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ marginBottom: 4 }}>
          {field.label}
          {field.required ? ' *' : ''}
        </legend>
        {field.options.map((o, i) => (
          <label key={o.value} htmlFor={`${id}-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '2px 0' }}>
            <input id={`${id}-${i}`} type="radio" name={field.name} value={o.value} disabled={disabled} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </fieldset>
    )
  } else {
    control = <input {...common} type={field.type} inputMode={field.type === 'tel' ? 'tel' : undefined} placeholder={field.placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={controlStyle(error)} />
  }
  const labelled = field.type !== 'checkbox' && field.type !== 'radio'
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      {labelled && (
        <label htmlFor={id} style={{ fontWeight: 600 }}>
          {field.label}
          {field.required ? ' *' : ''}
        </label>
      )}
      {control}
      {error && (
        <span id={errId} style={{ color: colorVar('danger', '#DC2626'), fontSize: 'var(--atlas-fontSize-sm, 0.875rem)' }}>
          {error}
        </span>
      )}
    </div>
  )
}

function FormBody({ fields, formId, submitLabel, successMessage, redirectUrl, consent, edit, submit, title }) {
  const uid = useId()
  const formRef = useRef(null)
  const busy = useRef(false)
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  const set = (name, v) => {
    setValues((p) => ({ ...p, [name]: v }))
    setErrors((p) => (p[name] ? { ...p, [name]: undefined } : p))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (edit || busy.current) return
    const form = e.currentTarget
    const all = consent ? [...fields, { name: '_consent', label: consent.text, type: 'checkbox', required: true, options: [] }] : fields
    const errs = validateFields(all, values)
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      setStatus({ state: 'error', message: 'Revisa los campos marcados.' })
      form.querySelector(`[name="${first}"]`)?.focus()
      return
    }
    // Honeypot filled: act as success so bots learn nothing.
    if (form.elements._hp && form.elements._hp.value) {
      setStatus({ state: 'success', message: successMessage })
      return
    }
    if (!submit) {
      setStatus({ state: 'error', message: 'El formulario no está conectado.' })
      return
    }
    busy.current = true
    setStatus({ state: 'submitting', message: 'Enviando…' })
    try {
      const out = { ...values }
      if (consent) out.consent = true
      const res = await submit(formId, out)
      setStatus({ state: 'success', message: successMessage })
      followRedirect((res && res.redirectUrl) || redirectUrl)
    } catch (err) {
      setStatus({ state: 'error', message: (err && err.message) || 'No se pudo enviar. Intenta de nuevo.' })
    } finally {
      busy.current = false
    }
  }

  const sending = status.state === 'submitting'
  const done = status.state === 'success'
  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} aria-label={title || 'Formulario'} style={{ display: 'grid', gap: 14, fontFamily: 'var(--atlas-font-sans)' }}>
      {title && <h3 style={{ margin: 0 }}>{title}</h3>}
      {edit && !submit && (
        <div style={{ fontSize: 'var(--atlas-fontSize-sm, 0.875rem)', opacity: 0.7 }}>
          Vista previa: sin manejador de envío conectado.
        </div>
      )}
      {fields.map((f) => (
        <Field key={f.name} field={f} id={`${uid}-${f.name}`} value={values[f.name]} error={errors[f.name]} onChange={(v) => set(f.name, v)} disabled={edit || sending || done} />
      ))}
      <input name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
      {consent && (
        <Field
          field={{
            name: '_consent',
            type: 'checkbox',
            required: true,
            options: [],
            label: consent.href ? (
              <>
                {consent.text} <a href={consent.href} target="_blank" rel="noopener noreferrer">{consent.linkLabel}</a>
              </>
            ) : (
              consent.text
            ),
          }}
          id={`${uid}-consent`}
          value={values._consent}
          error={errors._consent}
          onChange={(v) => set('_consent', v)}
          disabled={edit || sending || done}
        />
      )}
      <div role="status" aria-live="polite" style={{ minHeight: 20, color: status.state === 'error' ? colorVar('danger', '#DC2626') : 'inherit' }}>
        {status.message}
      </div>
      <button
        type={edit ? 'button' : 'submit'}
        disabled={sending || done}
        aria-busy={sending || undefined}
        style={{
          justifySelf: 'start',
          padding: '10px 18px',
          fontWeight: 600,
          font: 'inherit',
          cursor: sending || done ? 'not-allowed' : 'pointer',
          background: colorVar('primary', '#0F62FE'),
          color: colorVar('primaryFg', '#fff'),
          border: 'none',
          borderRadius: radiusVar('md', '8px'),
          opacity: sending || done ? 0.7 : 1,
        }}
      >
        {sending ? 'Enviando…' : submitLabel}
      </button>
    </form>
  )
}

function FormBlockView({
  formId,
  title,
  fieldsDsl,
  submitLabel,
  successMessage,
  redirectUrl,
  consentEnabled,
  consentText,
  consentLinkLabel,
  consentHref,
  ctx,
}) {
  const resources = useResources(ctx)
  const edit = ctx.mode === 'edit'
  const submit = resources.forms && typeof resources.forms.submit === 'function' ? resources.forms.submit : null
  const consent = consentEnabled ? { text: consentText, linkLabel: consentLinkLabel, href: consentHref } : null
  const common = { edit, submit, consent, formId: formId || ctx.blockId }
  if (formId) {
    return (
      <ResourceView resources={resources} path="forms.get" params={formId} select={(s) => s || { fields: [] }} isEmpty={(s) => !s.fields || !s.fields.length}>
        {(schema) => (
          <FormBody
            {...common}
            fields={normalizeFields(schema.fields)}
            title={schema.title || title}
            submitLabel={schema.submitLabel || submitLabel}
            successMessage={schema.successMessage || successMessage}
            redirectUrl={schema.redirectUrl || redirectUrl}
          />
        )}
      </ResourceView>
    )
  }
  return <FormBody {...common} fields={parseFieldsDsl(fieldsDsl)} title={title} submitLabel={submitLabel} successMessage={successMessage} redirectUrl={redirectUrl} />
}

/**
 * Generic form. Fields come from a textarea DSL (`Label | type | required |
 * options`) or from `resources.forms.get(formId)`; it submits through
 * `resources.forms.submit(formId, values)`.
 */
export const FormBlock = defineBlock({
  type: 'FormBlock',
  label: 'Formulario',
  category: 'forms',
  icon: 'form',
  resources: ['forms'],
  defaultProps: {
    formId: '',
    title: 'Contáctanos',
    fieldsDsl: DEFAULT_DSL,
    submitLabel: 'Enviar',
    successMessage: 'Gracias, recibimos tu mensaje.',
    redirectUrl: '',
    consentEnabled: false,
    consentText: 'Acepto el tratamiento de mis datos.',
    consentLinkLabel: 'Aviso de privacidad',
    consentHref: '',
  },
  fields: {
    formId: { type: 'text', label: 'ID de formulario (opcional)' },
    title: { type: 'text', label: 'Título' },
    fieldsDsl: { type: 'textarea', label: 'Campos (Etiqueta | tipo | required | opciones)' },
    submitLabel: { type: 'text', label: 'Texto del botón' },
    successMessage: { type: 'text', label: 'Mensaje de éxito' },
    redirectUrl: { type: 'link', label: 'Redirigir tras enviar' },
    consentEnabled: { type: 'toggle', label: 'Pedir consentimiento' },
    consentText: { type: 'text', label: 'Texto de consentimiento' },
    consentLinkLabel: { type: 'text', label: 'Texto del enlace' },
    consentHref: { type: 'link', label: 'Enlace de consentimiento' },
  },
  groups: [
    { label: 'Origen', fields: ['formId', 'fieldsDsl'] },
    { label: 'Contenido', fields: ['title', 'submitLabel', 'successMessage', 'redirectUrl'] },
    { label: 'Consentimiento', fields: ['consentEnabled', 'consentText', 'consentLinkLabel', 'consentHref'] },
  ],
  render: (props) => <FormBlockView {...props} />,
})
