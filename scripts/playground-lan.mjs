import assert from 'node:assert/strict'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const privateAddress = ip => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)
const addresses = Object.entries(networkInterfaces()).flatMap(([name, items]) =>
  /loopback|virtual|vethernet|wsl|docker|tailscale|vpn/i.test(name) ? [] : items.filter(item =>
    item.family === 'IPv4' && !item.internal && privateAddress(item.address)).map(item => item.address))
const host = process.env.ATLAS_LAN_HOST || addresses[0]
assert(host && privateAddress(host) && Object.values(networkInterfaces()).flat().some(item => item.address === host),
  'Connect to a private LAN, or set ATLAS_LAN_HOST to an assigned private IPv4 address.')
const playground = resolve(root, 'examples/playground')
const server = await createServer({
  root: playground,
  configFile: resolve(playground, 'vite.config.js'),
  envPrefix: 'ATLAS_PLAYGROUND_PUBLIC_',
  plugins: [{ name: 'private-playground-paths', configureServer(vite) {
    vite.middlewares.use((request, response, next) => {
      let path
      try { path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replaceAll('\\', '/') }
      catch { response.statusCode = 400; response.end(); return }
      // Reject even missing sensitive paths instead of returning the SPA fallback.
      if (/(^|\/)(\.env[^/]*|\.git|\.artifacts)(\/|$)/i.test(path)) {
        response.statusCode = 403; response.end('Forbidden'); return
      }
      next()
    })
  } }],
  server: {
    host, port: 5173, strictPort: true, cors: false,
    fs: { strict: true, allow: [playground, resolve(root, 'src'), resolve(root, 'node_modules')],
      deny: ['.env', '.env.*', '**/*.{crt,pem,key}', '**/.git/**', '**/.artifacts/**'] },
  },
})
await server.listen()
console.log(`\nAtlas playground — private LAN only: http://${host}:5173/\nNo ERP connections or public deployment. Ctrl+C to stop.\n`)
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await server.close(); process.exit(0) })
