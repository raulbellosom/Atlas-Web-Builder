import { describe, it, expect } from 'vitest'
import { version, getVersion } from '../index.js'

describe('package smoke', () => {
  it('exports a semver-shaped version string', () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('getVersion() returns the same value', () => {
    expect(getVersion()).toBe(version)
  })
})
