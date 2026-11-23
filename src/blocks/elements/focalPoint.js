// Focal point of an image: the part that must stay visible when `object-fit: cover` crops it. Stored as percentages
// (0-100) per device with the same inheritance as other responsive props: mobile -> tablet -> desktop -> centered.
export const FOCAL_RANGE = Object.freeze([0, 100])
const valid = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
const DEVICES = [['desktop', 'focalX', 'focalY'], ['tablet', 'tabletFocalX', 'tabletFocalY'], ['mobile', 'mobileFocalX', 'mobileFocalY']]

/** CSS custom properties for the `.atlas-focal` rules in elements.css; only devices that define a point get a variable. */
export function focalVars(props) {
  const vars = {}
  for (const [device, xKey, yKey] of DEVICES) {
    const x = props?.[xKey], y = props?.[yKey]
    if (valid(x) || valid(y)) vars[`--atlas-focal-${device}`] = `${valid(x) ? x : 50}% ${valid(y) ? y : 50}%`
  }
  return vars
}
export const hasFocal = (props) => Object.keys(focalVars(props)).length > 0
