#!/bin/sh
# CI 러너의 ~/.claude에 이 저장소의 하네스를 연결한다.
# settings.json과 hooks는 로컬 전용 훅(save-docs, worklog 등)이 CI에서 돌지 않도록 연결하지 않는다.
set -eu

src=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$HOME/.claude"

for item in CLAUDE.md rules skills agents; do
  ln -sfn "$src/$item" "$HOME/.claude/$item"
done

ls -l "$HOME/.claude"
