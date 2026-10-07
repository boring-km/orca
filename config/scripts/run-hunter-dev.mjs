import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const profilePath = resolve(import.meta.dirname, '../../.hunter-dev-profile')
mkdirSync(profilePath, { recursive: true, mode: 0o700 })

process.env.ORCA_DEV_USER_DATA_PATH = profilePath
process.env.ORCA_BACKGROUND_LAUNCH = '1'

await import('./run-electron-vite-dev.mjs')
