/** Only http(s) and same-site paths may be followed after submit/checkout. */
export function isSafeRedirect(url) {
  return typeof url === 'string' && /^(https?:\/\/|\/(?!\/))/i.test(url.trim())
}

/**
 * Follow a host-provided redirect URL when it is safe. Returns whether it navigated.
 *
 * @param {unknown} url
 * @param {(url:string)=>void} [navigate] Override (tests, SPA routers).
 */
export function followRedirect(url, navigate) {
  if (!isSafeRedirect(url)) return false
  if (navigate) navigate(url)
  else if (typeof window !== 'undefined') window.location.assign(url)
  return true
}
