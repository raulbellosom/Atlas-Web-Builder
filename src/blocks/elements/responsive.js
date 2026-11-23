// Keep the existing flat tabletX/mobileX document format and resolve each field independently.
export const devices = ['desktop', 'tablet', 'mobile']
export const responsiveKey = (key, device = 'desktop') => device === 'desktop' ? key : `${device}${key[0].toUpperCase()}${key.slice(1)}`
export function resolveResponsive(props, device = 'desktop') {
  const result = { ...props }
  for (const current of devices.slice(1, devices.indexOf(device) + 1)) {
    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith(current) && /[A-Z]/.test(key[current.length] ?? '') && value !== undefined && value !== 'inherit' && props[`${key}Inherit`] !== true) {
        const base = key[current.length].toLowerCase() + key.slice(current.length + 1)
        result[base] = value
      }
    }
  }
  return result
}
export function responsiveFields(fields, keys) {
  const result = { ...fields }
  for (const key of keys.filter(key => fields[key])) {
    result[key] = { ...fields[key], responsive: true }
    for (const device of devices.slice(1)) {
      const name = responsiveKey(key, device)
      result[name] = { ...fields[key], ...fields[name], responsiveBase: key }
    }
  }
  return result
}
const unitless = new Set(['fontWeight', 'lineHeight', 'order', 'zIndex', 'opacity', 'flexGrow', 'flexShrink', 'aspectRatio'])
const cssValue = (key, value) => value === undefined ? 'revert' : typeof value === 'number' && !unitless.has(key) ? `${value}px` : String(value)
export function responsiveStyle(props, factory, properties) {
  const result = factory(props, 'desktop')
  const styles = devices.map(device => factory(resolveResponsive(props, device), device))
  for (const [key, cssKeys] of Object.entries(properties)) {
    if (!devices.slice(1).some(device => props[responsiveKey(key, device)] !== undefined)) continue
    for(const cssKey of [cssKeys].flat()) {
      result[cssKey] = `var(--ar-${cssKey})`
      devices.forEach((device, index) => { result[`--ar-${device}-${cssKey}`] = cssValue(cssKey, styles[index][cssKey]) })
    }
  }
  return result
}
