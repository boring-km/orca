import { randomUUID } from 'node:crypto'
import { lstat, mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  characterThemeManifestSchema,
  themeManifestAssetPaths,
  MAX_THEME_MANIFEST_BYTES,
  MAX_THEME_ASSET_BYTES,
  MAX_THEME_PACK_BYTES,
  type ThemePackSummary
} from '../../shared/character-theme-manifest'
import { readNodeFileWithinLimit } from '../../shared/node-bounded-file-reader'
import {
  themePackStorageKey,
  validateThemePackContent,
  type ThemePackContent
} from './theme-pack-content'

const KEY_PATTERN = /^imported-[a-f0-9]{24}$/
const MAX_INSTALLED_THEME_PACKS = 32

export class ThemePackRepository {
  private installTail: Promise<unknown> = Promise.resolve()
  constructor(private readonly root: string) {}

  private directory(key: string): string {
    if (!KEY_PATTERN.test(key)) {
      throw new Error('테마팩 ID가 올바르지 않습니다.')
    }
    return join(this.root, key)
  }

  private async readManifest(key: string): Promise<ThemePackSummary> {
    const directory = this.directory(key)
    const directoryStat = await lstat(directory)
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
      throw new Error('테마팩 디렉터리가 올바르지 않습니다.')
    }
    const manifestPath = join(directory, 'manifest.json')
    if (!(await lstat(manifestPath)).isFile()) {
      throw new Error('테마 manifest가 일반 파일이 아닙니다.')
    }
    const { buffer } = await readNodeFileWithinLimit(manifestPath, MAX_THEME_MANIFEST_BYTES, {
      regularFileOnly: true
    })
    const raw: unknown = JSON.parse(buffer.toString('utf8'))
    return { key, manifest: characterThemeManifestSchema.parse(raw) }
  }

  async list(): Promise<ThemePackSummary[]> {
    await mkdir(this.root, { recursive: true, mode: 0o700 })
    const entries = await readdir(this.root, { withFileTypes: true })
    const results: ThemePackSummary[] = []
    for (const entry of entries
      .filter((item) => item.isDirectory() && KEY_PATTERN.test(item.name))
      .slice(0, MAX_INSTALLED_THEME_PACKS)) {
      try {
        results.push(await this.readManifest(entry.name))
      } catch {
        // A damaged pack must not hide the remaining installed themes.
      }
    }
    return results
  }

  async get(key: string): Promise<ThemePackContent> {
    const { manifest } = await this.readManifest(key)
    const assets = new Map<string, Buffer>()
    let totalBytes = 0
    for (const path of themeManifestAssetPaths(manifest)) {
      const assetPath = join(this.directory(key), ...path.split('/'))
      if (
        !(await lstat(assetPath)).isFile() ||
        !(await lstat(join(this.directory(key), 'assets'))).isDirectory()
      ) {
        throw new Error('테마 이미지가 일반 파일이 아닙니다.')
      }
      const { buffer } = await readNodeFileWithinLimit(assetPath, MAX_THEME_ASSET_BYTES, {
        regularFileOnly: true
      })
      totalBytes += buffer.length
      if (totalBytes > MAX_THEME_PACK_BYTES) {
        throw new Error('저장된 테마의 허용 용량을 초과했습니다.')
      }
      assets.set(path, buffer)
    }
    const content = validateThemePackContent(manifest, assets)
    if (themePackStorageKey(content) !== key) {
      throw new Error('저장된 테마팩이 변경되었거나 손상되었습니다.')
    }
    return content
  }

  install(value: ThemePackContent): Promise<string> {
    const task = this.installTail.then(() => this.installContent(value))
    this.installTail = task.catch(() => undefined)
    return task
  }

  private async installContent(value: ThemePackContent): Promise<string> {
    const content = validateThemePackContent(value.manifest, value.assets)
    const key = themePackStorageKey(content)
    const existing = await this.list()
    if (existing.some((item) => item.key === key)) {
      await this.get(key)
      return key
    }
    if (existing.length >= MAX_INSTALLED_THEME_PACKS) {
      throw new Error('저장할 수 있는 테마팩 수를 초과했습니다.')
    }
    const staging = join(this.root, `.pending-${randomUUID()}`)
    await mkdir(join(staging, 'assets'), { recursive: true, mode: 0o700 })
    try {
      await writeFile(join(staging, 'manifest.json'), JSON.stringify(content.manifest), {
        mode: 0o600
      })
      for (const [path, buffer] of content.assets) {
        await writeFile(join(staging, ...path.split('/')), buffer, { mode: 0o600 })
      }
      await rename(staging, this.directory(key))
      return key
    } finally {
      await rm(staging, { recursive: true, force: true })
    }
  }
}
