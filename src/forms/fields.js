/**
 * @file Form field DSL parsing, normalization and client validation (pure).
 */

export const FIELD_TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'date', 'number']

const REQUIRED_RE = /^(\*|1|req|required|requerido|obligatorio|si|sí|yes|true)$/i

export function slugify(label) {
  return (
    String(label || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'campo'
  )
}

function toOptions(raw) {
  return (raw || [])
    .map((o) => (typeof o === 'string' ? { value: o.trim(), label: o.trim() } : { value: String(o.value), label: o.label ?? String(o.value) }))
    .filter((o) => o.value !== '')
}

function uniqueNames(fields) {
  const seen = new Map()
  return fields.map((f) => {
    const base = f.name || slugify(f.label)
    const n = (seen.get(base) || 0) + 1
    seen.set(base, n)
    return { ...f, name: n === 1 ? base : `${base}_${n}` }
  })
}

/**
 * Normalize host-provided schema fields (or parsed DSL) into a canonical shape.
 *
 * @param {import('../resources/contract.js').FormField[]} fields
 */
export function normalizeFields(fields) {
  const list = (fields || [])
    .filter((f) => f && f.label)
    .map((f) => ({
      name: f.name,
      label: String(f.label),
      type: FIELD_TYPES.includes(f.type) ? f.type : 'text',
      required: !!f.required,
      placeholder: f.placeholder || '',
      options: toOptions(f.options),
    }))
  return uniqueNames(list)
}

/**
 * Parse the textarea DSL: one field per line, `Label | type | required | options`.
 * `required` is any of `*`, `req`, `required`, `si`, ...; options are comma separated.
 * Blank lines and lines starting with `#` are ignored.
 *
 * @param {string} text
 */
export function parseFieldsDsl(text) {
  const rows = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((line) => {
      const [label, type = 'text', req = '', opts = ''] = line.split('|').map((p) => p.trim())
      return {
        label,
        type: type.toLowerCase() || 'text',
        required: REQUIRED_RE.test(req),
        options: opts ? opts.split(',').map((o) => o.trim()) : [],
      }
    })
  return normalizeFields(rows)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const TEL_RE = /^[+()\d\s.-]+$/

/**
 * Validate values against normalized fields. Returns `{ [name]: message }`
 * (empty object when valid). Messages are Spanish.
 */
export function validateFields(fields, values) {
  const errors = {}
  for (const f of fields) {
    const v = values[f.name]
    const empty = f.type === 'checkbox' ? !v : v === undefined || v === null || String(v).trim() === ''
    if (empty) {
      if (f.required) errors[f.name] = f.type === 'checkbox' ? 'Debes aceptar para continuar.' : 'Este campo es obligatorio.'
      continue
    }
    const s = String(v).trim()
    if (f.type === 'email' && !EMAIL_RE.test(s)) errors[f.name] = 'Ingresa un correo válido.'
    else if (f.type === 'tel' && !(TEL_RE.test(s) && s.replace(/\D/g, '').length >= 7)) errors[f.name] = 'Ingresa un teléfono válido.'
    else if (f.type === 'number' && !Number.isFinite(Number(s))) errors[f.name] = 'Ingresa un número válido.'
    else if ((f.type === 'select' || f.type === 'radio') && f.options.length && !f.options.some((o) => o.value === s)) {
      errors[f.name] = 'Selecciona una opción válida.'
    }
  }
  return errors
}
