---
description: Claude Code 세션 기록 폴더(`~/.claude/projects`)에서 지금 세션만 남기고 모두 지운 뒤, orca 사이드바 반영 방법을 안내한다.
when_to_use: '예: "세션 정리해줘", "projects 폴더 비워줘", "chore-sessions"'
---

# 세션 기록 정리

[`rules/workflow.md`](../../rules/workflow.md)의 5단계 위에서 진행되는, 세션 기록 정리 고유의 규칙이다. 지금 세션을 뺀 모든 기록은 더는 필요 없으므로 묻지 않고 바로 지운다. 지금 세션만 남기는 이유는 실행 중인 transcript를 지워 오류가 나는 것을 막기 위해서다.

## 경로

`CLAUDE_CONFIG_DIR`이 설정돼 있으면 `~/.claude` 대신 그 폴더를 쓴다.

| 항목 | macOS (`darwin`) | Windows (`win32`) |
| --- | --- | --- |
| 정리 대상 | `~/.claude/projects` | `%USERPROFILE%\.claude\projects` |
| orca 데이터 | `~/Library/Application Support/orca` | `%APPDATA%\orca` |

Windows에서는 `powershell.exe -NoProfile -Command "..."`로 감싸고, 명령 안에 `$`를 쓰지 않는다.

## 1단계: projects 정리

1. `printenv CLAUDE_CODE_SESSION_ID`로 지금 세션의 ID를 얻고, `projects/*/<sessionId>.jsonl`이 든 폴더를 `Glob`으로 찾는다.
2. 그 폴더의 `<sessionId>.jsonl`과 `<sessionId>/`만 남기고 `projects` 아래의 나머지 폴더와 항목을 모두 지운다.
   - macOS: `rm -rf "<절대경로1>" "<절대경로2>" ...`
   - Windows: `powershell.exe -NoProfile -Command "Remove-Item -LiteralPath '<절대경로>' -Recurse -Force"`
3. 작업 전 미리 묻지 않고, 작업 이후에 다시 나열해 지금 세션의 것만 남았는지 확인하고 짧게 보고한다.

## 2단계: orca 사이드바 반영

사용자에게 orca를 끄고 아래 명령을 입력한 뒤 다시 켜라고 채팅으로 제시만 한다.

macOS:

```
rm -f ~/Library/Application\ Support/orca/ai-vault/session-{search,parse-cache}.sqlite{,-shm,-wal}
```

Windows:

```
powershell.exe -NoProfile -Command "Remove-Item -Path (Join-Path ([Environment]::GetFolderPath('ApplicationData')) 'orca\ai-vault\session-*.sqlite*') -Force"
```
