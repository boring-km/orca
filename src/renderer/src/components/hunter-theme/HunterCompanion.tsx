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
    <section
      aria-label="캐릭터 테마"
      className="hunter-companion shrink-0 border-t border-worktree-sidebar-border p-3 space-y-3"
      data-character={character.id}
      data-intensity={settings.enabled ? settings.intensity : 'off'}
      data-agent-state={status ?? 'none'}
      data-working-effect={pack.manifest.effects.working}
      data-done-effect={pack.manifest.effects.done}
      data-attention-effect={pack.manifest.effects.attention}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold">{pack.manifest.name}</span>
        <CharacterThemeControls />
      </div>
      <div className="hunter-companion-scene flex items-center gap-3 rounded-md border border-border p-2">
        {settings.enabled || theme.preview ? (
          <ThemeCharacterImage
            key={`${pack.key}-${character.id}`}
            pack={pack}
            character={character}
            kind="portrait"
            expression={
              status === 'done'
                ? 'done'
                : status === 'working' || status === 'monitoring'
                  ? 'working'
                  : status === 'waiting' || status === 'blocked' || status === 'permission'
                    ? 'attention'
                    : 'idle'
            }
          />
        ) : null}
        <div className="min-w-0 space-y-2">
          {thread ? (
            <div className="truncate text-sm font-semibold" title={thread.worktree.path}>
              {basename(thread.worktree.path) || thread.worktree.path}
            </div>
          ) : null}
          <div className="flex items-center gap-1.5 text-xs" role="status">
            {status ? <AgentStateDot state={status} title={null} /> : null}
            <span>{status ? STATUS_LABELS[status] : '현재 탭에 감지된 에이전트가 없습니다'}</span>
          </div>
          {(status === 'working' || status === 'monitoring') && entry ? (
            <div className="text-xs text-muted-foreground tabular-nums">
              작업 경과 {formatCompactDuration(now - (entry.turnStartedAt ?? entry.stateStartedAt))}
            </div>
          ) : null}
          {lastCompletedAt !== null ? (
            <div className="text-xs text-muted-foreground tabular-nums">
              마지막 완료 {characterThemeClockLabel(lastCompletedAt)}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <span>작업 중 {workingCount}</span>
        <span>응답 필요 {attentionCount}</span>
      </div>
    </section>
  )
}
