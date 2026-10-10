import { describe, expect, it } from 'vitest'
import { levelFromXp, xpForNextLevel } from './xp'

describe('levels', () => {
  it('starts at level 1 with no XP', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, needed: 100, progress: 0 })
  })
  it('levels up exactly at the threshold', () => {
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(100 + 150).level).toBe(3)
  })
  it('reports progress within the current level', () => {
    const info = levelFromXp(100 + 75)
    expect(info).toMatchObject({ level: 2, into: 75, needed: 150 })
    expect(info.progress).toBeCloseTo(0.5)
  })
  it('never goes below level 1 for odd input', () => {
    expect(levelFromXp(-50).level).toBe(1)
  })
  it('uses a gentle curve', () => {
    expect([1, 2, 3, 4].map(xpForNextLevel)).toEqual([100, 150, 200, 250])
  })
})
