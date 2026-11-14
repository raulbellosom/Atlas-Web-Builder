import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Optional isolated consumer: exercise the installed tarball, never the source alias.
const consumer = process.argv[2] && resolve(process.argv[2])
const require = createRequire(consumer ? join(consumer, 'package.json') : import.meta.url)
const candidate = consumer ? require.resolve('@raulbellosom/atlas-web-builder') : resolve('dist/atlas-web-builder.cjs')
const artifact = resolve('.artifacts/releases/0.4.0/registry/raulbellosom-atlas-web-builder-0.4.0.tgz')
const expected = '988739086c54ecb2e50843f5738a66008db38ec528f3d23df5eb20071c73c9c2'
if (!existsSync(artifact)) {
  const response = await fetch('https://registry.npmjs.org/@raulbellosom/atlas-web-builder/-/atlas-web-builder-0.4.0.tgz')
  assert(response.ok); mkdirSync(resolve('.artifacts/releases/0.4.0/registry'), { recursive: true })
  const bytes = Buffer.from(await response.arrayBuffer())
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected)
  writeFileSync(artifact, bytes)
}
assert.equal(createHash('sha256').update(readFileSync(artifact)).digest('hex'), expected)
const scratch = mkdtempSync(join(tmpdir(), 'atlas-ui-compat-'))
const tar = process.platform === 'win32' ? join(process.env.SystemRoot || 'C:/Windows', 'System32/tar.exe') : 'tar'
execFileSync(tar, ['-xzf', artifact, '-C', scratch])
const oldRoot = join(scratch, 'package')
symlinkSync(consumer ? join(consumer, 'node_modules') : resolve('node_modules'), join(oldRoot, 'node_modules'), 'junction')
const oldRequire = createRequire(join(oldRoot, 'package.json'))
const baseline = oldRequire('./dist/atlas-web-builder.cjs'), atlas = require(candidate)
const esm = await import(pathToFileURL(candidate.replace(/\.cjs$/, '.js')))
if (consumer) { assert.equal(atlas.version, '0.5.0'); assert.equal(atlas.getVersion(), '0.5.0') }
assert.deepEqual(Object.keys(atlas).sort(), Object.keys(esm).sort())
assert(Object.keys(baseline).every(key => key in atlas))
assert.equal(Object.keys(atlas).length, 142)
assert.equal(atlas.editorCapabilitiesVersion, 1)
const metadata = api => api.baseBlocks.map(({ type, defaultProps, fields, slots }) => ({ type, defaultProps, fields, slots }))
assert.deepEqual(metadata(atlas), metadata(baseline))
const page = { schemaVersion: 1, id: 'compat', slug: '/', title: 'Compatibilidad', visibility: 'public', updatedAt: '2026-11-13T00:00:00.000Z', regions: { main: { children: ['h'] } }, blocks: { h: { id: 'h', type: 'HeadingBlock', props: { text: 'Contenido preservado', _opacity: .6, customHistorical: { keep: true } } } }, seo: { title: 'SEO preservado' } }
// Both serializers intentionally stamp updatedAt. Compare at the same instant,
// without changing that existing persistence behavior to accommodate the test.
const RealDate = globalThis.Date
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : ['2026-11-13T00:00:00.000Z'])) }
  static now() { return RealDate.parse('2026-11-13T00:00:00.000Z') }
}
try { assert.deepEqual(atlas.parsePage(atlas.serializePage(page)), baseline.parsePage(baseline.serializePage(page))) }
finally { globalThis.Date = RealDate }
const markup = (api, loader) => loader('react-dom/server').renderToStaticMarkup(loader('react').createElement(api.AtlasWebBuilderProvider, { blocks: api.baseBlocks }, loader('react').createElement(api.AtlasWebRenderer, { page })))
assert.equal(markup(atlas, require), markup(baseline, oldRequire))
const result = { version: atlas.version, react: require('react').version, exports: 142, previousExportsPreserved: 140, capabilities: 1, blockMetadataIdentical: true, rendererSsrByteIdentical: true, jsonIdentical: true, stableArtifactSha256: expected }
const output = process.env.ATLAS_COMPAT_OUTPUT || '.artifacts/phase-1/compatibility.json'
mkdirSync(resolve(output, '..'), { recursive: true })
writeFileSync(output, JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
