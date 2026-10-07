import { useState } from 'react'
import { Fish, Zap, Link, Glasses } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  LoadedThemePack,
  ThemeArea,
  ThemeCharacter
} from '../../../../shared/character-theme-manifest'

const AREA_ICONS = { workspace: Fish, agent: Zap, review: Link, clock: Glasses }

export function ThemeCharacterImage({
  pack,
  character,
  kind,
  area = 'workspace',
  expression
}: {
  pack: LoadedThemePack
  character: ThemeCharacter
  kind: 'portrait' | 'avatar'
  area?: ThemeArea
  expression?: 'working' | 'done' | 'attention' | 'idle'
}): React.JSX.Element {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const image =
    (expression ? character.expressions?.[expression] : undefined) ??
    character[kind] ??
    character.portrait
  const asset = image ? pack.assets[image.path] : undefined
  const Icon = AREA_ICONS[area]
  if (!asset || failedUrl === asset.url) {
    return (
      <Icon
        className={cn('shrink-0', kind === 'portrait' ? 'size-7' : 'size-4')}
        aria-hidden="true"
      />
    )
  }
  const crop = image?.crop ?? { x: 0, y: 0, width: asset.width, height: asset.height }
  return (
    <svg
      viewBox={`0 0 ${crop.width} ${crop.height}`}
      className={cn(
        'shrink-0 overflow-hidden rounded-sm',
        kind === 'portrait' ? 'hunter-companion-portrait' : 'size-5'
      )}
      aria-hidden="true"
      focusable="false"
    >
      {/* Clip the source crop before the outer viewport adds letterboxing. */}
      <svg
        width={crop.width}
        height={crop.height}
        viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
        overflow="hidden"
      >
        <image
          href={asset.url}
          width={asset.width}
          height={asset.height}
          onError={() => setFailedUrl(asset.url)}
        />
      </svg>
    </svg>
  )
}
