import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import type { ThemePackPreview } from '../../../../shared/character-theme-manifest'
import { ThemeCharacterImage } from './ThemeCharacterImage'

export function ThemePackPreviewDialog({
  preview,
  pending,
  error,
  onCancel,
  onApply
}: {
  preview: ThemePackPreview | null
  pending: boolean
  error: string | null
  onCancel: () => void
  onApply: () => void
}): React.JSX.Element {
  return (
    <Dialog
      open={preview !== null}
      onOpenChange={(open) => {
        if (!open && !pending) {
          onCancel()
        }
      }}
    >
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (pending) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (pending) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{preview?.pack.manifest.name ?? '테마 미리보기'}</DialogTitle>
          <DialogDescription>
            색상과 캐릭터를 미리 보고 적용하세요. 연출 강도는 유지하며, 선택한 캐릭터가 없으면 테마
            기본 캐릭터를 사용합니다.
          </DialogDescription>
        </DialogHeader>
        {preview ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-4">
              {preview.pack.manifest.characters.map((character) => (
                <div key={character.id} className="flex flex-col items-center gap-2">
                  <ThemeCharacterImage pack={preview.pack} character={character} kind="avatar" />
                  <span className="text-xs">{character.name}</span>
                </div>
              ))}
            </div>
            <div className="max-h-40 overflow-auto space-y-2 text-xs text-muted-foreground scrollbar-sleek">
              {preview.pack.manifest.sources.map((source) => (
                <p key={source.path}>{source.usage}</p>
              ))}
            </div>
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" disabled={pending} onClick={onCancel}>
            취소
          </Button>
          <Button disabled={pending} onClick={onApply}>
            {pending ? '적용 중…' : '테마 적용'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
