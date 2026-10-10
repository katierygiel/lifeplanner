import { newId } from './store'
import type { Routine } from './types'

const step = (title: string, busy = true, optional = false) => ({
  id: newId(),
  title,
  duration_min: null,
  optional,
  in_busy_version: busy,
  sort_order: 0,
})

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

// Starter routines from the project brief. Every one can be edited or deleted.
export function starterRoutines(): Routine[] {
  return [
    {
      id: newId(),
      title: 'Morning routine',
      time_of_day: 'morning',
      days: EVERY_DAY,
      xp: 20,
      sort_order: 0,
      steps: [
        step('Get out of bed'),
        step('Get ready'),
        step('Eat breakfast'),
        step('Pack lunch and water'),
        step("Check today's schedule"),
        step('Confirm my outfit', false),
        step('Review my main priority'),
      ],
    },
    {
      id: newId(),
      title: 'Evening reset',
      time_of_day: 'evening',
      days: EVERY_DAY,
      xp: 20,
      sort_order: 1,
      steps: [
        step("Prepare tomorrow's outfit"),
        step('Pack my work or gym bag'),
        step('Prepare lunch', true, true),
        step("Review tomorrow's schedule"),
        step('Personal care'),
        step('Put away clothes', false),
        step('Set up for the morning', false),
      ],
    },
    {
      id: newId(),
      title: 'Sunday reset',
      time_of_day: 'weekly',
      days: [0],
      xp: 30,
      sort_order: 2,
      steps: [
        step('Look back at last week'),
        step("Set this week's work hours and field nights"),
        step('Plan workouts for the week'),
        step('Plan outfits for the week', false),
        step('Make a grocery list', false),
        step("Pick next week's main priority"),
      ],
    },
  ]
}
