import { describe, it, expect } from 'vitest'
import { version } from '../index.js'
import pkg from '../../package.json'

describe('package version', () => {
  it('keeps the exported version constant in sync with package.json', () => {
    expect(version).toBe(pkg.version)
  })
})
