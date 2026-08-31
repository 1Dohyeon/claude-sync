---
description: task 문서 생성 (템플릿 복사)
argument-hint: <대상 브랜치>
allowed-tools: Bash(git remote get-url:*), Bash(mkdir:*), Bash(cp:*), Bash(ls:*)
---

`$ARGUMENTS`를 대상 브랜치로 하는 task 문서를 만듭니다.

1. `git remote get-url origin`으로 `<repo>`(마지막 세그먼트, `.git` 제외)를 구합니다. remote가 없으면 쓸 폴더명을 사용자에게 묻고, 추측하지 않습니다.
2. 목표 경로는 `~/.claude/worklog/<repo>/tasks/$ARGUMENTS.md`입니다. 이미 있으면 만들지 않고 그 사실만 보고합니다.
3. 상위 폴더를 `mkdir -p`로 만든 뒤 `cp ~/.claude/templates/task.md <경로>`로 복사합니다. **내용을 손으로 짜지 않습니다.** 템플릿을 그대로 복사하는 것이 이 커맨드의 목적입니다.
4. 제목·요약·상태 표와 `## 지금 무엇이 문제인가`부터 `## 확인 방법`까지, 그리고 `## 작업 목록`을 이번 작업 내용으로 채웁니다. `## ` 제목은 건드리지 않고, 해당 없는 섹션은 통째로 지웁니다. `## 진행`·`## 검증`·`## 완료`는 이 시점엔 템플릿 자리 표시자를 그대로 둡니다.
5. 경로와 채운 내용을 사용자에게 제시하고 승인을 받습니다.
