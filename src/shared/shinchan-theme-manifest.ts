import type { CharacterThemeManifest } from './character-theme-manifest'

const shinchanColors: CharacterThemeManifest['colors']['dark'] = {
  background: 'color-mix(in srgb, var(--status-warning) 5%, var(--secondary))',
  card: 'color-mix(in srgb, var(--status-warning) 8%, var(--secondary))',
  accent: 'color-mix(in srgb, var(--destructive) 10%, var(--secondary))',
  'editor-surface': 'color-mix(in srgb, var(--status-warning) 3%, var(--secondary))',
  'worktree-sidebar': 'color-mix(in srgb, var(--status-warning) 10%, var(--secondary))',
  'worktree-sidebar-accent': 'color-mix(in srgb, var(--destructive) 14%, var(--secondary))',
  'worktree-sidebar-border': 'color-mix(in srgb, var(--status-warning) 25%, var(--border))',
  'hunter-gon': 'var(--destructive)',
  'hunter-killua': 'var(--status-warning)',
  'hunter-kurapika': 'var(--destructive)',
  'hunter-leorio': 'var(--status-warning)'
}

export const SHINCHAN_THEME_MANIFEST: CharacterThemeManifest = {
  formatVersion: 1,
  minimumCustomAppVersion: 1,
  id: 'shinchan',
  name: '크레용 신짱',
  version: '1.1.0',
  characters: [
    {
      id: 'shinchan',
      name: '짱구',
      portrait: {
        path: 'assets/shinchan.png',
        crop: { x: 10, y: 30, width: 320, height: 360 }
      },
      avatar: {
        path: 'assets/shinchan.png',
        crop: { x: 55, y: 40, width: 265, height: 160 }
      }
    },
    {
      id: 'shiro',
      name: '흰둥이',
      portrait: { path: 'assets/shiro.png' },
      avatar: { path: 'assets/shiro.png', crop: { x: 120, y: 75, width: 210, height: 180 } }
    },
    {
      id: 'action-kamen',
      name: '액션가면',
      portrait: { path: 'assets/action-kamen.png' },
      avatar: { path: 'assets/action-kamen.png', crop: { x: 65, y: 15, width: 155, height: 145 } }
    },
    {
      id: 'himawari',
      name: '짱아',
      portrait: { path: 'assets/himawari.png' },
      avatar: { path: 'assets/himawari.png', crop: { x: 85, y: 20, width: 225, height: 210 } }
    }
  ],
  areas: { workspace: 'shinchan', agent: 'shiro', review: 'action-kamen', clock: 'himawari' },
  scenery: {
    workspace: { motif: 'pajamas' },
    agent: { motif: 'dots' },
    review: { motif: 'stars' },
    clock: { motif: 'dots' }
  },
  defaults: { characterId: 'shinchan', intensity: 'soft' },
  colors: { light: shinchanColors, dark: shinchanColors },
  effects: { working: 'breathe', done: 'pulse', attention: 'outline' },
  terminal: { dark: 'Gruvbox Dark', light: 'Gruvbox Light' },
  sources: [
    {
      path: 'assets/shinchan.png',
      source: 'https://www.tv-asahi.co.jp/shinchan/character/img/01.png',
      usage: 'TV아사히 공식 캐릭터 이미지. 개인용 참고. 재배포 허가 미확인.'
    },
    {
      path: 'assets/shiro.png',
      source: 'https://www.tv-asahi.co.jp/shinchan/character/img/05.png',
      usage: 'TV아사히 공식 캐릭터 이미지. 개인용 참고. 재배포 허가 미확인.'
    },
    {
      path: 'assets/action-kamen.png',
      source: 'https://www.tv-asahi.co.jp/shinchan/character/img/24.png',
      usage: 'TV아사히 공식 캐릭터 이미지. 개인용 참고. 재배포 허가 미확인.'
    },
    {
      path: 'assets/himawari.png',
      source: 'https://www.tv-asahi.co.jp/shinchan/character/img/04.png',
      usage: 'TV아사히 공식 캐릭터 이미지. 개인용 참고. 재배포 허가 미확인.'
    }
  ]
}
