import { z } from 'zod'
import { HEX_COLOR_RE } from './color-validation'

export const CHARACTER_THEME_FORMAT_VERSION = 1
export const MAX_THEME_MANIFEST_BYTES = 64 * 1024
export const MAX_THEME_ASSET_BYTES = 4 * 1024 * 1024
export const MAX_THEME_PACK_BYTES = 20 * 1024 * 1024
export const MAX_THEME_PACK_ENTRIES = 33
export const THEME_AREAS = ['workspace', 'agent', 'review', 'clock'] as const
export type ThemeArea = (typeof THEME_AREAS)[number]
export const THEME_INTENSITIES = ['off', 'soft', 'full'] as const
export type ThemeIntensity = (typeof THEME_INTENSITIES)[number]

const id = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/)
export const themeAssetPathSchema = z
  .string()
  .regex(/^assets\/[a-zA-Z0-9_-]{1,64}\.(png|gif|jpe?g|webp)$/)
const sourceToken =
  '(?:secondary|foreground|popover|border|ring|status-success|status-warning|destructive|chart-[1-5])'
const variableColor = new RegExp(`^var\\(--${sourceToken}\\)$`)
const mixedColor = new RegExp(
  `^color-mix\\(in srgb, var\\(--${sourceToken}\\) (?:100|[0-9]{1,2})%, var\\(--${sourceToken}\\)\\)$`
)

export const THEME_COLOR_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'accent',
  'accent-foreground',
  'border',
  'ring',
  'editor-surface',
  'worktree-sidebar',
  'worktree-sidebar-foreground',
  'worktree-sidebar-accent',
  'worktree-sidebar-accent-foreground',
  'worktree-sidebar-border',
  'hunter-gon',
  'hunter-killua',
  'hunter-kurapika',
  'hunter-leorio'
] as const

const color = z
  .string()
  .max(160)
  .refine(
    (value) => HEX_COLOR_RE.test(value) || variableColor.test(value) || mixedColor.test(value),
    '테마 색상은 HEX 또는 허용된 디자인 토큰이어야 합니다.'
  )
const colors = z.partialRecord(z.enum(THEME_COLOR_TOKENS), color).superRefine((values, context) => {
  for (const value of Object.values(values)) {
    for (const reference of value.matchAll(/var\(--([a-z-]+[1-5]?)\)/g)) {
      if (Object.hasOwn(values, reference[1])) {
        context.addIssue({
          code: 'custom',
          message: '색상은 같은 테마에서 덮어쓴 토큰을 참조할 수 없습니다.'
        })
      }
    }
  }
})

const crop = z
  .object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    width: z.number().int().min(1).max(8192),
    height: z.number().int().min(1).max(8192)
  })
  .strict()
const image = z.object({ path: themeAssetPathSchema, crop: crop.optional() }).strict()
const character = z
  .object({
    id,
    name: z.string().trim().min(1).max(60),
    portrait: image.optional(),
    avatar: image.optional(),
    expressions: z
      .object({
        working: image.optional(),
        done: image.optional(),
        attention: image.optional(),
        idle: image.optional()
      })
      .strict()
      .optional()
  })
  .strict()

export const characterThemeManifestSchema = z
  .object({
    formatVersion: z.literal(CHARACTER_THEME_FORMAT_VERSION),
    minimumCustomAppVersion: z.literal(1),
    id,
    name: z.string().trim().min(1).max(100),
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .max(32),
    characters: z.array(character).min(1).max(16),
    areas: z.record(z.enum(THEME_AREAS), id),
    defaults: z.object({ characterId: id, intensity: z.enum(THEME_INTENSITIES) }).strict(),
    colors: z.object({ light: colors, dark: colors }).strict(),
    effects: z
      .object({
        working: z.enum(['breathe', 'electric', 'none']),
        done: z.enum(['pulse', 'none']),
        attention: z.enum(['outline', 'none'])
      })
      .strict(),
    terminal: z
      .object({ dark: z.string().min(1).max(100), light: z.string().min(1).max(100) })
      .strict()
      .optional(),
    sources: z
      .array(
        z
          .object({
            path: themeAssetPathSchema,
            source: z.string().trim().min(1).max(500),
            usage: z.string().trim().min(1).max(500)
          })
          .strict()
      )
      .max(32)
  })
  .strict()
  .superRefine((manifest, context) => {
    const ids = new Set(manifest.characters.map((item) => item.id))
    if (
      ids.size !== manifest.characters.length ||
      !ids.has(manifest.defaults.characterId) ||
      Object.values(manifest.areas).some((areaId) => !ids.has(areaId))
    ) {
      context.addIssue({
        code: 'custom',
        message: '기본 캐릭터와 영역 배정은 중복 없는 캐릭터 목록에 있어야 합니다.'
      })
    }
    const sources = new Set(manifest.sources.map((item) => item.path))
    if (
      sources.size !== manifest.sources.length ||
      themeManifestAssetPaths(manifest).some((path) => !sources.has(path))
    ) {
      context.addIssue({
        code: 'custom',
        message: '각 이미지의 출처와 사용 조건을 기록해야 합니다.'
      })
    }
  })

export type CharacterThemeManifest = z.infer<typeof characterThemeManifestSchema>
export type ThemeCharacter = CharacterThemeManifest['characters'][number]
export type ThemeImage = NonNullable<ThemeCharacter['portrait']>
export type ThemeAsset = { url: string; width: number; height: number }
export type LoadedThemePack = {
  key: string
  manifest: CharacterThemeManifest
  assets: Record<string, ThemeAsset>
}
export type ThemePackSummary = Pick<LoadedThemePack, 'key' | 'manifest'>
export type ThemePackPreview = { token: string; pack: LoadedThemePack }
export type ThemePackExport = { manifest: CharacterThemeManifest; assets: Record<string, string> }

export type CharacterThemePackApi = {
  list: () => Promise<ThemePackSummary[]>
  get: (key: string) => Promise<LoadedThemePack>
  previewImport: () => Promise<ThemePackPreview | null>
  applyImport: (token: string) => Promise<void>
  export: (pack: ThemePackExport) => Promise<boolean>
  chooseCharacterImage: (args: {
    pack: ThemePackExport
    characterId: string
  }) => Promise<ThemePackPreview | null>
}

export function themeManifestAssetPaths(manifest: {
  characters: readonly {
    portrait?: { path: string }
    avatar?: { path: string }
    expressions?: Partial<Record<'working' | 'done' | 'attention' | 'idle', { path: string }>>
  }[]
}): string[] {
  return [
    ...new Set(
      manifest.characters
        .flatMap((item) => [
          item.portrait?.path,
          item.avatar?.path,
          ...Object.values(item.expressions ?? {}).map((expression) => expression.path)
        ])
        .filter((path): path is string => path !== undefined)
    )
  ].sort()
}
