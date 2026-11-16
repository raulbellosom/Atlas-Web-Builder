import { createContext, useContext, useState } from 'react'
import { defineBlock } from '../../registry/createBlockRegistry.js'
import { designFields, designGroups, elementSurfaceStyle, elementClass } from './design.js'

const AccordionContext = createContext(null)
const select = (label, options) => ({ type: 'select', label, options })
const color = value => /^#[a-f\d]{6}([a-f\d]{2})?$/i.test(value ?? '') ? value : undefined
const size = (value, fallback) => Number.isFinite(value) && value >= 0 && value <= 128 ? value : fallback
function AccordionView({ ctx, ...props }) {
  const [open, setOpen] = useState(() => new Set(props.initialOpen === 'all' && props.multiple ? ctx.childIds('children') : props.initialOpen === 'first' ? ctx.childIds('children').slice(0, 1) : []))
  const toggle = id => setOpen(previous => {
    const next = props.multiple ? new Set(previous) : new Set()
    if (!previous.has(id)) next.add(id)
    return next
  })
  const style = { ...elementSurfaceStyle(props, ctx), display: 'grid', gap: size(props.gap, 12),
    '--atlas-faq-question-bg': color(props.questionBackground), '--atlas-faq-question-color': color(props.questionColor),
    '--atlas-faq-active-bg': color(props.activeBackground), '--atlas-faq-active-color': color(props.activeColor),
    '--atlas-faq-answer-bg': color(props.answerBackground), '--atlas-faq-icon-color': color(props.iconColor),
    '--atlas-faq-padding': `${size(props.itemPadding, 20)}px`, '--atlas-faq-radius': `${size(props.itemRadius, 12)}px`,
    '--atlas-faq-font-size': `${Math.max(8, size(props.questionFontSize, 18))}px` }
  return <AccordionContext.Provider value={{ open, toggle, icon: props.icon, iconPosition: props.iconPosition }}>
    <div className={elementClass(ctx, 'atlas-accordion')} style={style}>{ctx.slot('children')}</div>
  </AccordionContext.Provider>
}
function AccordionItemView({ ctx, title, initiallyOpen, ...props }) {
  const group = useContext(AccordionContext)
  const [ownOpen, setOwnOpen] = useState(Boolean(initiallyOpen))
  const open = ctx.mode === 'edit' || (group ? group.open.has(ctx.blockId) : ownOpen)
  const buttonId = `atlas-question-${ctx.blockId}`, panelId = `atlas-answer-${ctx.blockId}`
  const icon = group?.icon ?? 'plus'
  return <div className={elementClass(ctx, 'atlas-accordion-item')} style={{ border: '1px solid var(--atlas-color-muted, #dddddd)', borderRadius: 'var(--atlas-faq-radius, 12px)', overflow: 'hidden', ...elementSurfaceStyle(props, ctx) }}>
    <h3 style={{ margin: 0, font: 'inherit' }}>
      <button id={buttonId} type="button" aria-expanded={open} aria-controls={panelId}
        onClick={() => { if (ctx.mode !== 'edit') { if (group) group.toggle(ctx.blockId); else setOwnOpen(value => !value) } }}
        style={{ display: 'flex', flexDirection: group?.iconPosition === 'left' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%', textAlign: 'start', font: 'inherit', fontWeight: 600, fontSize: 'var(--atlas-faq-font-size, 18px)', border: 0, padding: 'var(--atlas-faq-padding, 20px)', cursor: 'pointer', color: open ? 'var(--atlas-faq-active-color, var(--atlas-faq-question-color, inherit))' : 'var(--atlas-faq-question-color, inherit)', background: open ? 'var(--atlas-faq-active-bg, var(--atlas-faq-question-bg, transparent))' : 'var(--atlas-faq-question-bg, transparent)' }}>
        <span style={{ flex: 1 }}>{ctx.inlineText ? ctx.inlineText({ propName: 'title', value: title, as: 'span' }) : title}</span>
        {icon !== 'none' && <span aria-hidden="true" style={{ color: 'var(--atlas-faq-icon-color, currentColor)', flexShrink: 0 }}>{icon === 'chevron' ? (open ? '⌃' : '⌄') : (open ? '−' : '+')}</span>}
      </button>
    </h3>
    <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open} style={{ padding: 'var(--atlas-faq-padding, 20px)', background: 'var(--atlas-faq-answer-bg, transparent)' }}>{ctx.slot('children')}</div>
  </div>
}
export const AccordionBlock = defineBlock({
  type: 'AccordionBlock', label: 'Acordeón personalizable', category: 'elements', kind: 'element', icon: 'layout', slots: { children: { allow: ['AccordionItemBlock'] } },
  defaultProps: { widthMode: 'fill', multiple: false, initialOpen: 'first', icon: 'plus', iconPosition: 'right', gap: 12, itemPadding: 20, itemRadius: 12, questionFontSize: 18 },
  fields: { multiple: { type: 'toggle', label: 'Permitir varias respuestas abiertas' }, initialOpen: select('Apertura inicial', ['none', 'first', 'all']), icon: select('Indicador', ['plus', 'chevron', 'none']), iconPosition: select('Posición del indicador', ['left', 'right']),
    gap: { type: 'number', label: 'Separación', min: 0, max: 128 }, itemPadding: { type: 'number', label: 'Espacio interior de preguntas y respuestas', min: 0, max: 128 }, itemRadius: { type: 'number', label: 'Radio de cada pregunta', min: 0, max: 128 }, questionFontSize: { type: 'number', label: 'Tamaño de pregunta', min: 8, max: 128 },
    ...Object.fromEntries([['questionBackground', 'Fondo de pregunta'], ['questionColor', 'Texto de pregunta'], ['activeBackground', 'Fondo al abrir'], ['activeColor', 'Texto al abrir'], ['answerBackground', 'Fondo de respuesta'], ['iconColor', 'Color del indicador']].map(([key, label]) => [key, { type: 'color', label }])), ...designFields },
  groups: [{ label: 'Interacción', fields: ['multiple', 'initialOpen', 'icon', 'iconPosition'] }, { label: 'Preguntas y respuestas', fields: ['gap', 'itemPadding', 'itemRadius', 'questionFontSize', 'questionBackground', 'questionColor', 'activeBackground', 'activeColor', 'answerBackground', 'iconColor'] }, ...designGroups], render: AccordionView,
})
export const AccordionItemBlock = defineBlock({
  type: 'AccordionItemBlock', label: 'Pregunta desplegable', category: 'elements', kind: 'element', icon: 'text', slots: { children: {} },
  defaultProps: { title: 'Escribe tu pregunta', widthMode: 'fill', initiallyOpen: false },
  fields: { title: { type: 'text', label: 'Pregunta' }, initiallyOpen: { type: 'toggle', label: 'Abrir inicialmente cuando se usa sin un acordeón' }, ...designFields },
  groups: [{ label: 'Pregunta', fields: ['title', 'initiallyOpen'] }, ...designGroups], render: AccordionItemView,
})
