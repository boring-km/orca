import { describe, expect, it } from 'vitest'
import { lastSuccessfulTurnAt } from './hunter-completion-time'

describe('Hunter completion evidence', () => {
  it('does not claim completion from a legacy done row or an unknown outcome', () => {
    expect(
      lastSuccessfulTurnAt([
        { state: 'done' },
        { state: 'done', mainAgent: { state: 'done', stateStartedAt: 100 } }
      ])
    ).toBeNull()
  })

  it('keeps the last successful completion across failures and cancellation', () => {
    expect(
      lastSuccessfulTurnAt([
        { state: 'done', mainAgent: { state: 'done', outcome: 'failure', stateStartedAt: 300 } },
        { state: 'done', mainAgent: { state: 'done', outcome: 'success', stateStartedAt: 200 } },
        { state: 'done', interrupted: true }
      ])
    ).toBe(200)
  })

  it('does not report restored or session-boundary rows as a new completion', () => {
    const mainAgent = { state: 'done', outcome: 'success', stateStartedAt: 100 } as const
    expect(
      lastSuccessfulTurnAt([
        { state: 'done', mainAgent, restoredUnconfirmed: true },
        { state: 'done', mainAgent, sessionBoundary: true }
      ])
    ).toBeNull()
  })

  it('uses the lead turn clock while children still keep the combined state working', () => {
    expect(
      lastSuccessfulTurnAt([
        { state: 'working', mainAgent: { state: 'done', outcome: 'success', stateStartedAt: 100 } }
      ])
    ).toBe(100)
  })
})
