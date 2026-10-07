import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import type {
  ThemePackPreview,
  ThemePackSummary
} from '../../../../shared/character-theme-manifest'
import { builtinThemePack } from './builtin-theme-packs'
import { useCharacterTheme } from './character-theme-context'

export function useCharacterThemeActions() {
  const theme = useCharacterTheme()
  const [catalog, setCatalog] = useState<ThemePackSummary[]>([])
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ThemePackPreview | null>(null)
  const fetchSettings = useAppStore((state) => state.fetchSettings)
  const api = window.api.settings.characterThemes
  const setPackPreview = theme?.setPreview
  useEffect(() => () => setPackPreview?.(null), [setPackPreview])

  useEffect(() => {
    let active = true
    if (api) {
      void api.list().then(
        (packs) => {
          if (active) {
            setCatalog(packs)
          }
        },
        () => {
          if (active) {
            setError('저장된 테마 목록을 불러오지 못했습니다.')
          }
        }
      )
    }
    return () => {
      active = false
    }
  }, [api])

  async function run(action: () => Promise<void>): Promise<void> {
    if (pendingRef.current) {
      return
    }
    pendingRef.current = true
    setPending(true)
    setError(null)
    try {
      await action()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '테마 작업을 완료하지 못했습니다.')
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  async function selectPack(key: string): Promise<void> {
    const selected = builtinThemePack(key) ?? (await api?.get(key))
    if (!selected || !theme) {
      throw new Error('테마팩을 불러올 수 없습니다.')
    }
    await theme.selectPack(selected)
  }

  function showPreview(next: ThemePackPreview | null): void {
    if (!next) {
      return
    }
    setPreview(next)
    theme?.setPreview(next.pack)
  }

  function cancelPreview(): void {
    setPreview(null)
    setError(null)
    theme?.setPreview(null)
  }

  async function applyPreview(): Promise<void> {
    if (!api || !preview) {
      return
    }
    await api.applyImport(preview.token)
    await fetchSettings()
    cancelPreview()
    setCatalog(await api.list())
  }
  return {
    theme,
    api,
    catalog,
    pending,
    error,
    preview,
    run,
    selectPack,
    showPreview,
    cancelPreview,
    applyPreview
  }
}
