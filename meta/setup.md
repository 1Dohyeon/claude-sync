# 연결 방법

1. 저장소를 원하는 위치에 clone합니다.
2. 기존 `~/.claude/`가 있으면 백업하거나 이름을 바꿉니다.
3. `~/.claude/`를 clone한 저장소의 **루트 디렉터리**로 심링크합니다.

완료되면 `~/.claude/`가 clone한 저장소 로컬을 그대로 가리키게 됩니다.

## Windows PowerShell

```powershell
Rename-Item $env:USERPROFILE\.claude .claude.backup
New-Item -ItemType SymbolicLink -Path $env:USERPROFILE\.claude -Target <???>
```

## macOS / Linux

```bash
mv ~/.claude ~/.claude.backup
ln -s <???> ~/.claude
```
