import { describe, expect, it } from 'vitest'
import { HUNTER_THEME_MANIFEST, NEUTRAL_THEME_MANIFEST } from './builtin-character-themes'
import { characterThemeManifestSchema, themeManifestAssetPaths } from './character-theme-manifest'
import {
  normalizeCharacterThemeSettings,
  selectCharacterThemePack
} from './character-theme-settings'
import { selectTerminalTheme } from './terminal-theme-selection'

const packKey = 'imported-0123456789abcdef01234567'

describe('character theme manifests and local preferences', () => {
  it('accepts both built-in packs and deduplicates expression images', () => {
    expect(characterThemeManifestSchema.parse(HUNTER_THEME_MANIFEST)).toEqual(HUNTER_THEME_MANIFEST)
    expect(characterThemeManifestSchema.parse(NEUTRAL_THEME_MANIFEST)).toEqual(
      NEUTRAL_THEME_MANIFEST
    )
    expect(themeManifestAssetPaths(HUNTER_THEME_MANIFEST)).toHaveLength(4)
  })

  it.each([
    { formatVersion: 2 },
    { minimumCustomAppVersion: 2 },
    { apiKey: 'private' },
    { characters: [...NEUTRAL_THEME_MANIFEST.characters, ...NEUTRAL_THEME_MANIFEST.characters] },
    { areas: { ...NEUTRAL_THEME_MANIFEST.areas, clock: 'missing' } },
    { colors: { light: {}, dark: { background: 'url(https://example.com)' } } },
    { colors: { light: {}, dark: { border: 'var(--border)' } } },
    { characters: [{ id: 'assistant', name: 'Assistant', portrait: { path: '../private.png' } }] },
    { characters: [{ id: 'assistant', name: 'Assistant', avatar: { path: 'assets/missing.png' } }] }
  ])('rejects incompatible or unsafe manifest fields: %j', (updates) => {
    expect(
      characterThemeManifestSchema.safeParse({ ...NEUTRAL_THEME_MANIFEST, ...updates }).success
    ).toBe(false)
  })

  it('uses pack defaults on a new profile while preserving existing local choices', () => {
    const manifest = {
      ...HUNTER_THEME_MANIFEST,
      defaults: { characterId: 'killua', intensity: 'full' as const }
    }
    const fresh = selectCharacterThemePack(undefined, packKey, manifest)
    expect(fresh).toMatchObject({ activePackId: packKey, characterId: 'killua', intensity: 'full' })
    const local = normalizeCharacterThemeSettings({
      characterId: 'leorio',
      intensity: 'off',
      selectedPaneKey: 'remote-pane'
    })
    expect(selectCharacterThemePack(local, packKey, manifest)).toMatchObject({
      characterId: 'leorio',
      intensity: 'off',
      selectedPaneKey: 'remote-pane'
    })
    expect(selectCharacterThemePack(local, 'neutral', NEUTRAL_THEME_MANIFEST)).toMatchObject({
      characterId: 'assistant',
      intensity: 'off',
      previousPackId: 'hunter'
    })
  })

  it('applies terminal colors only after opt-in and restores the personal selection', () => {
    const personal = {
      theme: 'dark' as const,
      terminalThemeDark: 'Tokyo Night',
      terminalThemeLight: 'Builtin Tango Light',
      terminalUseSeparateLightTheme: true
    }
    const characterTheme = selectCharacterThemePack(undefined, 'hunter', HUNTER_THEME_MANIFEST)
    expect(selectTerminalTheme({ ...personal, characterTheme }, true).themeName).toBe('Tokyo Night')
    expect(
      selectTerminalTheme(
        { ...personal, characterTheme: { ...characterTheme, terminalEnabled: true } },
        true
      ).themeName
    ).toBe('Everforest Dark')
    expect(
      selectTerminalTheme(
        {
          ...personal,
          theme: 'light',
          characterTheme: { ...characterTheme, terminalEnabled: true }
        },
        true
      ).themeName
    ).toBe('Everforest Light')
    expect(
      selectTerminalTheme(
        {
          ...personal,
          characterTheme: { ...characterTheme, terminalEnabled: true, enabled: false }
        },
        true
      ).themeName
    ).toBe('Tokyo Night')
    expect(
      selectTerminalTheme(
        {
          ...personal,
          characterTheme: {
            ...characterTheme,
            terminalEnabled: true,
            terminalPalette: { dark: 'missing', light: 'missing' }
          }
        },
        true
      ).themeName
    ).toBe('Tokyo Night')
  })
})
