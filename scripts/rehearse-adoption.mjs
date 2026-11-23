// Rehearses the adoption of a packed Atlas release in the ERP and the Hub BEFORE anything is published.
//   node scripts/rehearse-adoption.mjs enter <tarball>   swap each consumer's Atlas for the packed bytes (symlink swap only)
//   node scripts/rehearse-adoption.mjs leave             restore every consumer exactly as it was
//   node scripts/rehearse-adoption.mjs status            show which Atlas each consumer resolves right now
// Nothing is installed and no lockfile or package.json changes: the consumers' node_modules links are repointed to an overlay that
// contains the extracted tarball plus links to the dependencies the consumers already have, and `leave` restores the original links.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const erp = resolve(root, '..', 'runly'), hub = resolve(root, '..', 'runly-developer-hub')
const overlays = { erp: join(root, '.artifacts', 'rehearsal', 'overlay-erp'), hub: join(root, '.artifacts', 'rehearsal', 'overlay-hub') }, statePath = join(root, '.artifacts', 'rehearsal', 'state.json')
// Each repo gets its own overlay so Atlas shares THAT repo's React (two copies of React break hooks).
const targets = [['erp', join(erp, 'apps/api')], ['erp', join(erp, 'apps/desktop')], ['erp', join(erp, 'packages/website-blocks')], ['hub', hub]]
const consumers = targets.map(([, dir]) => join(dir, 'node_modules', '@raulbellosom', 'atlas-web-builder'))
const isLink = (path) => { try { return lstatSync(path).isSymbolicLink() } catch { return false } }
const link = (target, path) => { mkdirSync(dirname(path), { recursive: true }); symlinkSync(target, path, 'junction') }
const version = (dir) => { try { return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version } catch { return null } }

// pnpm keeps an Atlas dependency next to the installed Atlas package, so resolve from THERE (same React as that repo, same versions).
function dependencyDir(name, repo) {
  const installed = realpathSync(consumers[targets.findIndex(([r]) => r === repo)])
  const from = createRequire(join(installed, 'package.json'))
  try { return dirname(from.resolve(`${name}/package.json`)) } catch { /* packages that hide package.json: walk up from the entry point */ }
  let dir = dirname(from.resolve(name))
  while (dir !== dirname(dir)) { if (existsSync(join(dir, 'package.json')) && JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name === name) return dir; dir = dirname(dir) }
  throw new Error(`Dependency ${name} is not installed next to Atlas in ${repo}`)
}

const [command, tarball] = process.argv.slice(2)
if (command === 'status') {
  for (const path of consumers) console.log(`${path.replace(/\\/g, '/')} -> ${version(path) ?? 'missing'}${isLink(path) ? ` (link: ${readlinkSync(path)})` : ''}`)
} else if (command === 'enter') {
  if (!tarball || !existsSync(tarball)) throw new Error('usage: enter <tarball>')
  if (existsSync(statePath)) throw new Error('A rehearsal is already active: run `leave` first')
  const sha256 = createHash('sha256').update(readFileSync(tarball)).digest('hex')
  const manifest = { version: null }
  const packages = {}
  for (const [repo, overlay] of Object.entries(overlays)) {
    rmSync(overlay, { recursive: true, force: true })
    const packageDir = join(overlay, 'node_modules', '@raulbellosom', 'atlas-web-builder')
    mkdirSync(packageDir, { recursive: true })
    // GNU tar (Git Bash) reads "D:\..." as host:path, so extract with relative names from inside the target directory.
    execFileSync('tar', ['-xzf', relative(packageDir, resolve(tarball)).split('\\').join('/'), '--strip-components=1'], { cwd: packageDir, stdio: 'pipe' })
    const parsed = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
    manifest.version = parsed.version
    for (const name of Object.keys({ ...parsed.dependencies, ...parsed.peerDependencies })) link(dependencyDir(name, repo), join(overlay, 'node_modules', ...name.split('/')))
    packages[repo] = packageDir
  }
  const originals = []
  for (const [index, path] of consumers.entries()) {
    if (!existsSync(path)) throw new Error(`Consumer without Atlas installed: ${path}`)
    originals.push({ path, repo: targets[index][0], target: isLink(path) ? readlinkSync(path) : null, version: version(path) })
    if (!isLink(path)) throw new Error(`Refusing to swap a real directory: ${path}`)
  }
  writeFileSync(statePath, JSON.stringify({ tarball: resolve(tarball), sha256, version: manifest.version, originals }, null, 2))
  for (const { path, repo } of originals) { unlinkSync(path); link(packages[repo], path) }
  console.log(JSON.stringify({ entered: manifest.version, sha256, consumers: originals.length }))
} else if (command === 'leave') {
  if (!existsSync(statePath)) { console.log('No active rehearsal'); process.exit(0) }
  const state = JSON.parse(readFileSync(statePath, 'utf8'))
  for (const { path, target, version: previous } of state.originals) {
    if (isLink(path)) unlinkSync(path)
    link(target, path)
    if (version(path) !== previous) throw new Error(`Restore mismatch at ${path}: expected ${previous}, got ${version(path)}`)
  }
  rmSync(statePath); for (const overlay of Object.values(overlays)) rmSync(overlay, { recursive: true, force: true })
  console.log(JSON.stringify({ restored: state.originals.map((o) => `${o.path.split(/[\\/]/).slice(-5, -3).join('/')}@${o.version}`) }))
} else { console.error('usage: enter <tarball> | leave | status'); process.exit(2) }
