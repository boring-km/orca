import { agentMainAgentVerdict } from '../../../../shared/agent-main-agent-verdict'
import type { AgentStatusEntry } from '../../../../shared/agent-status-types'

type CompletionEvidence = Pick<
  AgentStatusEntry,
  'state' | 'mainAgent' | 'interrupted' | 'sessionBoundary' | 'restoredUnconfirmed'
>

export function lastSuccessfulTurnAt(entries: readonly CompletionEvidence[]): number | null {
  let latest: number | null = null
  for (const entry of entries) {
    if (
      entry.sessionBoundary ||
      entry.restoredUnconfirmed ||
      agentMainAgentVerdict(entry) !== 'success'
    ) {
      continue
    }
    const timestamp = entry.mainAgent?.stateStartedAt
    if (timestamp !== undefined && Number.isFinite(timestamp)) {
      latest = Math.max(latest ?? timestamp, timestamp)
    }
  }
  return latest
}
