import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAppStore } from '@/store'
import { useDocumentDarkTheme } from '@/hooks/use-document-dark-theme'
import {
  normalizeCharacterThemeSettings,
  selectCharacterThemePack,
  type CharacterThemeSettings
} from '../../../../shared/character-theme-settings'
import {
  THEME_COLOR_TOKENS,
  type LoadedThemePack
} from '../../../../shared/character-theme-manifest'
import { builtinThemePack, BUILTIN_THEME_PACKS } from './builtin-theme-packs'
import { CharacterThemeContext } from './character-theme-context'

export function CharacterThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const stored = useAppStore((state) => state.settings?.characterTheme)
  const updateSettings = useAppStore((state) => state.updateSettingsOrThrow)
  const settings = useMemo(() => normalizeCharacterThemeSettings(stored), [stored])
  const [result, setResult] = useState<{
    key: string
    pack?: LoadedThemePack
    error?: string
  } | null>(null)
  const [preview, setPreview] = useState<LoadedThemePack | null>(null)
  const dark = useDocumentDarkTheme()
  const builtin = builtinThemePack(settings.activePackId)
  const currentResult = result?.key === settings.activePackId ? result : null
  const error = builtin ? null : (currentResult?.error ?? null)
  const selected = builtin ?? currentResult?.pack ?? null
  const pack = preview ?? selected ?? BUILTIN_THEME_PACKS[1]
  const character =
    pack.manifest.characters.find((item) => item.id === settings.characterId) ??
    pack.manifest.characters.find((item) => item.id === pack.manifest.defaults.characterId) ??
    pack.manifest.characters[0]

  useEffect(() => {
    if (builtin) {
      return
    }
    let active = true
    const api = window.api.settings.characterThemes
    if (!api) {
      setResult({
        key: settings.activePackId,
        error: '이 앱에서는 저장된 테마팩을 불러올 수 없습니다.'
      })
      return
    }
    void api.get(settings.activePackId).then(
      (next) => {
        if (active) {
          setResult({ key: settings.activePackId, pack: next })
        }
      },
      () => {
        if (active) {
          setResult({
            key: settings.activePackId,
            error: '저장된 테마팩을 불러오지 못해 기본 외관을 표시합니다.'
          })
        }
      }
    )
    return () => {
      active = false
    }
  }, [builtin, settings.activePackId])

  useEffect(() => {
    const root = document.documentElement
    const enabled = settings.enabled || preview !== null
    const values = enabled ? pack.manifest.colors[dark ? 'dark' : 'light'] : {}
    const previous = THEME_COLOR_TOKENS.map((token) => ({
      token,
      value: root.style.getPropertyValue(`--${token}`),
      priority: root.style.getPropertyPriority(`--${token}`)
    }))
    const priorTheme = root.dataset.hunterTheme
    root.dataset.hunterTheme = String(enabled)
    root.dataset.characterThemeIntensity = enabled ? settings.intensity : 'off'
    for (const token of THEME_COLOR_TOKENS) {
      const value = values[token]
      if (value) {
        root.style.setProperty(`--${token}`, value)
      }
    }
    return () => {
      for (const { token, value, priority } of previous) {
        if (value) {
          root.style.setProperty(`--${token}`, value, priority)
        } else {
          root.style.removeProperty(`--${token}`)
        }
      }
      if (priorTheme === undefined) {
        delete root.dataset.hunterTheme
      } else {
        root.dataset.hunterTheme = priorTheme
      }
      delete root.dataset.characterThemeIntensity
    }
  }, [pack, dark, settings.enabled, settings.intensity, preview])

  const update = useCallback(
    async (updates: Partial<CharacterThemeSettings>) => {
      const current = normalizeCharacterThemeSettings(
        useAppStore.getState().settings?.characterTheme
      )
      await updateSettings({
        characterTheme: normalizeCharacterThemeSettings({
          ...current,
          ...updates,
          terminalPalette: pack.manifest.terminal
        })
      })
    },
    [updateSettings, pack.manifest.terminal]
  )
  const selectPack = useCallback(
    async (next: LoadedThemePack) => {
      await updateSettings({
        characterTheme: selectCharacterThemePack(
          useAppStore.getState().settings?.characterTheme,
          next.key,
          next.manifest
        )
      })
      setPreview(null)
    },
    [updateSettings]
  )
  const context = useMemo(
    () => ({
      pack,
      character,
      settings,
      loading: selected === null && error === null,
      error,
      preview,
      setPreview,
      update,
      selectPack
    }),
    [pack, character, settings, selected, error, preview, update, selectPack]
  )

  return <CharacterThemeContext.Provider value={context}>{children}</CharacterThemeContext.Provider>
}
