import { useNow } from '@/hooks/use-now'
import { useCharacterTheme } from './character-theme-context'
import { CharacterThemeMark } from './CharacterThemeMark'
import { characterThemeClockLabel } from './character-theme-clock'

export function CharacterThemeClock(): React.JSX.Element | null {
  const theme = useCharacterTheme()
  const now = useNow(1000, Boolean(theme && (theme.settings.enabled || theme.preview)))
  if (!theme || (!theme.settings.enabled && !theme.preview)) {
    return null
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 tabular-nums">
      <CharacterThemeMark area="clock" />
      <time dateTime={new Date(now).toISOString()}>{characterThemeClockLabel(now)}</time>
    </span>
  )
}
