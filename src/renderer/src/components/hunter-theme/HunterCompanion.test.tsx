// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { HUNTER_THEME_MANIFEST } from '../../../../shared/builtin-character-themes'
import { normalizeCharacterThemeSettings } from '../../../../shared/character-theme-settings'
import {
  CharacterThemeContext,
  useCharacterTheme,
  type CharacterThemeContextValue
} from './character-theme-context'
import HunterCompanion from './HunterCompanion'

vi.mock('@/store', () => ({ useAppStore: () => null }))
vi.mock('@/components/activity/use-agent-pane-threads', () => ({
  useAgentPaneThreads: () => ({ allThreads: [] })
}))
vi.mock('./use-character-theme-actions', () => ({
  useCharacterThemeActions: () => ({
    theme: useCharacterTheme(),
    catalog: [],
    pending: false,
    error: null,
    preview: null,
    run: vi.fn(),
    selectPack: vi.fn(),
    showPreview: vi.fn(),
    cancelPreview: vi.fn(),
    applyPreview: vi.fn()
  })
}))
afterEach(cleanup)

function companionContext(): CharacterThemeContextValue {
  const pack = {
    key: 'hunter',
    manifest: HUNTER_THEME_MANIFEST,
    assets: { 'assets/gon.gif': { url: 'gon.gif', width: 699, height: 485 } }
  }
  const value: CharacterThemeContextValue = {
    pack,
    character: pack.manifest.characters[0],
    settings: normalizeCharacterThemeSettings(undefined),
    loading: false,
    error: null,
    preview: null,
    setPreview: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    selectPack: vi.fn().mockResolvedValue(undefined)
  }
  return value
}

it('shows the portrait and opens customization from the status card with click or keyboard', async () => {
  const value = companionContext()
  const { container } = render(
    <CharacterThemeContext.Provider value={value}>
      <HunterCompanion />
    </CharacterThemeContext.Provider>
  )
  expect(container.querySelector('image')?.getAttribute('href')).toBe('gon.gif')
  expect(screen.queryByRole('button', { name: /^꾸미기$/ })).toBeNull()
  const card = screen.getByRole('button', { name: '작업 상태 · 꾸미기 설정 열기' })
  const user = userEvent.setup()
  await user.click(card)
  expect(screen.getByText('작업 공간 꾸미기')).toBeTruthy()
  await user.keyboard('{Escape}')
  expect(screen.queryByText('작업 공간 꾸미기')).toBeNull()
  card.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByText('작업 공간 꾸미기')).toBeTruthy()
})
