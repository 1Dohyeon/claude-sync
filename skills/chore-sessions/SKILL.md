---
description: Claude Code 세션 기록 폴더(`~/.claude/projects`)를 비울 때 사용한다. 지금 실행 중인 세션의 폴더만 남기고 나머지 폴더를 프로젝트별 memory까지 모두 지운 뒤, orca 사이드바의 세션 기록에 반영되도록 orca 재시작을 안내한다. macOS와 Windows를 구분해 처리한다.
when_to_use: '예: "세션 정리해줘", "projects 폴더 비워줘", "chore-sessions"'
---

# 세션 기록 정리

[`rules/workflow.md`](../../rules/workflow.md)의 5단계 다음 진행되는, 세션 기록 정리 고유의 규칙이다. 1단계(`projects` 정리)는 Claude가 직접 하고, 2단계(orca 사이드바 반영)는 orca 재시작을 사용자에게 안내한다.

## OS와 경로

환경 정보의 Platform 값으로 OS를 가른다. `CLAUDE_CONFIG_DIR`이 설정돼 있으면 `~/.claude` 대신 그 폴더를 쓴다.

| 항목 | macOS (`darwin`) | Windows (`win32`) |
| --- | --- | --- |
| 정리 대상 | `~/.claude/projects` | `%USERPROFILE%\.claude\projects` |
| 실행 중인 세션 기록 | `~/.claude/sessions/<pid>.json` | `%USERPROFILE%\.claude\sessions\<pid>.json` |
| orca 데이터 | `~/Library/Application Support/orca` | `%APPDATA%\orca` |

Windows에서 Bash 도구로 PowerShell 명령을 부를 때는 `powershell.exe -NoProfile -Command "..."`로 감싼다. 명령 안에 `$`를 쓰지 않는 형태로 적어야 Bash가 변수로 바꾸지 않는다.

## 1단계: projects 정리 (Claude가 직접)

orca가 켜져 있어도 진행한다. transcript는 Claude Code가 쓰는 파일이라 orca가 되살리지 않는다.

1. `~/.claude/sessions/*.json`을 `Read`로 읽어 `pid`, `sessionId`, `cwd`를 모은다.
2. 프로세스가 살아 있는 것만 실행 중인 세션으로 인정한다. 비정상 종료된 세션의 파일이 남아 있을 수 있다.
   - macOS: `ps -p <pid> -o pid=` (출력이 있으면 살아 있다)
   - Windows: `powershell.exe -NoProfile -Command "Get-Process -Id <pid>"` (오류가 나지 않으면 살아 있다)
3. 실행 중인 세션마다 남길 폴더를 정한다. 아래 둘 중 하나라도 맞으면 남긴다.
   - `projects/*/<sessionId>.jsonl`이나 `projects/*/<sessionId>/`가 들어 있는 폴더 (`Glob`으로 찾는다)
   - `cwd`의 영숫자가 아닌 글자를 모두 `-`로 바꾼 이름의 폴더 (예: `/Users/me/a.b` → `-Users-me-a-b`, `C:\Users\me` → `C--Users-me`)
4. `projects` 바로 아래의 폴더 목록과 폴더별 크기를 구한다(macOS `du -sh <경로>`, Windows `Get-ChildItem`으로 합산). 폴더가 아닌 파일(`.DS_Store` 등)은 대상이 아니다.
5. 표로 보여 주고 승인을 받는다. 표에는 폴더 이름, 크기, 남김 또는 삭제, 남기는 이유(어느 세션인지)를 적고 지울 총량을 덧붙인다.
6. 승인받은 폴더를 지운다. 휴지통을 거치지 않고 바로 지운다.
   - macOS: `rm -rf "<절대경로1>" "<절대경로2>" ...`
   - Windows: `powershell.exe -NoProfile -Command "Remove-Item -LiteralPath '<절대경로>' -Recurse -Force"`
7. `projects`를 다시 나열해 남은 폴더가 5에서 남긴다고 한 것과 같은지 확인하고 보고한다.

### 지우기 전에 확인할 것

되살릴 수 없으므로, 지우는 명령을 만들기 전에 경로마다 아래를 확인한다. 하나라도 어긋나면 그 경로는 지우지 않고 보고한다.

- 경로가 `projects` 폴더 자체가 아니고, 그 바로 아래에 있는 폴더다.
- 폴더 이름이 비어 있지 않고 `.`이나 `..`이 아니다.
- 심볼릭 링크가 아니다(`ls -la`의 `l` 표시, Windows는 `Attributes`의 `ReparsePoint`).
- 변수로 조립하지 않은 절대경로를 그대로 넘긴다.

### 건드리지 않는 것

- `~/.claude/projects` 밖의 모든 것. 전역 설정(`CLAUDE.md`, `rules/`, `skills/`, `settings.json`)과 `history.jsonl`, `sessions/`, `file-history/`를 포함한다.
- 실행 중인 세션의 폴더 전체. 그 안의 옛 jsonl과 `memory/`도 함께 남는다.

## 2단계: orca 사이드바 반영 (사용자에게 안내)

orca 오른쪽 사이드바의 agent 세션 기록은 `ai-vault/session-search.sqlite`(검색 색인)에서 읽고, 이 색인은 `projects`의 transcript로 만들어진다. transcript를 지워도 실행 중인 orca의 사이드바에는 바로 반영되지 않을 수 있다.

1. orca를 한 번 종료했다가 다시 켜라고 안내한다(macOS `Cmd+Q`, Windows 트레이 아이콘까지 종료).
2. 다시 켠 뒤에도 지운 세션이 사이드바에 남아 있다고 하면, orca를 종료한 상태에서 `ai-vault`의 캐시 파일을 지우고 다시 켜게 한다. orca가 켜져 있으면 열린 파일을 지워도 화면이 바뀌지 않으므로, 종료를 확인한 뒤에만 지운다.
   - 대상: `session-search.sqlite`, `session-parse-cache.sqlite`와 각각의 `-shm`, `-wal` 파일
   - 다시 켜면 orca가 transcript로 색인을 새로 만든다.

orca의 다른 데이터(`profiles/*/profile-state.db`, `agent-session-journal.db` 등)는 정리 대상이 아니다. 특히 `profile-state.db`의 탭 복원 포인터(`sleepingAgentSessionsByPaneKey`)는 지워도 orca를 다시 켜면 되살아나므로 고치지 않는다.
