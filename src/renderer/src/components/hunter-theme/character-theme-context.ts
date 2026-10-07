import { createContext, useContext } from 'react'
import type { LoadedThemePack, ThemeCharacter } from '../../../../shared/character-theme-manifest'
import type { CharacterThemeSettings } from '../../../../shared/character-theme-settings'

export type CharacterThemeContextValue = {
  pack: LoadedThemePack
  character: ThemeCharacter
  settings: CharacterThemeSettings
  loading: boolean
  error: string | null
  preview: LoadedThemePack | null
  setPreview: (pack: LoadedThemePack | null) => void
  update: (updates: Partial<CharacterThemeSettings>) => Promise<void>
  selectPack: (pack: LoadedThemePack) => Promise<void>
}

export const CharacterThemeContext = createContext<CharacterThemeContextValue | null>(null)

export function useCharacterTheme(): CharacterThemeContextValue | null {
  return useContext(CharacterThemeContext)
}
