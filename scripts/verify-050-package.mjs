import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'

const [archive, ...consumers] = process.argv.slice(2).map(value => resolve(value))
assert(archive && consumers.length === 2, 'Usage: node scripts/verify-050-package.mjs TARBALL CONSUMER18 CONSUMER19')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const scratch = mkdtempSync(join(tmpdir(), 'atlas-050-package-'))
const tar = process.platform === 'win32' ? join(process.env.SystemRoot || 'C:/Windows', 'System32/tar.exe') : 'tar'
execFileSync(tar, ['-xzf', archive, '-C', scratch])
const root = join(scratch, 'package'), manifest = JSON.parse(readFileSync(join(root, 'package.json')))
assert.equal(manifest.name, '@raulbellosom/atlas-web-builder')
assert.equal(manifest.version, '0.5.0')
assert.equal(manifest.exports['.'].import, './dist/atlas-web-builder.js')
assert.equal(manifest.exports['.'].require, './dist/atlas-web-builder.cjs')
assert.equal(manifest.exports['./styles'], './dist/style.css')
const files = execFileSync(tar, ['-tzf', archive], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(file => !file.endsWith('/')).map(file => file.replace(/^package\//, '')).sort()
const allowed = /^(package\.json|LICENSE|README\.md|CHANGELOG\.md|dist\/(atlas-web-builder\.(js|cjs)(\.map)?|style\.css)|docs\/contracts\/WEBSITE_EDITOR_CAPABILITIES_V1\.md|docs\/releases\/(0\.3\.5-provenance|0\.4\.0-migration|0\.5\.0-migration)\.md)$/
assert.equal(files.length, 13)
assert(files.every(file => allowed.test(file)), 'Unexpected files in tarball')
for (const file of ['dist/style.css', 'dist/atlas-web-builder.js', 'dist/atlas-web-builder.cjs']) {
  assert.equal(hash(readFileSync(join(root, file))), hash(readFileSync(file)), `Build differs: ${file}`)
}
const css = readFileSync(join(root, 'dist/style.css'), 'utf8')
assert(css.includes('atlas-wb-editor-scope') && css.includes('data-appearance') && css.includes('safe-area-inset-bottom'))
const results = []
for (const consumer of consumers) {
  const require = createRequire(join(consumer, 'package.json'))
  const installed = join(consumer, 'node_modules/@raulbellosom/atlas-web-builder')
  assert(realpathSync(require.resolve('@raulbellosom/atlas-web-builder')).startsWith(realpathSync(consumer)), 'Consumer must use its own installed package')
  for (const file of files) assert.equal(hash(readFileSync(join(installed, file))), hash(readFileSync(join(root, file))), `Installed bytes differ: ${file}`)
  const react = require('react').version
  const output = resolve(`.artifacts/releases/0.5.0/compat-react${react.split('.')[0]}.json`)
  execFileSync(process.execPath, ['scripts/verify-phase1-compatibility.mjs', consumer], { stdio: 'inherit', env: { ...process.env, ATLAS_COMPAT_OUTPUT: output } })
  results.push({ react, ...JSON.parse(readFileSync(output)) })
}
const result = { sourceSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), version: manifest.version, tarballSha256: hash(readFileSync(archive)), files, fileSha256: Object.fromEntries(files.map(file => [file, hash(readFileSync(join(root, file)))])), cssSha256: hash(readFileSync(join(root, 'dist/style.css'))), consumers: results }
writeFileSync('.artifacts/releases/0.5.0/package-verification.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
