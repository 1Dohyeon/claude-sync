---
description: task 보고서·작업 문서 생성 (템플릿 복사)
argument-hint: <대상 브랜치>
allowed-tools: Bash(git remote get-url:*), Bash(mkdir:*), Bash(cp:*), Bash(ls:*)
---

`$ARGUMENTS`를 대상 브랜치로 하는 task 보고서와 작업 문서를 만듭니다. **둘은 짝이므로 항상 함께 만듭니다.**

1. `git remote get-url origin`으로 `<repo>`(마지막 세그먼트, `.git` 제외)를 구합니다. remote가 없으면 쓸 폴더명을 사용자에게 묻고, 추측하지 않습니다.
2. 목표 경로는 `~/.claude/worklog/<repo>/tasks/$ARGUMENTS.md`와 `~/.claude/worklog/<repo>/tasks/$ARGUMENTS.work.md`입니다. 이미 있는 파일은 만들지 않고 그 사실만 보고합니다. 한쪽만 있으면 없는 쪽만 만듭니다.
3. 상위 폴더를 `mkdir -p`로 만든 뒤 `cp ~/.claude/templates/task.md <보고서 경로>`와 `cp ~/.claude/templates/task-work.md <작업 문서 경로>`로 복사합니다. **내용을 손으로 짜지 않습니다** — 템플릿을 그대로 복사하는 것이 이 커맨드의 목적입니다.
4. 보고서의 제목·요약·상태 표를 이번 작업 내용으로 채웁니다. `## ` 제목은 건드리지 않고, 해당 없는 섹션은 통째로 지웁니다.
5. 작업 문서는 제목과 `## 작업 목록`만 채웁니다. `## 진행`은 세션을 끊을 때, `## 검증`은 확인한 뒤에, `## 완료`는 사용자가 통과로 확인한 뒤에 씁니다. 이 시점에는 템플릿 자리 표시자를 그대로 둡니다.
6. 두 경로와 채운 내용을 사용자에게 제시하고 승인을 받습니다.
