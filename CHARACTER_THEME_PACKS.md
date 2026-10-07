# Character theme packs

The custom Hunter build enables character themes with `VITE_ORCA_HUNTER_THEME=1`.
Use `pnpm dev:hunter:preview` to open it yourself; agent launches must keep
`ORCA_BACKGROUND_LAUNCH=1`. Theme settings and imported packs belong to the local
app data directory, independent of repositories, folder workspaces and SSH hosts.

## Using a pack

Open **꾸미기** at the bottom of the workspace sidebar. Select Hunter or the basic
assistant theme, a main character and effect intensity. Changes persist across
restarts. The companion follows the active agent tab and its selected terminal
split automatically; there is no separate agent picker. The card shows the current
workspace folder name instead of the character name or conversation title. The sidebar card omits a
clock and status portrait. The bottom status-bar clock uses Killua in the Hunter pack.
**터미널에도 적용** opts into the pack's named terminal palettes; turning
it off restores the existing personal terminal selection.

**내보내기** saves one `.orca-theme.zip`. **가져오기** validates the file and previews
its appearance before **테마 적용** installs it. Cancel restores the current theme.
**이전 테마** switches back to the previous pack. **내 이미지** replaces the selected
character's portrait, avatar and expressions with a selected local raster image,
then opens the same preview. Its original absolute path is not stored.

A shared archive contains only the manifest and its referenced images. Existing
character choices and intensity stay local; a character absent from the imported
pack falls back to its default. A fresh app profile starts with pack defaults.
Accounts, project paths, conversations and other preferences are not exported.
The receiving app must support this custom format; stock Orca does not load it.

## Format version 1

The ZIP root contains `manifest.json` and an `assets/` directory. The exact schema
is `src/shared/character-theme-manifest.ts`; the Hunter and basic examples are in
`src/shared/builtin-character-themes.ts`.

Required manifest fields:

- `formatVersion: 1`, `minimumCustomAppVersion: 1`, an ID, name and numeric version.
- `characters`: unique IDs and names, optional `portrait` and `avatar` images,
  and optional `expressions` for `working`, `done`, `attention` and `idle`.
- `areas`: character IDs for `workspace`, `agent`, `review` and `clock`.
- `defaults`: an existing `characterId` and `intensity` (`off`, `soft`, `full`).
- `colors`: `dark` and `light` maps of allowed design tokens. Values may be HEX,
  references to allowed base tokens or a bounded `color-mix` between base tokens.
  References to tokens overwritten by the same scheme are rejected.
- `effects`: working (`breathe`, `electric`, `none`), done (`pulse`, `none`) and
  attention (`outline`, `none`).
- `sources`: image paths, source descriptions and usage conditions.

Optional `terminal` selects existing catalog palettes by `dark` and `light` name.
An unavailable palette falls back to the user's normal terminal theme.

Image references use `assets/name.png` (also GIF, JPG, JPEG or WebP), with optional
integer `crop: { x, y, width, height }`. Nested paths, absolute paths, scripts,
SVGs, unknown manifest fields, unsupported versions, encrypted entries, symlinks,
case-insensitive duplicate paths, missing assets and unreferenced files are refused.
Each referenced image needs a source entry, including user-supplied images.

Limits: ZIP and decompressed content 20 MiB, manifest 64 KiB, each image 4 MiB,
33 ZIP entries, 16 characters, 16 megapixels across images and 32 installed packs.
Raster dimensions and crop bounds are checked before installation; ZIP checksums
must match. No files are installed during preview. Installation uses a temporary
folder and an atomic rename; the saved content hash detects later modifications.

Hunter's bundled reference drawings retain their recorded personal-use provenance.
Those notes travel with exported packs; redistribution permission is unverified.

## Validation

Focused tests cover strict manifest parsing, local defaults, opt-in terminal
selection, ZIP corruption and unsafe entries, image bounds, concurrent installation,
new-profile import, preview ownership, canceled imports, export contents and personal
image path removal. Renderer screenshots still require the Electron skill and a
hidden renderer through Playwright CDP. Visible-window and native-focus checks remain
for an isolated display or CI.
