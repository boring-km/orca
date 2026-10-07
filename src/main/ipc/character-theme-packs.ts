import { app, BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { randomUUID } from 'node:crypto'
import { extname, join } from 'node:path'
import { writeFile, rename, rm } from 'node:fs/promises'
import type { Store } from '../persistence'
import { ThemePackRepository } from '../character-themes/theme-pack-repository'
import { readThemePackFile, writeThemePackArchive } from '../character-themes/theme-pack-archive'
import { decodeThemePackExport } from '../character-themes/theme-pack-export-content'
import {
  loadedThemePack,
  validateThemePackContent,
  type ThemePackContent
} from '../character-themes/theme-pack-content'
import {
  MAX_THEME_ASSET_BYTES,
  themeManifestAssetPaths,
  type ThemePackPreview
} from '../../shared/character-theme-manifest'
import { selectCharacterThemePack } from '../../shared/character-theme-settings'
import { readNodeFileWithinLimit } from '../../shared/node-bounded-file-reader'

export function registerCharacterThemePackHandlers(
  store: Pick<Store, 'getSettings' | 'updateSettings'>
): void {
  const repository = new ThemePackRepository(join(app.getPath('userData'), 'character-themes'))
  const previews = new Map<
    number,
    { token: string; content: ThemePackContent; expiresAt: number }
  >()

  function stage(event: IpcMainInvokeEvent, content: ThemePackContent): ThemePackPreview {
    const token = randomUUID()
    if (!previews.has(event.sender.id)) {
      event.sender.once('destroyed', () => previews.delete(event.sender.id))
    }
    previews.set(event.sender.id, { token, content, expiresAt: Date.now() + 5 * 60_000 })
    return { token, pack: loadedThemePack(content) }
  }

  ipcMain.handle('characterThemes:list', () => repository.list())
  ipcMain.handle('characterThemes:get', async (_event, key: string) =>
    loadedThemePack(await repository.get(key), key)
  )
  ipcMain.handle(
    'characterThemes:previewImport',
    async (event): Promise<ThemePackPreview | null> => {
      const parent = BrowserWindow.fromWebContents(event.sender)
      const options = {
        properties: ['openFile'] as const,
        filters: [{ name: 'Orca 테마팩', extensions: ['zip'] }]
      }
      const result = parent
        ? await dialog.showOpenDialog(parent, { ...options, properties: ['openFile'] })
        : await dialog.showOpenDialog({ ...options, properties: ['openFile'] })
      if (result.canceled || !result.filePaths[0]) {
        return null
      }
      return stage(event, await readThemePackFile(result.filePaths[0]))
    }
  )
  ipcMain.handle('characterThemes:applyImport', async (event, token: string): Promise<void> => {
    const preview = previews.get(event.sender.id)
    if (!preview || preview.token !== token || preview.expiresAt < Date.now()) {
      previews.delete(event.sender.id)
      throw new Error('테마 미리보기가 만료되었습니다. 파일을 다시 선택하세요.')
    }
    const key = await repository.install(preview.content)
    store.updateSettings(
      {
        characterTheme: selectCharacterThemePack(
          store.getSettings().characterTheme,
          key,
          preview.content.manifest
        )
      },
      { notifyListeners: true }
    )
    previews.delete(event.sender.id)
  })
  ipcMain.handle('characterThemes:export', async (event, value: unknown): Promise<boolean> => {
    const content = decodeThemePackExport(value)
    const bytes = await writeThemePackArchive(content)
    const parent = BrowserWindow.fromWebContents(event.sender)
    const options = {
      defaultPath: `${content.manifest.id}.orca-theme.zip`,
      filters: [{ name: 'Orca 테마팩', extensions: ['zip'] }]
    }
    const result = parent
      ? await dialog.showSaveDialog(parent, options)
      : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) {
      return false
    }
    const temporary = `${result.filePath}.${randomUUID()}.tmp`
    try {
      await writeFile(temporary, bytes, { mode: 0o600, flag: 'wx' })
      await rename(temporary, result.filePath)
      return true
    } finally {
      await rm(temporary, { force: true })
    }
  })
  ipcMain.handle(
    'characterThemes:chooseCharacterImage',
    async (
      event,
      args: { pack: unknown; characterId: string }
    ): Promise<ThemePackPreview | null> => {
      const content = decodeThemePackExport(args.pack)
      if (!content.manifest.characters.some((item) => item.id === args.characterId)) {
        throw new Error('선택한 캐릭터가 테마에 없습니다.')
      }
      const parent = BrowserWindow.fromWebContents(event.sender)
      const options = {
        filters: [{ name: '캐릭터 이미지', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }]
      }
      const result = parent
        ? await dialog.showOpenDialog(parent, { ...options, properties: ['openFile'] })
        : await dialog.showOpenDialog({ ...options, properties: ['openFile'] })
      if (result.canceled || !result.filePaths[0]) {
        return null
      }
      const source = result.filePaths[0]
      const { buffer } = await readNodeFileWithinLimit(source, MAX_THEME_ASSET_BYTES, {
        regularFileOnly: true
      })
      const path = `assets/custom-${randomUUID()}.${extname(source).slice(1).toLowerCase()}`
      const manifest = {
        ...content.manifest,
        name: `${content.manifest.name} · 내 이미지`.slice(0, 100),
        characters: content.manifest.characters.map((item) =>
          item.id === args.characterId
            ? { ...item, portrait: { path }, avatar: { path }, expressions: undefined }
            : item
        ),
        sources: [
          ...content.manifest.sources,
          { path, source: '사용자가 선택한 이미지', usage: '개인 제공 이미지' }
        ]
      }
      const references = new Set(themeManifestAssetPaths(manifest))
      manifest.sources = manifest.sources.filter((item) => references.has(item.path))
      content.assets.set(path, buffer)
      const assets = new Map([...content.assets].filter(([assetPath]) => references.has(assetPath)))
      return stage(event, validateThemePackContent(manifest, assets))
    }
  )
}
