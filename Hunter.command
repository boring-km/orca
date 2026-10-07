#!/bin/sh
set -eu

cd "$(dirname "$0")"

HUNTER_TOOLCHAIN="$HOME/.local/share/orca-hunter-toolchain"
if [ ! -x "$HUNTER_TOOLCHAIN/node/bin/node" ] || [ ! -x "$HUNTER_TOOLCHAIN/pnpm/node_modules/.bin/pnpm" ]; then
  echo 'Hunter 개발 실행 환경이 없습니다: ~/.local/share/orca-hunter-toolchain'
  echo 'Node.js 24와 pnpm 12가 설치되어 있다면 pnpm dev:hunter:preview로 실행하세요.'
  exit 1
fi

export PATH="$HUNTER_TOOLCHAIN/node/bin:$HUNTER_TOOLCHAIN/pnpm/node_modules/.bin:$PATH"
export ORCA_BACKGROUND_LAUNCH="${ORCA_BACKGROUND_LAUNCH:-0}"
exec pnpm dev:hunter:preview
