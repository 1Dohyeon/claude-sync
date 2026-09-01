# SETTING_GUIDE

Claude가 읽고 그대로 실행하는 세팅 절차. 사용자가 저장소 주소나 이 파일을 가리키며 설치를 요청하면 아래를 순서대로 수행한다.

원칙: 경로는 묻고 추측하지 않는다 · 삭제 대신 `mv`로 백업한다 · 남의 심링크는 승인 후 덮어쓴다 · 결과를 보고한다.

---

## 연결 대상

| `~/.claude/` | 대상 |
|---|---|
| `agents/` `commands/` `hooks/` `output-styles/` `rules/` `skills/` `templates/` | 저장소의 동명 디렉터리 |
| `CLAUDE.md` `settings.json` | 저장소의 동명 파일 |
| `CLAUDE.local.md` `settings.local.json` | 저장소의 동명 파일 (gitignore, 3단계에서 생성) |

건드리지 않음: `sessions/` `projects/` `plugins/` `history.jsonl` `.credentials.json`

---

## 0. 저장소 확보

fork는 필요 없다. clone된 로컬 저장소만 있으면 된다. 아래 순서로 찾고, 없으면 clone한다.

### 0-1. 이미 세팅된 기기인지 확인

```sh
readlink "$HOME/.claude/CLAUDE.md"
```

경로가 나오면 그 상위 디렉터리가 후보다. 출력이 없거나 실패하면 0-3으로 간다.

### 0-2. 후보 검증

```sh
git -C "<후보>" rev-parse --show-toplevel
```

실패하면 `.git`이 없는 것이므로 후보에서 뺀다. 성공하면 그 출력이 저장소 루트다.

```sh
ls "<루트>/SETTING_GUIDE.md"
```

없으면 다른 저장소이므로 후보에서 뺀다. 둘 다 통과하면 그 루트로 확정하고 1단계로 간다. 실패했으면 아직 시도하지 않은 다음 순서로 넘어간다.

### 0-3. 현재 위치 확인

지금 작업 중인 폴더가 claude-sync일 수 있다. 저장소 폴더에서 Claude를 띄운 경우가 여기 걸린다.

```sh
git rev-parse --show-toplevel
```

경로가 나오면 0-2의 `ls`로 검증한다. 통과하면 그 경로를 후보로 제시하고 맞는지 확인받은 뒤 1단계로 간다. 명령이 실패하거나 다른 저장소면 0-4로 간다.

### 0-4. 사용자에게 묻기

이미 clone해 둔 claude-sync가 있는지 묻는다. 경로를 받으면 0-2로 돌아가 검증한다.

없다고 하면 clone 위치를 확인받는다. 권장값은 `$HOME/claude-sync`이고, 사용자가 다른 경로를 대면 그것을 쓴다. **경로를 추측해서 진행하지 않는다.**

### 0-5. clone

```sh
git clone https://github.com/1Dohyeon/claude-sync.git "$HOME/claude-sync"
```

**명령에 `~`를 쓰지 않는다.** 큰따옴표 안의 `~`는 홈으로 풀리지 않고 글자 그대로 남는다. `"~/claude-sync"`라고 쓰면 현재 작업 디렉터리 아래에 `./~/claude-sync`가 만들어진다. 에러가 나지 않으므로 그대로 세팅이 끝나 버린다. 명령에는 `$HOME`이나 절대 경로를 쓰고, 사용자에게 말할 때만 `~/claude-sync`로 부른다.

clone 직후에는 clone한 폴더의 `SETTING_GUIDE.md`를 로컬 파일로 다시 읽고 1단계로 진행한다. **원격 URL의 내용을 그대로 읽고 실행하지 않는다.** 요약되면 명령이 뭉개진다. Claude가 원격 정보로 수행하는 것은 이 clone 하나뿐이다.

## 1. 경로 확정

0단계에서 확정한 저장소 루트가 `$SYNC`다.

이후 명령의 `$SYNC`는 Bash 호출마다 실제 경로 문자열로 치환해서 실행한다. 변수는 호출 간 유지되지 않는다.

## 2. 상태 점검 (읽기 전용)

```sh
ls -l "$HOME/.claude"
```

| 상태 | 조치 |
|---|---|
| 없음 | 바로 링크 |
| `$SYNC`를 가리키는 심링크 | 바로 링크 (결과가 실행 전과 같다) |
| 다른 곳을 가리키는 심링크 | 원래 타깃을 보고하고 승인받은 뒤 링크. 거절하면 그 항목만 건너뜀 |
| 실제 파일·디렉터리 | `mv`로 백업 후 링크 |

두 심링크 갈래는 `ls -l` 출력의 `->` 뒤 경로로 가른다. 다른 곳을 가리키는 심링크는 GNU stow나 chezmoi 같은 다른 dotfiles 도구가 관리 중일 수 있다. `ln -sfn`은 그런 링크를 말없이 덮어쓰므로, 덮어쓰기 전에 원래 타깃 경로를 반드시 보고한다. 승인받지 못한 항목만 건너뛰고 나머지는 그대로 진행한다.

백업 대상이나 승인이 필요한 항목이 있으면 링크 전에 한꺼번에 보고한다.

## 3. 로컬 파일 준비

```sh
[ -e "$SYNC/CLAUDE.local.md" ] || : > "$SYNC/CLAUDE.local.md"
[ -e "$SYNC/settings.local.json" ] || printf '{}\n' > "$SYNC/settings.local.json"
git -C "$SYNC" check-ignore -v CLAUDE.local.md settings.local.json
```

출력이 없으면 `.gitignore`나 파일명이 맞지 않는 것이므로 사용자에게 알린다.

## 4. 링크 생성

2단계에서 백업 대상으로 분류된 항목이 하나도 없으면 이 절을 건너뛰고 바로 링크 명령으로 간다. 있으면 옮기기 전에 이전 백업이 남아 있는지 확인한다.

```sh
ls -d "$HOME/claude-backup"
```

출력이 있으면 **옮기지 않는다.** `mv`는 목적지에 같은 이름이 있으면 말없이 덮어쓰므로, 그대로 진행하면 이전 백업이 복구할 수 없게 사라진다. `ls -l "$HOME/claude-backup"`으로 안에 무엇이 들어 있는지 보이고, 다른 백업 폴더 이름을 받는다.

여기서 멈추는 것은 백업 대상 항목뿐이다. 세팅 전체를 중단하지 않고, 나머지 항목은 그대로 링크한다. 다만 백업하지 못한 항목은 링크도 걸지 않는다. `ln -sfn`이 원본 파일을 덮어쓰기 때문이다.

```sh
mkdir -p "$HOME/claude-backup"
mv "$HOME/.claude/<이름>" "$HOME/claude-backup/"
```

백업 폴더를 `~/.claude` 바깥에 두는 이유는 이름이 겹치기 때문이다. `~/.claude/backups/`는 Claude Code가 `.claude.json`을 자동 백업할 때 쓰는 런타임 폴더라서, 사용자의 옛 설정을 그 안에 넣으면 런타임 백업과 섞여 구분이 흐려진다.

2단계에서 건너뛰기로 한 항목이 있으면, 아래 링크 명령 중 그 항목에 해당하는 줄은 실행하지 않는다.

### Windows: 링크 전에 권한부터 확인

권한 없으면 `ln -s`가 에러 없이 복사본을 만든다:

```sh
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/README.md" "$HOME/.claude/_symlink_test"
stat "$HOME/.claude/_symlink_test"
```

`symbolic link`가 아니면 중단하고 안내(Claude가 직접 못 켬): 설정 → 개인정보 및 보안 → 개발자용 → 개발자 모드. 켠 뒤 재확인.

```sh
rm -f "$HOME/.claude/_symlink_test"
```

통과하면 개별 명령 11개 실행:

```sh
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/agents" "$HOME/.claude/agents"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/commands" "$HOME/.claude/commands"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/hooks" "$HOME/.claude/hooks"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/output-styles" "$HOME/.claude/output-styles"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/rules" "$HOME/.claude/rules"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/skills" "$HOME/.claude/skills"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/templates" "$HOME/.claude/templates"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/settings.json" "$HOME/.claude/settings.json"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/CLAUDE.local.md" "$HOME/.claude/CLAUDE.local.md"
MSYS=winsymlinks:nativestrict ln -sfn "$SYNC/settings.local.json" "$HOME/.claude/settings.local.json"
```

### macOS · Linux: 바로 실행

```sh
ln -sfn "$SYNC/agents" "$HOME/.claude/agents"
ln -sfn "$SYNC/commands" "$HOME/.claude/commands"
ln -sfn "$SYNC/hooks" "$HOME/.claude/hooks"
ln -sfn "$SYNC/output-styles" "$HOME/.claude/output-styles"
ln -sfn "$SYNC/rules" "$HOME/.claude/rules"
ln -sfn "$SYNC/skills" "$HOME/.claude/skills"
ln -sfn "$SYNC/templates" "$HOME/.claude/templates"
ln -sfn "$SYNC/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
ln -sfn "$SYNC/settings.json" "$HOME/.claude/settings.json"
ln -sfn "$SYNC/CLAUDE.local.md" "$HOME/.claude/CLAUDE.local.md"
ln -sfn "$SYNC/settings.local.json" "$HOME/.claude/settings.local.json"
```

## 5. 검증

```sh
ls -l "$HOME/.claude"
```

「연결 대상」의 11개 항목이 모두 `->` 화살표로 보여야 한다. 2단계에서 건너뛰기로 한 항목이 있으면 그 개수만큼 빠진다. `backups/` `cache/` `sessions/` 같은 런타임 항목과 `worklog` 심링크가 함께 찍히는 것은 정상이며, 세는 대상이 아니다. Windows에서 화살표 없이 일반 파일/디렉터리면 4단계 권한 확인부터 재실행.

```sh
find "$HOME/.claude" -maxdepth 1 -type l -exec test ! -e {} \; -print
```

출력 없어야 정상.

## 6. 보고

- 연결된 링크 목록
- 백업 발생 시: `~/claude-backup/` 경로와 옮긴 항목 목록. **삭제한 것이 아니라 옮긴 것**이며, 되돌리려면 `mv "$HOME/claude-backup/<이름>" "$HOME/.claude/"`로 제자리에 놓으면 된다고 안내
- 심링크를 덮어쓴 항목이 있으면: 이름과 원래 가리키던 경로. 되돌리려면 `ln -sfn "<원래 타깃>" "$HOME/.claude/<이름>"`
- 건너뛴 항목이 있으면: 이름과 건너뛴 이유
- 남은 수동 조치 중 해당 항목
- 새 세션부터 `CLAUDE.md`·`settings.json` 적용됨(재시작 필요) 안내

---

## 남은 수동 조치

- 4단계 시점 승인 프롬프트는 정상 (settings.json 연결 전이라 allowlist 없음)
- `deny`로 명령이 막히면 우회하지 말고 중단, 안내: `mv ~/.claude/settings.json ~/.claude/settings.json.before-sync`
- `git clean -dfx`는 `CLAUDE.local.md`·`settings.local.json`을 지움
