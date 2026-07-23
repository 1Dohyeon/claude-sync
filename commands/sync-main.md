---
description: fork의 로컬 main을 upstream/main으로 fast-forward 동기화하고 origin(내 fork)에도 push
allowed-tools: Bash(node:*)
---

현재 저장소의 `main`을 `upstream/main` 기준으로 동기화합니다. `main`은 자체 커밋이 없는 순수 미러 브랜치라는 전제이므로 항상 fast-forward만 시도하고, 성공하면 origin(내 fork)의 `main`에도 push합니다. upstream remote가 없거나 fast-forward가 불가능하면(= main에 예상 밖 커밋이 있으면) 안전하게 중단하고 이유를 보고합니다.

!node ~/.claude/utils/sync-fork-main.js

위 실행 결과(동기화 전/후 커밋 SHA, push 완료 여부, 실패 시 원인)를 사용자에게 요약해 보고하세요. 그 외 작업은 하지 않습니다.
