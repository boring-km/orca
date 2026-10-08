import { useAppStore } from '@/store'
import { resolveAutoAckTabTargets } from '@/hooks/agent-auto-ack-targets'
import { surfaceForAutoAckTarget } from '@/hooks/agent-auto-ack-surfaces'
import { AgentStateDot, type AgentDotState } from '@/components/AgentStateDot'
import { useAgentPaneThreads } from '@/components/activity/use-agent-pane-threads'
import { activityThreadStatusId } from '@/components/activity/activity-thread-presentation'
import { useNow } from '@/hooks/use-now'
import { formatCompactDuration } from '@/lib/agent-row-decay-state'
import { basename } from '@/lib/path'
import { lastSuccessfulTurnAt } from './hunter-completion-time'
import { useCharacterTheme } from './character-theme-context'
import { CharacterThemeControls } from './CharacterThemeControls'
import { ThemeCharacterImage } from './ThemeCharacterImage'
import { characterThemeClockLabel } from './character-theme-clock'

const STATUS_LABELS: Record<AgentDotState, string> = {
  working: '작업 중',
  monitoring: '백그라운드 작업 확인 중',
  blocked: '응답 필요',
  waiting: '입력 대기',
  permission: '승인 필요',
  done: '완료',
  idle: '대기',
  interrupted: '중단됨',
  failed: '실패',
  unverifiable: '확인 불가',
  unconfirmed: '결과 확인 불가'
}

export default function HunterCompanion(): React.JSX.Element | null {
  const theme = useCharacterTheme()
  const now = useNow(1000)
  const selectedPaneKey = useAppStore((state) => {
    const target = resolveAutoAckTabTargets(state)[0]
    return target
      ? surfaceForAutoAckTarget(state, target).resolveViewedSubjectKey(target.tabId)
      : null
  })
  const { allThreads } = useAgentPaneThreads({
    query: '',
    readFilter: 'all',
    groupBy: 'none',
    selectedPaneKey
  })
  if (!theme) {
    return null
  }
  const { pack, character, settings } = theme
  const thread = allThreads.find((item) => item.paneKey === selectedPaneKey)
  const status = thread ? activityThreadStatusId(thread) : null
  const entry = thread?.currentAgentEntry ?? thread?.paneEntry ?? thread?.latestEvent?.entry
  const lastCompletedAt = lastSuccessfulTurnAt([
    ...(entry ? [entry] : []),
    ...(thread?.events.map((event) => event.entry) ?? [])
  ])
  const workingCount = allThreads.filter((item) =>
    ['working', 'monitoring'].includes(activityThreadStatusId(item))
  ).length
  const attentionCount = allThreads.filter((item) =>
    ['blocked', 'waiting', 'permission'].includes(activityThreadStatusId(item))
  ).length

  return (
    <CharacterThemeControls>
      <button
        type="button"
        aria-label="작업 상태 · 꾸미기 설정 열기"
        className="hunter-companion w-full shrink-0 border-t border-worktree-sidebar-border p-3 space-y-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-character={character.id}
        data-intensity={settings.enabled ? settings.intensity : 'off'}
        data-agent-state={status ?? 'none'}
        data-working-effect={pack.manifest.effects.working}
        data-done-effect={pack.manifest.effects.done}
        data-attention-effect={pack.manifest.effects.attention}
      >
        <span className="hunter-companion-scene flex items-center justify-center gap-3 rounded-md border border-border p-3">
          {settings.enabled || theme.preview ? (
            <ThemeCharacterImage
              key={`${pack.key}-${character.id}`}
              pack={pack}
              character={character}
              kind="portrait"
            />
          ) : null}
          <span className="block min-w-0 space-y-2">
            {thread ? (
              <span className="block truncate text-sm font-semibold" title={thread.worktree.path}>
                {basename(thread.worktree.path) || thread.worktree.path}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5 text-xs" role="status">
              {status ? <AgentStateDot state={status} title={null} /> : null}
              <span>{status ? STATUS_LABELS[status] : '현재 탭에 감지된 에이전트가 없습니다'}</span>
            </span>
            {(status === 'working' || status === 'monitoring') && entry ? (
              <span className="block text-xs text-muted-foreground tabular-nums">
                작업 경과{' '}
                {formatCompactDuration(now - (entry.turnStartedAt ?? entry.stateStartedAt))}
              </span>
            ) : null}
            {lastCompletedAt !== null ? (
              <span className="block text-xs text-muted-foreground tabular-nums">
                마지막 완료 {characterThemeClockLabel(lastCompletedAt)}
              </span>
            ) : null}
          </span>
        </span>
        <span className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
          <span>작업 중 {workingCount}</span>
          <span>응답 필요 {attentionCount}</span>
        </span>
      </button>
    </CharacterThemeControls>
  )
}
