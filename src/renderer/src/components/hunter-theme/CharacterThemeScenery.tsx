import { Star } from 'lucide-react'
import type { ThemeArea } from '../../../../shared/character-theme-manifest'
import { useCharacterTheme } from './character-theme-context'
import { ThemeCharacterImage } from './ThemeCharacterImage'

export function CharacterThemeScenery({ area }: { area: ThemeArea }): React.JSX.Element | null {
  const theme = useCharacterTheme()
  if (!theme || (!theme.settings.enabled && !theme.preview) || theme.settings.intensity === 'off') {
    return null
  }
  const scenery = theme.pack.manifest.scenery?.[area]
  const character = theme.pack.manifest.characters.find(
    (item) => item.id === theme.pack.manifest.areas[area]
  )
  if (!scenery || !character) {
    return null
  }
  return (
    <div
      className="character-theme-scenery pointer-events-none absolute inset-0 overflow-hidden"
      data-area={area}
      data-character={character.id}
      data-motif={scenery.motif}
      data-intensity={theme.settings.intensity}
      aria-hidden="true"
    >
      <div className="character-theme-scenery-pattern absolute inset-0">
        {scenery.motif === 'stars'
          ? [0, 1, 2, 3].map((star) => (
              <Star key={star} className="character-theme-scenery-star absolute size-7" />
            ))
          : null}
      </div>
      <div className="character-theme-scenery-emblem absolute" />
      <ThemeCharacterImage
        key={`${theme.pack.key}-${character.id}`}
        pack={theme.pack}
        character={character}
        kind="portrait"
        area={area}
        className="character-theme-scenery-portrait absolute"
      />
    </div>
  )
}
