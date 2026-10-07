import { z } from 'zod'
import {
  characterThemeManifestSchema,
  themeAssetPathSchema,
  MAX_THEME_ASSET_BYTES,
  MAX_THEME_PACK_BYTES
} from '../../shared/character-theme-manifest'
import { validateThemePackContent, type ThemePackContent } from './theme-pack-content'

const exportSchema = z
  .object({
    manifest: characterThemeManifestSchema,
    assets: z.record(themeAssetPathSchema, z.string().max(Math.ceil(MAX_THEME_ASSET_BYTES / 3) * 4))
  })
  .strict()

export function decodeThemePackExport(value: unknown): ThemePackContent {
  const parsed = exportSchema.parse(value)
  if (Object.keys(parsed.assets).length > 32) {
    throw new Error('이미지 파일이 너무 많습니다.')
  }
  const assets = new Map<string, Buffer>()
  let total = 0
  for (const [path, encoded] of Object.entries(parsed.assets)) {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
      throw new Error('이미지 데이터가 올바르지 않습니다.')
    }
    total += encoded.length
    if (total > Math.ceil(MAX_THEME_PACK_BYTES / 3) * 4) {
      throw new Error('이미지의 전체 용량을 초과했습니다.')
    }
    assets.set(path, Buffer.from(encoded, 'base64'))
  }
  return validateThemePackContent(parsed.manifest, assets)
}
