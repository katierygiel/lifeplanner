// XP needed to go from `level` to `level + 1`. Gentle curve: 100, 150, 200, ...
export function xpForNextLevel(level: number): number {
  return 100 + 50 * (level - 1)
}

export type LevelInfo = { level: number; into: number; needed: number; progress: number }

// Levels are always derived from total XP, so they can never go down from a missed day.
export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp))
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level)
    level += 1
  }
  const needed = xpForNextLevel(level)
  return { level, into: remaining, needed, progress: remaining / needed }
}

export type Tier = 'must' | 'flexible' | 'optional' | 'recovery'

export const TIER_XP: Record<Tier, number> = {
  must: 20,
  flexible: 15,
  optional: 10,
  recovery: 10,
}

export const TIER_LABEL: Record<Tier, string> = {
  must: 'Must do',
  flexible: 'Flexible',
  optional: 'Optional',
  recovery: 'Recovery',
}
