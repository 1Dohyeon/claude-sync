---
description: 현재 task 기록 스냅샷 커밋/푸시 (repo 미지정 시 전체)
argument-hint: [repo]
allowed-tools: Bash(sh:*)
---

docs 저장소의 현재 task 기록 상태를 스냅샷 커밋/푸시합니다(세션종료 훅이 미발동했을 때 수동 트리거). 인자로 repo명을 주면 그 repo만, 없으면 전체 repo.

!sh ~/.claude/hooks/save-docs.sh $ARGUMENTS

위 실행 결과(커밋/푸시 여부, "변경 없음" 등)를 사용자에게 요약해 보고하세요. 그 외 작업은 하지 않습니다.
