import { SliderInput, UnitInput } from '../ui/NumericControls.jsx'
import { SegmentedControl, SwitchControl, CheckboxControl, Combobox } from '../ui/ChoiceControls.jsx'
import { ColorInput } from '../ui/OverlayControls.jsx'

const field = Control => function ControlField({ value, onChange, label, spec }) {
  return <div className="atlas-wb-field"><span className="atlas-wb-field__label">{label}</span><Control {...spec} value={value} onChange={onChange} label={label} /></div>
}
export const SliderField = field(SliderInput)
export const UnitField = field(UnitInput)
export const SegmentedField = field(SegmentedControl)
export const ComboboxField = field(Combobox)
export const CheckboxField = field(CheckboxControl)
export const ColorField = field(ColorInput)
export function SwitchField({ value, onChange, label }) { return <div className="atlas-wb-field"><SwitchControl value={value} onChange={onChange} label={label} /></div> }
