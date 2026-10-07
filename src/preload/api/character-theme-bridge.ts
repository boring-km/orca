import { ipcRenderer } from 'electron'
import type { CharacterThemePackApi } from '../../shared/character-theme-manifest'

export const characterThemeApi = {
  list: () => ipcRenderer.invoke('characterThemes:list'),
  get: (key) => ipcRenderer.invoke('characterThemes:get', key),
  previewImport: () => ipcRenderer.invoke('characterThemes:previewImport'),
  applyImport: (token) => ipcRenderer.invoke('characterThemes:applyImport', token),
  export: (pack) => ipcRenderer.invoke('characterThemes:export', pack),
  chooseCharacterImage: (args) => ipcRenderer.invoke('characterThemes:chooseCharacterImage', args)
} satisfies CharacterThemePackApi
