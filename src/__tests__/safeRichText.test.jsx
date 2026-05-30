import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SafeRichText } from '../renderer/SafeRichText.jsx'

describe('SafeRichText', () => {
  it('strips disallowed tags and attributes', () => {
    const { container } = render(
      <SafeRichText html="<p>Hola <strong>Atlas</strong><script>alert(1)</script></p>" />,
    )
    expect(container.innerHTML).toMatch(/<strong>Atlas<\/strong>/)
    expect(container.innerHTML).not.toMatch(/<script>/i)
  })

  it('blocks javascript: URLs on links', () => {
    const { container } = render(<SafeRichText html='<a href="javascript:alert(1)">click</a>' />)
    const a = container.querySelector('a')
    // DOMPurify either strips href or rewrites to safe; never preserve javascript:
    if (a && a.getAttribute('href')) {
      expect(a.getAttribute('href')).not.toMatch(/^javascript:/i)
    }
  })

  it('renders empty when input is empty', () => {
    const { container } = render(<SafeRichText html="" />)
    expect(container.textContent).toBe('')
  })
})
