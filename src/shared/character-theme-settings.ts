import { z } from 'zod'
import { THEME_INTENSITIES, type CharacterThemeManifest } from './character-theme-manifest'

const packKey = z.string().regex(/^(hunter|neutral|imported-[a-f0-9]{24})$/)
const characterThemeSettingsSchema = z.object({
  enabled: z.boolean().catch(true),
  activePackId: packKey.catch('hunter'),
  characterId: z
    .string()
    .regex(/^[a-z][a-z0-9-]{0,63}$/)
    .catch('gon'),
  intensity: z.enum(THEME_INTENSITIES).catch('soft'),
  selectedPaneKey: z.string().max(200).nullable().catch(null),
  terminalEnabled: z.boolean().catch(false),
  terminalPalette: z
    .object({ dark: z.string().max(100), light: z.string().max(100) })
    .optional()
    .catch(undefined),
  previousPackId: packKey.optional().catch(undefined)
})

export type CharacterThemeSettings = z.infer<typeof characterThemeSettingsSchema>

export function normalizeCharacterThemeSettings(value: unknown): CharacterThemeSettings {
  return characterThemeSettingsSchema.parse(value && typeof value === 'object' ? value : {})
}

export function selectCharacterThemePack(
  value: unknown,
  key: string,
  manifest: CharacterThemeManifest
): CharacterThemeSettings {
  const current = normalizeCharacterThemeSettings(value)
  return normalizeCharacterThemeSettings({
    ...current,
    activePackId: key,
    previousPackId: current.activePackId,
    characterId:
      value !== undefined && manifest.characters.some((item) => item.id === current.characterId)
        ? current.characterId
        : manifest.defaults.characterId,
    intensity: value === undefined ? manifest.defaults.intensity : current.intensity,
    terminalPalette: manifest.terminal
  })
}
