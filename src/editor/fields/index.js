/**
 * @file Field control registry. Each field type maps to a controlled React
 * component receiving { value, onChange, spec }.
 *
 * Built-in field types:
 *   text, textarea, number, toggle, select, color-token, spacing,
 *   image, link, rich-text
 *
 * Hosts can register custom field types via `defineField()` later (Phase 7+).
 */
import { TextField } from './TextField.jsx'
import { TextareaField } from './TextareaField.jsx'
import { NumberField } from './NumberField.jsx'
import { ToggleField } from './ToggleField.jsx'
import { SelectField } from './SelectField.jsx'
import { ColorTokenField } from './ColorTokenField.jsx'
import { SpacingField } from './SpacingField.jsx'
import { ImageField } from './ImageField.jsx'
import { LinkField } from './LinkField.jsx'
import { RichTextField } from './RichTextField.jsx'
import { BackgroundField } from './BackgroundField.jsx'
import { AnimationField } from './AnimationField.jsx'
import { FilterField } from './FilterField.jsx'
import { HoverField } from './HoverField.jsx'
import { TransformField } from './TransformField.jsx'

/** @type {Object<string, React.ComponentType<{ value: any, onChange: (v:any)=>void, spec: any, label?: string }>>} */
export const defaultFields = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  toggle: ToggleField,
  select: SelectField,
  'color-token': ColorTokenField,
  spacing: SpacingField,
  image: ImageField,
  link: LinkField,
  'rich-text': RichTextField,
  background: BackgroundField,
  animation: AnimationField,
  filter: FilterField,
  hover: HoverField,
  transform: TransformField,
}

/**
 * Validate and freeze a custom field definition.
 *
 * @param {{ type: string, render: React.ComponentType<any> }} def
 */
export function defineField(def) {
  if (!def || typeof def !== 'object') {
    throw new TypeError('defineField: definition must be an object')
  }
  if (typeof def.type !== 'string' || !def.type) {
    throw new TypeError('defineField: "type" must be a non-empty string')
  }
  if (typeof def.render !== 'function') {
    throw new TypeError(`defineField("${def.type}"): "render" must be a function`)
  }
  return Object.freeze(def)
}
