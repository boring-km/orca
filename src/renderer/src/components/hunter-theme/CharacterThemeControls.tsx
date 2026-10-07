import { Palette, Download, Upload, ImagePlus, Undo2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { normalizeCharacterThemeSettings } from '../../../../shared/character-theme-settings'
import { BUILTIN_THEME_PACKS } from './builtin-theme-packs'
import { useCharacterThemeActions } from './use-character-theme-actions'
import { ThemePackPreviewDialog } from './ThemePackPreviewDialog'
import { themePackExportPayload } from './theme-pack-export'

export function CharacterThemeControls(): React.JSX.Element | null {
  const {
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
  } = useCharacterThemeActions()
  if (!theme) {
    return null
  }
  const { settings, pack, character } = theme
  const disabled = pending || theme.loading

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="xs">
            꾸미기
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" sideOffset={8} wheelScroll>
          <div className="w-80 max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto scrollbar-sleek p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">작업 공간 꾸미기</h2>
                <p className="text-xs text-muted-foreground">
                  캐릭터와 연출을 취향에 맞게 바꿔보세요.
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="character-theme-pack">테마</Label>
                <Select
                  value={settings.activePackId}
                  disabled={disabled}
                  onValueChange={(key) => {
                    void run(() => selectPack(key))
                  }}
                >
                  <SelectTrigger id="character-theme-pack" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...BUILTIN_THEME_PACKS, ...catalog].map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        {item.manifest.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="hunter-character">캐릭터</Label>
                  <Select
                    value={character.id}
                    disabled={disabled}
                    onValueChange={(characterId) => {
                      void run(() => theme.update({ characterId }))
                    }}
                  >
                    <SelectTrigger id="hunter-character" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pack.manifest.characters.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hunter-intensity">연출</Label>
                  <Select
                    value={settings.intensity}
                    disabled={disabled}
                    onValueChange={(intensity) => {
                      void run(() =>
                        theme.update({
                          intensity: normalizeCharacterThemeSettings({ ...settings, intensity })
                            .intensity
                        })
                      )
                    }}
                  >
                    <SelectTrigger id="hunter-intensity" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">끄기</SelectItem>
                      <SelectItem value="soft">약하게</SelectItem>
                      <SelectItem value="full">전체</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="character-theme-enabled">테마 표시</Label>
                  <p className="text-xs text-muted-foreground">캐릭터와 테마 색상을 표시합니다.</p>
                </div>
                <Switch
                  id="character-theme-enabled"
                  checked={settings.enabled}
                  disabled={disabled}
                  onCheckedChange={(enabled) => {
                    void run(() => theme.update({ enabled }))
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="character-theme-terminal">터미널에도 적용</Label>
                  <p className="text-xs text-muted-foreground">
                    끄면 원래 터미널 색상을 사용합니다.
                  </p>
                </div>
                <Switch
                  id="character-theme-terminal"
                  checked={settings.terminalEnabled}
                  disabled={disabled || !pack.manifest.terminal}
                  onCheckedChange={(terminalEnabled) => {
                    void run(() => theme.update({ terminalEnabled }))
                  }}
                />
              </div>
            </div>
            <Separator />
            <Separator />
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">테마팩</h3>
                <p className="text-xs text-muted-foreground">
                  이미지를 바꾸거나 테마를 파일로 공유합니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || !api}
                  onClick={() => {
                    void run(async () => showPreview((await api?.previewImport()) ?? null))
                  }}
                >
                  <Upload aria-hidden="true" />
                  가져오기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || !api}
                  onClick={() => {
                    void run(async () => {
                      const exported = await api?.export(await themePackExportPayload(pack))
                      if (exported) {
                        toast.success('테마팩을 내보냈습니다.')
                      }
                    })
                  }}
                >
                  <Download aria-hidden="true" />
                  내보내기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || !api}
                  onClick={() => {
                    void run(async () =>
                      showPreview(
                        (await api?.chooseCharacterImage({
                          pack: await themePackExportPayload(pack),
                          characterId: character.id
                        })) ?? null
                      )
                    )
                  }}
                >
                  <ImagePlus aria-hidden="true" />
                  내 이미지
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || !settings.previousPackId}
                  onClick={() => {
                    void run(() => selectPack(settings.previousPackId ?? 'hunter'))
                  }}
                >
                  <Undo2 aria-hidden="true" />
                  이전 테마
                </Button>
              </div>
            </div>
            {theme.error || error ? (
              <p className="text-xs text-destructive" role="alert">
                {error ?? theme.error}
              </p>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      <ThemePackPreviewDialog
        preview={preview}
        pending={pending}
        error={error}
        onCancel={cancelPreview}
        onApply={() => {
          void run(applyPreview)
        }}
      />
    </>
  )
}
