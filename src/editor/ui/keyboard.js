export function onTabListKeyDown(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.target.getAttribute('role') !== 'tab') return
  const buttons = [...event.currentTarget.querySelectorAll('[role="tab"]:not(:disabled)')]
  const index = buttons.indexOf(event.target)
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length
  event.preventDefault()
  buttons[next]?.click()
  buttons[next]?.focus()
}
