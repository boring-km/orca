import type { CharacterThemeManifest } from './character-theme-manifest'

const hunterColors: CharacterThemeManifest['colors']['dark'] = {
  background: 'color-mix(in srgb, var(--status-success) 6%, var(--secondary))',
  card: 'color-mix(in srgb, var(--chart-1) 5%, var(--secondary))',
  accent: 'color-mix(in srgb, var(--status-success) 12%, var(--secondary))',
  'editor-surface': 'color-mix(in srgb, var(--chart-4) 5%, var(--secondary))',
  'worktree-sidebar': 'color-mix(in srgb, var(--status-success) 8%, var(--secondary))',
  'worktree-sidebar-accent': 'color-mix(in srgb, var(--status-success) 16%, var(--secondary))',
  'worktree-sidebar-border': 'color-mix(in srgb, var(--status-success) 25%, var(--border))',
  'hunter-gon': 'var(--status-success)',
  'hunter-killua': 'var(--chart-1)',
  'hunter-kurapika': 'var(--destructive)',
  'hunter-leorio': 'var(--chart-4)'
}

export const HUNTER_THEME_MANIFEST: CharacterThemeManifest = {
  formatVersion: 1,
  minimumCustomAppVersion: 1,
  id: 'hunter',
  name: 'HUNTER × HUNTER',
  version: '0.1.0',
  characters: [
    {
      id: 'gon',
      name: '곤',
      portrait: { path: 'assets/gon.gif', crop: { x: 0, y: 0, width: 175, height: 485 } },
      avatar: { path: 'assets/gon.gif', crop: { x: 535, y: 75, width: 164, height: 164 } },
      expressions: {
        done: { path: 'assets/gon.gif', crop: { x: 535, y: 280, width: 164, height: 164 } }
      }
    },
    {
      id: 'killua',
      name: '키르아',
      portrait: { path: 'assets/killua.gif', crop: { x: 0, y: 0, width: 145, height: 450 } },
      avatar: { path: 'assets/killua.gif', crop: { x: 505, y: 55, width: 165, height: 165 } },
      expressions: {
        done: { path: 'assets/killua.gif', crop: { x: 475, y: 240, width: 200, height: 210 } }
      }
    },
    {
      id: 'kurapika',
      name: '크라피카',
      portrait: { path: 'assets/kurapika.gif', crop: { x: 0, y: 0, width: 175, height: 488 } },
      avatar: { path: 'assets/kurapika.gif', crop: { x: 515, y: 0, width: 175, height: 215 } },
      expressions: {
        done: { path: 'assets/kurapika.gif', crop: { x: 515, y: 235, width: 175, height: 215 } }
      }
    },
    {
      id: 'leorio',
      name: '레오리오',
      portrait: { path: 'assets/leorio.gif', crop: { x: 0, y: 0, width: 160, height: 485 } },
      avatar: { path: 'assets/leorio.gif', crop: { x: 519, y: 30, width: 165, height: 165 } },
      expressions: {
        done: { path: 'assets/leorio.gif', crop: { x: 519, y: 285, width: 165, height: 165 } }
      }
    }
  ],
  areas: { workspace: 'gon', agent: 'killua', review: 'kurapika', clock: 'leorio' },
  scenery: {
    workspace: { motif: 'aura' },
    agent: { motif: 'lightning' },
    review: { motif: 'chain' },
    clock: { motif: 'orbit' }
  },
  defaults: { characterId: 'gon', intensity: 'soft' },
  colors: { light: hunterColors, dark: hunterColors },
  effects: { working: 'electric', done: 'pulse', attention: 'outline' },
  terminal: { dark: 'Everforest Dark', light: 'Everforest Light' },
  sources: ['gon', 'killua', 'kurapika', 'leorio'].map((name) => ({
    path: `assets/${name}.gif`,
    source: `https://www.ntv.co.jp/hunterhunter/character/images/main_${name === 'killua' ? 'kirua' : name === 'leorio' ? 'reorio' : name}.gif`,
    usage: '개인용 참고 설정화. 재배포 허가 미확인.'
  }))
}

export const NEUTRAL_THEME_MANIFEST: CharacterThemeManifest = {
  formatVersion: 1,
  minimumCustomAppVersion: 1,
  id: 'neutral',
  name: '기본 작업 도우미',
  version: '1.0.0',
  characters: [{ id: 'assistant', name: '작업 도우미' }],
  areas: { workspace: 'assistant', agent: 'assistant', review: 'assistant', clock: 'assistant' },
  defaults: { characterId: 'assistant', intensity: 'soft' },
  colors: { dark: {}, light: {} },
  effects: { working: 'breathe', done: 'pulse', attention: 'outline' },
  sources: []
}
