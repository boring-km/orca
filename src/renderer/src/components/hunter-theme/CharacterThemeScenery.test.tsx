// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  HUNTER_THEME_MANIFEST,
  NEUTRAL_THEME_MANIFEST
} from '../../../../shared/builtin-character-themes'
import { normalizeCharacterThemeSettings } from '../../../../shared/character-theme-settings'
import { CharacterThemeContext, type CharacterThemeContextValue } from './character-theme-context'
import { CharacterThemeScenery } from './CharacterThemeScenery'

afterEach(cleanup)

function context(): CharacterThemeContextValue {
  return {
    pack: { key: 'hunter', manifest: HUNTER_THEME_MANIFEST, assets: {} },
    character: HUNTER_THEME_MANIFEST.characters[0],
    settings: normalizeCharacterThemeSettings({ intensity: 'full' }),
    loading: false,
    error: null,
    preview: null,
    setPreview: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    selectPack: vi.fn().mockResolvedValue(undefined)
  }
}

describe('character theme scenery', () => {
  it('uses the character and motif assigned to each area', () => {
    const value = context()
    const { container, rerender } = render(
      <CharacterThemeContext.Provider value={value}>
        <CharacterThemeScenery area="workspace" />
      </CharacterThemeContext.Provider>
    )
    expect(container.textContent).toBe('')
    expect(container.querySelector('[data-character="gon"]')).not.toBeNull()
    expect(container.querySelector('[data-motif="aura"]')).not.toBeNull()
    rerender(
      <CharacterThemeContext.Provider value={value}>
        <CharacterThemeScenery area="review" />
      </CharacterThemeContext.Provider>
    )
    expect(container.textContent).toBe('')
    expect(container.querySelector('[data-character="kurapika"]')).not.toBeNull()
    expect(container.querySelector('[data-motif="chain"]')).not.toBeNull()
  })

  it.each(['disabled', 'off', 'neutral', 'missing-provider'])('omits scenery for %s', (mode) => {
    const value = context()
    if (mode === 'disabled') {
      value.settings.enabled = false
    }
    if (mode === 'off') {
      value.settings.intensity = 'off'
    }
    if (mode === 'neutral') {
      value.pack.manifest = NEUTRAL_THEME_MANIFEST
    }
    const { container } = render(
      <CharacterThemeContext.Provider value={mode === 'missing-provider' ? null : value}>
        <CharacterThemeScenery area="workspace" />
      </CharacterThemeContext.Provider>
    )
    expect(container.childElementCount).toBe(0)
  })
})
