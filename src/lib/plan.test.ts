import { describe, expect, it } from 'vitest'
import { splitForMode } from './plan'
import type { Task } from './types'

const t = (id: string, tier: Task['tier'], status: Task['status'] = 'open'): Task => ({
  id, title: id, notes: null, tier, duration_min: null, planned_date: '2026-10-10', fixed_time: null,
  is_priority: false, status, completed_at: null, sort_order: 0,
})
const tasks = [t('m', 'must'), t('f', 'flexible'), t('o', 'optional'), t('r', 'recovery'), t('od', 'optional', 'done')]
const ids = (xs: Task[]) => xs.map((x) => x.id).sort()

describe('day modes', () => {
  it('full shows everything', () => {
    expect(ids(splitForMode(tasks, 'full').visible)).toEqual(['f', 'm', 'o', 'od', 'r'])
  })
  it('shorter day tucks away optional extras', () => {
    const s = splitForMode(tasks, 'short')
    expect(ids(s.hidden)).toEqual(['o'])
  })
  it('essentials keeps must-dos and recovery, plus anything already done', () => {
    expect(ids(splitForMode(tasks, 'essentials').visible)).toEqual(['m', 'od', 'r'])
  })
  it('busy day offers to move flexible tasks only', () => {
    expect(ids(splitForMode(tasks, 'busy').movable)).toEqual(['f'])
  })
  it('puts finished tasks last', () => {
    const v = splitForMode([t('d', 'must', 'done'), t('x', 'optional')], 'full').visible
    expect(v.map((x) => x.id)).toEqual(['x', 'd'])
  })
})
