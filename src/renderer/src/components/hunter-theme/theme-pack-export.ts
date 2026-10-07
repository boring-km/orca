import type { LoadedThemePack, ThemePackExport } from '../../../../shared/character-theme-manifest'
import { blobToBase64 } from '@/lib/image-blob-png'

export async function themePackExportPayload(pack: LoadedThemePack): Promise<ThemePackExport> {
  const assets: Record<string, string> = {}
  for (const [path, asset] of Object.entries(pack.assets)) {
    const response = await fetch(asset.url)
    if (!response.ok) {
      throw new Error('테마 이미지를 읽을 수 없습니다.')
    }
    assets[path] = await blobToBase64(await response.blob())
  }
  return { manifest: pack.manifest, assets }
}
