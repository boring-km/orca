import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getDefaultSettings } from '../../shared/constants'
import { NEUTRAL_THEME_MANIFEST } from '../../shared/builtin-character-themes'
import { normalizeCharacterThemeSettings } from '../../shared/character-theme-settings'
import { writeThemePackArchive, readThemePackArchive } from '../character-themes/theme-pack-archive'
import { registerCharacterThemePackHandlers } from './character-theme-packs'

type TestEvent = { sender: { id: number; once: ReturnType<typeof vi.fn> } }
const mocks = vi.hoisted(() => ({
  handlers: new Map<string, (event: TestEvent, value?: unknown) => Promise<unknown>>(),
  getPath: vi.fn(),
  open: vi.fn(),
  save: vi.fn()
}))
vi.mock('electron', () => ({
  app: { getPath: mocks.getPath },
  BrowserWindow: { fromWebContents: () => null },
  dialog: { showOpenDialog: mocks.open, showSaveDialog: mocks.save },
  ipcMain: {
    handle: (channel: string, handler: (event: TestEvent, value?: unknown) => Promise<unknown>) =>
      mocks.handlers.set(channel, handler)
  }
}))
let directory: string
const settings = () => ({
  ...getDefaultSettings('/private-project'),
  characterTheme: normalizeCharacterThemeSettings({ intensity: 'off' })
})
const store = { getSettings: vi.fn(settings), updateSettings: vi.fn() }
const event = (id = 1): TestEvent => ({ sender: { id, once: vi.fn() } })
async function invoke(channel: string, sender: TestEvent, value?: unknown): Promise<unknown> {
  const handler = mocks.handlers.get(`characterThemes:${channel}`)
  if (!handler) {
    throw new Error('Missing handler')
  }
  return handler(sender, value)
}
function previewToken(value: unknown): string {
  if (
    !value ||
    typeof value !== 'object' ||
    !('token' in value) ||
    typeof value.token !== 'string'
  ) {
    throw new Error('Missing preview')
  }
  return value.token
}
beforeEach(async () => {
  vi.clearAllMocks()
  mocks.handlers.clear()
  directory = await mkdtemp(join(tmpdir(), 'orca-theme-ipc-'))
  mocks.getPath.mockReturnValue(directory)
  registerCharacterThemePackHandlers(store)
})
afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})
async function prepareImport() {
  const source = join(directory, 'input.zip')
  await writeFile(
    source,
    await writeThemePackArchive({ manifest: NEUTRAL_THEME_MANIFEST, assets: new Map() })
  )
  mocks.open.mockResolvedValue({ canceled: false, filePaths: [source] })
  return source
}

describe('character theme local import and export', () => {
  it('does not install or change settings until the owning renderer applies its preview', async () => {
    await prepareImport()
    const sender = event()
    const preview = await invoke('previewImport', sender)
    expect(store.updateSettings).not.toHaveBeenCalled()
    expect(await readdir(directory)).toEqual(['input.zip'])
    const token = previewToken(preview)
    await expect(invoke('applyImport', event(2), token)).rejects.toThrow('만료')
    await invoke('applyImport', sender, token)
    expect(store.updateSettings).toHaveBeenCalledWith(
      {
        characterTheme: expect.objectContaining({
          intensity: 'off',
          characterId: 'assistant',
          activePackId: expect.stringMatching(/^imported-/)
        })
      },
      { notifyListeners: true }
    )
    await expect(invoke('applyImport', sender, token)).rejects.toThrow('만료')
  })

  it('leaves settings unchanged when a file is invalid or selection is canceled', async () => {
    const source = await prepareImport()
    await writeFile(source, 'invalid ZIP')
    await expect(invoke('previewImport', event())).rejects.toThrow()
    mocks.open.mockResolvedValue({ canceled: true, filePaths: [] })
    expect(await invoke('previewImport', event())).toBeNull()
    expect(store.updateSettings).not.toHaveBeenCalled()
  })

  it('exports only manifest and referenced images without writing profile settings', async () => {
    const destination = join(directory, 'output.orca-theme.zip')
    mocks.save.mockResolvedValue({ canceled: false, filePath: destination })
    expect(await invoke('export', event(), { manifest: NEUTRAL_THEME_MANIFEST, assets: {} })).toBe(
      true
    )
    const pack = await readThemePackArchive(await readFile(destination))
    expect(pack.manifest).toEqual(NEUTRAL_THEME_MANIFEST)
    expect(JSON.stringify(pack)).not.toContain('/private-project')
    expect(store.updateSettings).not.toHaveBeenCalled()
    expect(await readdir(directory)).toEqual(['output.orca-theme.zip'])
  })

  it('stages a personal image without retaining its absolute source path', async () => {
    const imagePath = join(directory, 'personal.png')
    await writeFile(
      imagePath,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
        'base64'
      )
    )
    mocks.open.mockResolvedValue({ canceled: false, filePaths: [imagePath] })
    const preview = await invoke('chooseCharacterImage', event(), {
      pack: { manifest: NEUTRAL_THEME_MANIFEST, assets: {} },
      characterId: 'assistant'
    })
    expect(previewToken(preview)).toBeTruthy()
    expect(JSON.stringify(preview)).not.toContain(imagePath)
    expect(JSON.stringify(preview)).toContain('assets/custom-')
    expect(store.updateSettings).not.toHaveBeenCalled()
  })
})
