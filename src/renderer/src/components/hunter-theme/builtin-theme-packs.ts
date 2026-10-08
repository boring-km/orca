import {
  HUNTER_THEME_MANIFEST,
  NEUTRAL_THEME_MANIFEST
} from '../../../../shared/builtin-character-themes'
import type { LoadedThemePack } from '../../../../shared/character-theme-manifest'
import { SHINCHAN_THEME_MANIFEST } from '../../../../shared/shinchan-theme-manifest'
import shinchan from '@/assets/shinchan-reference/shinchan.png'
import shiro from '@/assets/shinchan-reference/shiro.png'
import actionKamen from '@/assets/shinchan-reference/action-kamen.png'
import himawari from '@/assets/shinchan-reference/himawari.png'
import gon from '@/assets/hunter-reference/gon.gif'
import killua from '@/assets/hunter-reference/killua.gif'
import kurapika from '@/assets/hunter-reference/kurapika.gif'
import leorio from '@/assets/hunter-reference/leorio.gif'

export const BUILTIN_THEME_PACKS: LoadedThemePack[] = [
  {
    key: 'hunter',
    manifest: HUNTER_THEME_MANIFEST,
    assets: {
      'assets/gon.gif': { url: gon, width: 699, height: 485 },
      'assets/killua.gif': { url: killua, width: 675, height: 450 },
      'assets/kurapika.gif': { url: kurapika, width: 690, height: 488 },
      'assets/leorio.gif': { url: leorio, width: 684, height: 485 }
    }
  },
  { key: 'neutral', manifest: NEUTRAL_THEME_MANIFEST, assets: {} },
  {
    key: 'shinchan',
    manifest: SHINCHAN_THEME_MANIFEST,
    assets: {
      'assets/shinchan.png': { url: shinchan, width: 340, height: 420 },
      'assets/shiro.png': { url: shiro, width: 340, height: 370 },
      'assets/action-kamen.png': { url: actionKamen, width: 340, height: 420 },
      'assets/himawari.png': { url: himawari, width: 340, height: 370 }
    }
  }
]

export function builtinThemePack(key: string): LoadedThemePack | undefined {
  return BUILTIN_THEME_PACKS.find((pack) => pack.key === key)
}
