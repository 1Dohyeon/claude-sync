---
description: task 문서 정리 — '## 완료'는 done/, 아니면 stalled/로 이동 (repo 미지정 시 전체)
argument-hint: [repo]
allowed-tools: Bash(node:*)
---

repo의 활성 task 문서(`tasks/*.md`, 중첩 폴더 포함)를 정리합니다. `## 완료` 섹션이 있으면 `done/`으로, 없으면 파일 끝에 `## 중단`을 추가한 뒤 `stalled/`로 옮깁니다. 인자로 repo명을 주면 그 repo만, 없으면 전체 repo.

!node ~/.claude/utils/chore-task.js $ARGUMENTS

위 실행 결과(done/stalled로 이동된 목록, "변경 없음" 등)를 사용자에게 요약해 보고하세요. 그 외 작업은 하지 않습니다.
