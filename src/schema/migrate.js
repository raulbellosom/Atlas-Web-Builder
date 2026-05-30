/**
 * @file Schema version constants and migration registry.
 *
 * Migrations are pure functions `(doc) => doc` registered in order. When the
 * schema changes we add a new migration and bump CURRENT_SCHEMA_VERSION.
 */

/** Current schema version emitted by this build of the package. */
export const CURRENT_SCHEMA_VERSION = 1

/**
 * Ordered list of migrations. Index 0 migrates v1 -> v2, etc.
 * Each entry: `{ from: number, to: number, migrate: (doc) => doc }`.
 *
 * @type {Array<{ from: number, to: number, migrate: (doc: any) => any }>}
 */
const migrations = []

/**
 * Apply migrations until `doc.schemaVersion === CURRENT_SCHEMA_VERSION`.
 * If the document has no schemaVersion, it is treated as version 1.
 * If the document has a version newer than this build, it is returned as-is
 * and a warning is logged — the host should upgrade the package.
 *
 * @template {{ schemaVersion?: number }} T
 * @param {T} doc
 * @returns {T}
 */
export function migrateContent(doc) {
  if (!doc || typeof doc !== 'object') return doc
  let current = { ...doc }
  if (typeof current.schemaVersion !== 'number') current.schemaVersion = 1

  if (current.schemaVersion > CURRENT_SCHEMA_VERSION) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[atlas-web-builder] document schemaVersion=${current.schemaVersion} is newer than supported ${CURRENT_SCHEMA_VERSION}. Returning as-is.`,
      )
    }
    return current
  }

  for (const step of migrations) {
    if (current.schemaVersion === step.from) {
      current = step.migrate(current)
      current.schemaVersion = step.to
    }
  }
  return current
}
