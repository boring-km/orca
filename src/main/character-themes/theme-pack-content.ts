import { createHash } from 'node:crypto'
import { extname } from 'node:path'
import {
  characterThemeManifestSchema,
  themeManifestAssetPaths,
  MAX_THEME_ASSET_BYTES,
  MAX_THEME_PACK_BYTES,
  MAX_THEME_MANIFEST_BYTES,
  type CharacterThemeManifest,
  type LoadedThemePack
} from '../../shared/character-theme-manifest'
import { assertRasterImagePreviewWithinLimits } from '../../shared/raster-image-preview-limits'

export type ThemePackContent = { manifest: CharacterThemeManifest; assets: Map<string, Buffer> }
const IMAGE_MIME_TYPES: Record<string, string> = {
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
}

export function themeAssetMimeType(path: string): string {
  const mime = IMAGE_MIME_TYPES[extname(path)]
  if (!mime) {
    throw new Error('지원하지 않는 이미지 형식입니다.')
  }
  return mime
}

export function validateThemePackContent(
  manifestValue: unknown,
  assets: Map<string, Buffer>
): ThemePackContent {
  const manifest = characterThemeManifestSchema.parse(manifestValue)
  const manifestBytes = Buffer.byteLength(JSON.stringify(manifest))
  if (manifestBytes > MAX_THEME_MANIFEST_BYTES) {
    throw new Error('테마 manifest가 너무 큽니다.')
  }
  const paths = themeManifestAssetPaths(manifest)
  if (paths.length !== assets.size || paths.some((path) => !assets.has(path))) {
    throw new Error('테마 이미지가 누락되었거나 참조하지 않는 파일이 있습니다.')
  }
  let totalBytes = manifestBytes
  let totalPixels = 0
  for (const [path, bytes] of assets) {
    totalBytes += bytes.length
    if (
      bytes.length === 0 ||
      bytes.length > MAX_THEME_ASSET_BYTES ||
      totalBytes > MAX_THEME_PACK_BYTES
    ) {
      throw new Error('테마 이미지의 허용 용량을 초과했습니다.')
    }
    const dimensions = assertRasterImagePreviewWithinLimits(bytes, themeAssetMimeType(path))
    if (!dimensions) {
      throw new Error('이미지 크기를 확인할 수 없습니다.')
    }
    totalPixels += dimensions.width * dimensions.height
    if (totalPixels > 16 * 1024 * 1024) {
      throw new Error('테마 이미지의 전체 픽셀 수가 너무 큽니다.')
    }
    for (const character of manifest.characters) {
      for (const image of [
        character.portrait,
        character.avatar,
        ...Object.values(character.expressions ?? {})
      ]) {
        if (image?.path !== path || !image.crop) {
          continue
        }
        if (
          image.crop.x + image.crop.width > dimensions.width ||
          image.crop.y + image.crop.height > dimensions.height
        ) {
          throw new Error('캐릭터 표시 영역이 이미지 크기를 벗어납니다.')
        }
      }
    }
  }
  return { manifest, assets }
}

export function themePackStorageKey(content: ThemePackContent): string {
  const hash = createHash('sha256').update(JSON.stringify(content.manifest))
  for (const path of [...content.assets.keys()].sort()) {
    hash.update(path).update(content.assets.get(path) ?? Buffer.alloc(0))
  }
  return `imported-${hash.digest('hex').slice(0, 24)}`
}

export function loadedThemePack(
  content: ThemePackContent,
  key = themePackStorageKey(content)
): LoadedThemePack {
  const assets: LoadedThemePack['assets'] = {}
  for (const [path, bytes] of content.assets) {
    const dimensions = assertRasterImagePreviewWithinLimits(bytes, themeAssetMimeType(path))
    if (!dimensions) {
      throw new Error('이미지 크기를 확인할 수 없습니다.')
    }
    assets[path] = {
      ...dimensions,
      url: `data:${themeAssetMimeType(path)};base64,${bytes.toString('base64')}`
    }
  }
  return { key, manifest: content.manifest, assets }
}
