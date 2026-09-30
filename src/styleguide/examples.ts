// Example student data for the style guide. Not real students, and never
// shown outside /styleguide.

import type { Car, StudentStates } from '../engine'

/** One made-up student part way through Module 1. */
export const exampleStates: StudentStates = {
  R1: { theta: 1.4, attempts: 9 },
  R2: { theta: 0.3, attempts: 6 },
  S1: { theta: -0.9, attempts: 4 },
  S3: { theta: 0.9, attempts: 7 },
  B3: { theta: 0.1, attempts: 2 },
}

/** Share of recent answers right, per C-A-R profile. */
export const exampleCar: Record<string, Partial<Record<Car, number>>> = {
  R1: { C: 0.8, A: 0.9, R: 0.7 },
  R2: { C: 0.6, A: 0.5, R: 0.4 },
  S1: { C: 0.3, A: 0.4, R: 0.2 },
  S3: { C: 0.7, A: 0.8, R: 0.6 },
  B3: { C: 0.5, A: 0.5 },
}

/** The brief's own example of a tutor message that passes the guard. */
export const goodTutorMessage =
  'You took 45 away from 540 once. What happens if you keep taking 45 away until nothing is left?'

/** A tutor message the guard must block. */
export const leakyTutorMessage = 'It will take him twelve weeks.'
