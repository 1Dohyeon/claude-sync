# SETTING_GUIDE

Claude가 읽고 그대로 실행하는 세팅 절차. 사용자가 "SETTING_GUIDE.md 읽고 실행해줘"라고 하면 아래를 순서대로 수행한다.

원칙: 삭제 대신 `mv`로 백업 · 링크 전 상태 확인 · 결과 보고.

---

## 연결 대상

| `~/.claude/` | 대상 |
|---|---|
| `agents/` `commands/` `hooks/` `rules/` `templates/` | 저장소의 동명 디렉터리 |
| `CLAUDE.md` `settings.json` | 저장소의 동명 파일 |
| `CLAUDE.local.md` `settings.local.json` | 저장소의 동명 파일 (gitignore, 3단계에서 생성) |
| `worklog/` | worklog 저장소 (없으면 건너뜀) |

건드리지 않음: `sessions/` `projects/` `plugins/` `history.jsonl` `.credentials.json`

---

## 1. 경로 확정

```sh
git rev-parse --show-toplevel
```

→ `$SYNC`. worklog clone 여부를 사용자에게 묻는다 → `$WORKLOG` (없으면 이후 worklog 스킵).

이후 명령의 `$SYNC`·`$WORKLOG`는 Bash 호출마다 실제 경로 문자열로 치환해서 실행한다 — 변수는 호출 간 유지되지 않는다.

## 2. 상태 점검 (읽기 전용)

```sh
ls -l "$HOME/.claude"
```

| 상태 | 조치 |
|---|---|
| 없음 / 이미 심링크 | 바로 링크 |
| 실제 파일·디렉터리 | `mv`로 백업 후 링크 |

백업 대상 있으면 링크 전에 보고한다.

## 3. 로컬 파일 준비

```sh
[ -e "$SYNC/CLAUDE.local.md" ] || : > "$SYNC/CLAUDE.local.md"
[ -e "$SYNC/settings.local.json" ] || printf '{}\n' > "$SYNC/settings.local.json"
git -C "$SYNC" check-ignore -v CLAUDE.local.md settings.local.json
```

출력 없으면 `.gitignore`/파일명 불일치 — 사용자에게 알린다.

## 4. 링크 생성

2단계에서 백업 대상으로 분류된 항목만 먼저:

```sh
mkdir -p "$HOME/.claude/backups/pre-symlink"
mv "$HOME/.claude/<이름>" "$HOME/.claude/backups/pre-symlink/"
```

### Windows — 링크 전에 권한부터 확인

권한 없으면 `ln -s`가 에러 없이 복사본을 만든다:

```sh
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/README.md" "$HOME/.claude/_symlink_test"
stat "$HOME/.claude/_symlink_test"
```

`symbolic link`가 아니면 중단하고 안내(Claude가 직접 못 켬): 설정 → 개인정보 및 보안 → 개발자용 → 개발자 모드. 켠 뒤 재확인.

```sh
rm -f "$HOME/.claude/_symlink_test"
```

통과하면 개별 명령 10개 실행:

```sh
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/agents" "$HOME/.claude/agents"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/commands" "$HOME/.claude/commands"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/hooks" "$HOME/.claude/hooks"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/rules" "$HOME/.claude/rules"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/templates" "$HOME/.claude/templates"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/settings.json" "$HOME/.claude/settings.json"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/CLAUDE.local.md" "$HOME/.claude/CLAUDE.local.md"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/settings.local.json" "$HOME/.claude/settings.local.json"
MSYS=winsymlinks:nativestrict ln -sfn "$WORKLOG" "$HOME/.claude/worklog"
```

### macOS · Linux — 바로 실행

```sh
ln -sfn "$SYNC/agents" "$HOME/.claude/agents"
ln -sfn "$SYNC/commands" "$HOME/.claude/commands"
ln -sfn "$SYNC/hooks" "$HOME/.claude/hooks"
ln -sfn "$SYNC/rules" "$HOME/.claude/rules"
ln -sfn "$SYNC/templates" "$HOME/.claude/templates"
ln -sfn "$SYNC/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
ln -sfn "$SYNC/settings.json" "$HOME/.claude/settings.json"
ln -sfn "$SYNC/CLAUDE.local.md" "$HOME/.claude/CLAUDE.local.md"
ln -sfn "$SYNC/settings.local.json" "$HOME/.claude/settings.local.json"
ln -sfn "$WORKLOG" "$HOME/.claude/worklog"
```

두 OS 모두 worklog 미사용 시 마지막 명령 생략.

## 5. 검증

```sh
ls -l "$HOME/.claude"
```

전부 `->` 화살표 (worklog 없으면 9개, 있으면 10개). Windows에서 화살표 없이 일반 파일/디렉터리면 4단계 권한 확인부터 재실행.

```sh
find "$HOME/.claude" -maxdepth 1 -type l -exec test ! -e {} \; -print
```

출력 없어야 정상.

## 6. 보고

- 연결된 링크 목록
- 백업 발생 시 경로·목록 — 병합 여부 확인
- worklog 스킵 여부
- 남은 수동 조치 중 해당 항목
- 새 세션부터 `CLAUDE.md`·`settings.json` 적용됨(재시작 필요) 안내

---

## 남은 수동 조치

- 4단계 시점 승인 프롬프트는 정상 (settings.json 연결 전이라 allowlist 없음)
- `deny`로 명령이 막히면 우회하지 말고 중단, 안내: `mv ~/.claude/settings.json ~/.claude/settings.json.before-sync`
- 새 절대경로·기기별 값은 `settings.json`이 아니라 `settings.local.json`에 (`CLAUDE.md`의 SETTINGS RULE)
- worklog는 private, 별도 clone·권한 필요
- `git clean -dfx`는 `CLAUDE.local.md`·`settings.local.json`을 지움
