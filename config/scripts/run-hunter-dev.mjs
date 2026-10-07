import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const profilePath = resolve(import.meta.dirname, '../../.hunter-dev-profile')
mkdirSync(profilePath, { recursive: true, mode: 0o700 })

const preview = process.argv.includes('--preview')
process.argv = process.argv.filter((argument) => argument !== '--preview')

process.env.ORCA_DEV_USER_DATA_PATH = profilePath
process.env.ORCA_BACKGROUND_LAUNCH ??= preview ? '0' : '1'
process.env.VITE_ORCA_HUNTER_THEME = '1'

await import('./run-electron-vite-dev.mjs')
