---
description: 완료 task 색인 갱신 (repo 미지정 시 전체)
argument-hint: [repo]
allowed-tools: Bash(node:*)
---

완료 task 색인(`tasks/done/INDEX.md`)을 갱신합니다. 인자로 repo명을 주면 그 repo만, 없으면 전체 repo.

!node ~/.claude/utils/done-index.js $ARGUMENTS

위 실행 결과(갱신된 INDEX 목록 또는 "변경 없음")를 사용자에게 요약해 보고하세요. 그 외 작업은 하지 않습니다.
