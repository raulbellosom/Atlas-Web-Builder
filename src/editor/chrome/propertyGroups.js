const categories = ['Contenido', 'Layout', 'Tipografía', 'Apariencia', 'Bordes y sombras', 'Avanzado']
function category(name, spec) {
  if (categories.includes(spec.group)) return spec.group
  if (/shadow|border|radius/i.test(name)) return 'Bordes y sombras'
  if (/font|textAlign|lineHeight|letterSpacing|textTransform|weight/i.test(name)) return 'Tipografía'
  if (/margin|padding|gap|width|height|align|position|display|columns/i.test(name) || spec.type === 'spacing') return 'Layout'
  if (/color|background|opacity/i.test(name) || ['color', 'color-token', 'background'].includes(spec.type)) return 'Apariencia'
  return spec.advanced ? 'Avanzado' : 'Contenido'
}

export function partitionGroups(entries, groups) {
  const sections = [], listed = new Set()
  for (const group of groups ?? []) {
    const fields = (group.fields ?? []).map(name => entries.find(([key]) => key === name)).filter(Boolean)
    fields.forEach(([key]) => listed.add(key))
    if (fields.length) sections.push({ label: group.label === 'Disposición' ? 'Layout' : group.label, entries: fields })
  }
  for (const label of categories) {
    const fields = entries.filter(([name, spec]) => !listed.has(name) && category(name, spec) === label)
    if (!fields.length) continue
    const existing = sections.find(section => section.label === label)
    if (existing) existing.entries.push(...fields)
    else sections.push({ label, entries: fields })
  }
  return sections
}
