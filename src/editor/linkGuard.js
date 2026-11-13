/**
 * Click-capture handler for the editor canvas and its preview. Blocks render
 * real `<a href>` links for the public site; inside the editor following one
 * would navigate the host app away. Links that open a new tab still work.
 *
 * @param {(href: string) => void} [onLinkClick] host callback, e.g. to open the linked page in the editor
 */
export function createLinkGuard(onLinkClick, { blockNewTabs = false } = {}) {
  return (event) => {
    const anchor = event.target?.closest?.('a[href]')
    if (!anchor || (anchor.target === '_blank' && !blockNewTabs)) return
    event.preventDefault()
    const href = anchor.getAttribute('href')
    if (href && !href.startsWith('#') && onLinkClick) onLinkClick(href)
  }
}
