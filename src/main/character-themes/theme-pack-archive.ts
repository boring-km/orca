import { crc32 } from 'node:zlib'
import { Readable } from 'node:stream'
import { fromBufferPromise } from 'yauzl'
import { ZipFile } from 'yazl'
import {
  MAX_THEME_PACK_BYTES,
  MAX_THEME_MANIFEST_BYTES,
  MAX_THEME_ASSET_BYTES,
  MAX_THEME_PACK_ENTRIES,
  themeAssetPathSchema
} from '../../shared/character-theme-manifest'
import { readNodeFileWithinLimit } from '../../shared/node-bounded-file-reader'
import { validateThemePackContent, type ThemePackContent } from './theme-pack-content'

export async function readThemePackArchive(bytes: Buffer): Promise<ThemePackContent> {
  if (bytes.length > MAX_THEME_PACK_BYTES) {
    throw new Error('테마 ZIP의 허용 용량을 초과했습니다.')
  }
  const zip = await fromBufferPromise(bytes, {
    lazyEntries: true,
    strictFileNames: true,
    validateEntrySizes: true
  })
  try {
    if (zip.entryCount > MAX_THEME_PACK_ENTRIES) {
      throw new Error('테마 ZIP에 파일이 너무 많습니다.')
    }
    const files = new Map<string, Buffer>()
    const names = new Set<string>()
    let totalBytes = 0
    for await (const entry of zip.eachEntry()) {
      const name = entry.fileName
      const fileType = (entry.externalFileAttributes >>> 16) & 0o170000
      if (name === 'assets/' && (fileType === 0 || fileType === 0o040000)) {
        continue
      }
      if (
        (fileType !== 0 && fileType !== 0o100000) ||
        entry.isEncrypted() ||
        (name !== 'manifest.json' && !themeAssetPathSchema.safeParse(name).success)
      ) {
        throw new Error('테마 ZIP에는 manifest와 일반 이미지 파일만 넣을 수 있습니다.')
      }
      if (names.has(name.toLowerCase())) {
        throw new Error('테마 ZIP에 중복 파일 경로가 있습니다.')
      }
      names.add(name.toLowerCase())
      totalBytes += entry.uncompressedSize
      const limit = name === 'manifest.json' ? MAX_THEME_MANIFEST_BYTES : MAX_THEME_ASSET_BYTES
      if (entry.uncompressedSize > limit || totalBytes > MAX_THEME_PACK_BYTES) {
        throw new Error('테마 ZIP의 압축 해제 용량을 초과했습니다.')
      }
      const stream = await zip.openReadStreamPromise(entry)
      const chunks: Buffer[] = []
      let length = 0
      for await (const chunk of stream) {
        if (!Buffer.isBuffer(chunk)) {
          stream.destroy()
          throw new Error('테마 ZIP 데이터를 읽을 수 없습니다.')
        }
        length += chunk.length
        if (length > limit) {
          stream.destroy()
          throw new Error('테마 ZIP의 파일 크기가 올바르지 않습니다.')
        }
        chunks.push(chunk)
      }
      const content = Buffer.concat(chunks)
      if (length !== entry.uncompressedSize || crc32(content) !== entry.crc32) {
        throw new Error('테마 ZIP의 파일이 손상되었습니다.')
      }
      files.set(name, content)
    }
    const manifestBytes = files.get('manifest.json')
    if (!manifestBytes) {
      throw new Error('테마 ZIP에 manifest.json이 없습니다.')
    }
    files.delete('manifest.json')
    const manifest: unknown = JSON.parse(manifestBytes.toString('utf8'))
    return validateThemePackContent(manifest, files)
  } finally {
    zip.close()
  }
}

export async function readThemePackFile(path: string): Promise<ThemePackContent> {
  const { buffer } = await readNodeFileWithinLimit(path, MAX_THEME_PACK_BYTES, {
    regularFileOnly: true
  })
  return readThemePackArchive(buffer)
}

export async function writeThemePackArchive(content: ThemePackContent): Promise<Buffer> {
  const validated = validateThemePackContent(content.manifest, content.assets)
  const zip = new ZipFile()
  const output = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    zip.outputStream.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_THEME_PACK_BYTES) {
        const error = new Error('내보낼 테마 ZIP이 너무 큽니다.')
        if (zip.outputStream instanceof Readable) {
          zip.outputStream.destroy(error)
        } else {
          zip.outputStream.emit('error', error)
        }
        return
      }
      chunks.push(chunk)
    })
    zip.outputStream.once('error', reject)
    zip.once('error', reject)
    zip.outputStream.once('end', () => resolve(Buffer.concat(chunks)))
  })
  zip.addBuffer(Buffer.from(JSON.stringify(validated.manifest, null, 2)), 'manifest.json')
  for (const path of [...validated.assets.keys()].sort()) {
    const bytes = validated.assets.get(path)
    if (bytes) {
      zip.addBuffer(bytes, path)
    }
  }
  zip.end()
  return output
}
