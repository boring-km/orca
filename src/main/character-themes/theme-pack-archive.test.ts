import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ZipFile } from 'yazl'
import {
  HUNTER_THEME_MANIFEST,
  NEUTRAL_THEME_MANIFEST
} from '../../shared/builtin-character-themes'
import { MAX_THEME_ASSET_BYTES } from '../../shared/character-theme-manifest'
import {
  normalizeCharacterThemeSettings,
  selectCharacterThemePack
} from '../../shared/character-theme-settings'
import { readThemePackArchive, writeThemePackArchive } from './theme-pack-archive'
import { validateThemePackContent } from './theme-pack-content'
import { decodeThemePackExport } from './theme-pack-export-content'
import { ThemePackRepository } from './theme-pack-repository'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
  'base64'
)
const manifest = {
  ...NEUTRAL_THEME_MANIFEST,
  characters: [{ id: 'assistant', name: 'Assistant', portrait: { path: 'assets/portrait.png' } }],
  sources: [{ path: 'assets/portrait.png', source: 'Personal drawing', usage: 'Shareable' }]
}
const content = () => validateThemePackContent(manifest, new Map([['assets/portrait.png', png]]))
const directories: string[] = []
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})
async function profile() {
  const directory = await mkdtemp(join(tmpdir(), 'orca-theme-test-'))
  directories.push(directory)
  return directory
}
async function archive(files: { path: string; bytes: Buffer; mode?: number }[]) {
  const zip = new ZipFile()
  const result = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    zip.outputStream.on('data', (chunk: Buffer) => chunks.push(chunk))
    zip.outputStream.on('error', reject)
    zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)))
  })
  for (const file of files) {
    zip.addBuffer(file.bytes, file.path, { mode: file.mode, compress: false })
  }
  zip.end()
  return result
}
const validFiles = () => [
  { path: 'manifest.json', bytes: Buffer.from(JSON.stringify(manifest)) },
  { path: 'assets/portrait.png', bytes: png }
]

describe('portable character theme packs', () => {
  it('validates bundled Hunter sheets including all expression crop bounds', async () => {
    const assets = new Map<string, Buffer>()
    for (const source of HUNTER_THEME_MANIFEST.sources) {
      assets.set(
        source.path,
        await readFile(
          join(
            process.cwd(),
            'src',
            'renderer',
            'src',
            'assets',
            'hunter-reference',
            source.path.slice('assets/'.length)
          )
        )
      )
    }
    const hunter = validateThemePackContent(HUNTER_THEME_MANIFEST, assets)
    expect(await readThemePackArchive(await writeThemePackArchive(hunter))).toEqual(hunter)
  })

  it('exports and restores theme assets into a fresh profile without exporting local choices', async () => {
    const root = await profile()
    const source = new ThemePackRepository(join(root, 'source'))
    const key = await source.install(content())
    const bytes = await writeThemePackArchive(await source.get(key))
    const destination = new ThemePackRepository(join(root, 'destination'))
    const imported = await readThemePackArchive(bytes)
    expect(await destination.install(imported)).toBe(key)
    expect(await new ThemePackRepository(join(root, 'destination')).get(key)).toEqual(content())
    expect(selectCharacterThemePack(undefined, key, imported.manifest).characterId).toBe(
      'assistant'
    )
    const local = normalizeCharacterThemeSettings({
      intensity: 'off',
      selectedPaneKey: 'private-pane'
    })
    expect(selectCharacterThemePack(local, key, imported.manifest)).toMatchObject({
      intensity: 'off',
      selectedPaneKey: 'private-pane'
    })
    expect(JSON.stringify(imported.manifest)).not.toContain('private-pane')
  })

  it('serializes duplicate installs and leaves no staging directories', async () => {
    const root = await profile()
    const repository = new ThemePackRepository(root)
    const keys = await Promise.all([repository.install(content()), repository.install(content())])
    expect(keys[0]).toBe(keys[1])
    expect(await readdir(root)).toEqual([keys[0]])
  })

  it('detects stored content changes and refuses symlink images', async () => {
    const root = await profile()
    const repository = new ThemePackRepository(root)
    const key = await repository.install(content())
    const image = join(root, key, 'assets', 'portrait.png')
    const changed = Buffer.from(png)
    changed[changed.length - 1] ^= 1
    await writeFile(image, changed)
    await expect(repository.get(key)).rejects.toThrow('손상')
    await rm(image)
    const outside = join(root, 'outside.png')
    await writeFile(outside, png)
    await symlink(outside, image)
    await expect(repository.get(key)).rejects.toThrow('일반 파일')
  })

  it('rejects CRC damage before applying a pack', async () => {
    const bytes = await archive(validFiles())
    const position = bytes.indexOf(png)
    expect(position).toBeGreaterThan(0)
    bytes[position + png.length - 1] ^= 1
    await expect(readThemePackArchive(bytes)).rejects.toThrow('손상')
  })

  it.each([
    [{ path: 'private.json', bytes: Buffer.from('{}') }],
    [{ path: 'assets/link.png', bytes: png, mode: 0o120777 }],
    [{ path: 'assets/PORTRAIT.png', bytes: png }],
    [{ path: 'assets/large.png', bytes: Buffer.alloc(MAX_THEME_ASSET_BYTES + 1) }]
  ])('rejects extra, linked, duplicate or oversized entries', async (extra) => {
    await expect(readThemePackArchive(await archive([...validFiles(), extra]))).rejects.toThrow()
  })

  it('rejects traversal paths even when an archive is crafted outside the ZIP writer', async () => {
    const bytes = await archive(validFiles())
    const original = Buffer.from('assets/portrait.png')
    const hostile = Buffer.from('../bad/portrait.png')
    let offset = bytes.indexOf(original)
    while (offset !== -1) {
      hostile.copy(bytes, offset)
      offset = bytes.indexOf(original, offset + original.length)
    }
    await expect(readThemePackArchive(bytes)).rejects.toThrow()
  })

  it('rejects image omissions, malformed raster data and invalid crop bounds', () => {
    expect(() => validateThemePackContent(manifest, new Map())).toThrow()
    expect(() =>
      validateThemePackContent(manifest, new Map([['assets/portrait.png', Buffer.from('<svg/>')]]))
    ).toThrow()
    expect(() =>
      validateThemePackContent(
        {
          ...manifest,
          characters: [
            {
              ...manifest.characters[0],
              expressions: {
                done: { path: 'assets/portrait.png', crop: { x: 0, y: 0, width: 2, height: 1 } }
              }
            }
          ]
        },
        new Map([['assets/portrait.png', png]])
      )
    ).toThrow('크기')
  })

  it('rejects settings hidden inside export payloads', () => {
    const exported = { manifest, assets: { 'assets/portrait.png': png.toString('base64') } }
    expect(decodeThemePackExport(exported)).toEqual(content())
    expect(() => decodeThemePackExport({ ...exported, apiKey: 'secret' })).toThrow()
  })
})
