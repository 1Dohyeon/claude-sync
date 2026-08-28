---
description: 글로벌 Claude 설정(CLAUDE.md, settings.json, rules/, skills/, hooks/, commands/, agents/, templates/)을 수정해달라는 요청을 받았을 때 사용한다. ~/.claude/ 경로가 심링크라 그 경로에서 직접 고치면 승인해도 실제로 반영되지 않을 때가 있다.
---

# 글로벌 Claude 설정 수정

`~/.claude/` 안의 `CLAUDE.md`, `settings.json`, `rules/`, `skills/`, `hooks/`, `commands/`, `agents/`, `templates/`는 전부 clone된 저장소(`claude-sync`)로의 심링크다. **`~/.claude/` 경로에서 직접 고치지 않는다** — 심링크 경로에서 수정하면 승인해도 실제로 반영되지 않을 때가 있다.

1. `ls -l ~/.claude/CLAUDE.md`로 실제 저장소 경로를 확인한다.
2. 그 원본 파일을 고친다.
