import type { ThemeArea } from '../../../../shared/character-theme-manifest'
import { useCharacterTheme } from './character-theme-context'
import { ThemeCharacterImage } from './ThemeCharacterImage'

export function CharacterThemeMark({ area }: { area: ThemeArea }): React.JSX.Element | null {
  const theme = useCharacterTheme()
  if (!theme || (!theme.settings.enabled && !theme.preview)) {
    return null
  }
  const character = theme.pack.manifest.characters.find(
    (item) => item.id === theme.pack.manifest.areas[area]
  )
  if (!character) {
    return null
  }
  return (
    <span
      className="hunter-theme-mark inline-flex shrink-0 items-center"
      data-area={area}
      aria-hidden="true"
    >
      <ThemeCharacterImage
        key={`${theme.pack.key}-${character.id}`}
        pack={theme.pack}
        character={character}
        kind="avatar"
        area={area}
      />
    </span>
  )
}
