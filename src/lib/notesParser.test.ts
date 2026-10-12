import { describe, expect, it } from 'vitest'
import { parseWorkoutNotes } from './notesParser'

const katie = `rope tri pull down 3 x 8 20 lbs
face pulls 3 x 10 20 lbs
seated row machine? like it was a machine not like a pulley dystem my chest was on a pad 1 x 10 30 lbs 2x 10 40lbs
shoulder press 3x8 17.5lbs`

describe('notes parser', () => {
  const r = parseWorkoutNotes(katie)
  it('finds each exercise', () => {
    expect(r.exercises.map((e) => e.name)).toEqual(['Rope tri pull down', 'Face pulls', 'Seated row machine', 'Shoulder press'])
  })
  it('expands sets x reps with weight', () => {
    expect(r.exercises[0].sets).toEqual([{ reps: 8, weight: 20 }, { reps: 8, weight: 20 }, { reps: 8, weight: 20 }])
    expect(r.exercises[3].sets).toEqual(Array(3).fill({ reps: 8, weight: 17.5 }))
  })
  it('handles mixed groups on one line and keeps the side note', () => {
    const row = r.exercises[2]
    expect(row.sets).toEqual([{ reps: 10, weight: 30 }, { reps: 10, weight: 40 }, { reps: 10, weight: 40 }])
    expect(row.notes).toBe('like it was a machine not like a pulley dystem my chest was on a pad')
  })
  it('handles other common ways of writing it', () => {
    const x = parseWorkoutNotes(`Upper body
- pull-ups 3 sets of 5
lat pulldown 3x12 @ 70
plank 3 x 45
goblet squat 4x10 20kg`)
    expect(x.title).toBe('Upper body')
    expect(x.exercises[0]).toMatchObject({ name: 'Pull-ups', sets: Array(3).fill({ reps: 5, weight: null }) })
    expect(x.exercises[1].sets[0]).toEqual({ reps: 12, weight: 70 })
    expect(x.exercises[3].sets[0].weight).toBe(44)
  })
  it('keeps lines it cannot read', () => {
    expect(parseWorkoutNotes('felt great today\nrows 3x10 50').leftovers).toEqual(['felt great today'])
  })
})
