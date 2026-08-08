# SETTING_GUIDE

**이 문서는 Claude가 읽고 그대로 실행하는 세팅 절차서다.** 사용자는 이 저장소를 clone하고 Claude Code에 로그인한 뒤 "SETTING_GUIDE.md 읽고 실행해줘"라고만 말한다.
나머지는 Claude가 아래 순서대로 수행한다.

핵심 원칙 세 가지:

- **삭제하지 않는다** — 자리를 비켜야 할 때는 `rm`이 아니라 `mv`로 백업한다.
- **링크 걸기 전에 상태를 먼저 본다** — `ln -sfn`은 실패해도 조용하다(아래 "왜 검사가 필요한가" 참고).
- **결과를 사용자에게 보고한다** — 특히 백업이 발생했으면 반드시 알린다.

---

## 무엇을 어디로 연결하는가

`~/.claude/`는 실제 폴더로 두고, 그 안의 **아래 항목만** 저장소로 심링크한다.
Claude Code는 항상 `~/.claude/` 고정 경로에서 읽으므로, 저장소를 어디에 clone하든 심링크가 위치 차이를 흡수한다.

| `~/.claude/` 안의 이름 | 연결 대상 | 비고 |
|---|---|---|
| `agents/` `commands/` `hooks/` `rules/` `templates/` | 이 저장소의 동명 디렉터리 | |
| `CLAUDE.md` `settings.json` | 이 저장소의 동명 파일 | |
| `CLAUDE.local.md` `settings.local.json` | 이 저장소의 동명 파일 | gitignore 대상 — 3단계 참고 |
| `worklog/` | worklog 저장소(별도, private) | 없으면 건너뜀 |

기기 전용 오버라이드 두 개(`CLAUDE.local.md`, `settings.local.json`)도 저장소를 거쳐 연결한다.
**gitignore 대상이라 내용은 커밋되지 않고 기기마다 다르다** — 공유되는 건 "그 자리에 파일이 있다"는 구조뿐이고, 대신 편집 지점이 저장소 폴더 하나로 통일된다.
새 기기에는 clone 직후 이 파일들이 없으므로, **링크보다 먼저 저장소 안에 만드는 것(3단계)이 순서상 중요하다.**

연결하지 **않는** 것은 `sessions/` `projects/` `plugins/` `history.jsonl` `.credentials.json` 등 Claude Code 런타임이다. 건드리지 않는다.

---

## 실행 절차

### 1. 경로 확정

- **저장소 루트** — 이 파일이 있는 저장소의 절대경로를 `git rev-parse --show-toplevel`로 직접 구하고, 사용자에게 묻지 않는다.
- **worklog 경로** — worklog 저장소를 clone해 뒀는지 사용자에게 묻는다.
- 안 쓴다고 하면 worklog 링크만 건너뛰고 나머지는 그대로 진행한다.

### 2. 현재 상태 점검 (읽기 전용)

```sh
ls -l "$HOME/.claude"
```

연결 대상 10개 이름 각각이 아래 넷 중 무엇인지 분류한다.

| 현재 상태 | 조치 |
|---|---|
| 없음 | 바로 링크 |
| 이미 심링크 | 바로 링크 (`-f`가 링크만 갈아끼움) |
| **실제 파일** | **백업 후** 링크 |
| **실제 디렉터리** | **백업 후** 링크 |

백업이 필요한 항목이 하나라도 있으면 **링크 걸기 전에 사용자에게 목록을 보고**한다.
새 기기에서는 대개 전부 "없음"이라 이 단계는 조용히 지나간다.

### 3. 기기 전용 파일 준비 (저장소 안)

clone 직후엔 gitignore된 이 두 파일이 없으므로 **링크보다 먼저** 저장소 안에 만든다.
이미 있으면 건드리지 않는다 — 기존 내용을 덮어쓰면 안 된다.

```sh
SYNC="/절대경로/claude-sync"

[ -e "$SYNC/CLAUDE.local.md" ]     || : > "$SYNC/CLAUDE.local.md"
[ -e "$SYNC/settings.local.json" ] || printf '{}\n' > "$SYNC/settings.local.json"
```

`settings.local.json`은 빈 파일이 아니라 `{}`로 만든다. 0바이트는 유효한 JSON이 아니다.

만든 뒤 두 파일이 실제로 ignore되는지 확인한다.
출력이 없으면 `.gitignore` 규칙과 파일명이 어긋난 것이므로 사용자에게 알린다 — 대소문자 불일치가 흔한 원인이고, 이름은 정확히 `CLAUDE.local.md`여야 한다.

```sh
git -C "$SYNC" check-ignore -v CLAUDE.local.md settings.local.json
```

### 4. 링크 생성

`SYNC`·`WORKLOG`를 1단계에서 구한 절대경로로 채운 뒤 실행한다. worklog를 안 쓰면 `WORKLOG=""`로 둔다.

```sh
SYNC="/절대경로/claude-sync"
WORKLOG="/절대경로/worklog"
BACKUP="$HOME/.claude/backups/pre-symlink"

mkdir -p "$HOME/.claude"
for name in agents commands hooks rules templates \
            CLAUDE.md settings.json CLAUDE.local.md settings.local.json; do
    dst="$HOME/.claude/$name"
    if [ -e "$dst" ] && [ ! -L "$dst" ]; then
        mkdir -p "$BACKUP"
        mv "$dst" "$BACKUP/"
    fi
    ln -sfn "$SYNC/$name" "$dst"
done

if [ -n "$WORKLOG" ]; then
    dst="$HOME/.claude/worklog"
    if [ -e "$dst" ] && [ ! -L "$dst" ]; then
        mkdir -p "$BACKUP"
        mv "$dst" "$BACKUP/"
    fi
    ln -sfn "$WORKLOG" "$dst"
fi
```

`[ -e ] && [ ! -L ]` 조합이 "실제 파일·디렉터리일 때만 백업"을 뜻한다.
이미 심링크면(깨진 링크 포함) 백업하지 않고 `ln -sfn`이 링크만 교체한다.

### 5. 검증

```sh
ls -l "$HOME/.claude"
```

연결 대상이 전부 `->` 화살표로 보여야 한다(worklog 미사용 시 9개, 사용 시 10개).
이어서 깨진 링크가 없는지 확인한다 — 아무것도 출력되지 않아야 정상이다.

```sh
find "$HOME/.claude" -maxdepth 1 -type l -exec test ! -e {} \; -print
```

### 6. 보고

사용자에게 아래를 보고한다.

- 연결된 링크 목록 (몇 개, 어디로)
- **백업된 항목이 있으면 그 경로와 목록** — 기존 설정이 들어있을 수 있으니 병합할지 물어본다
- worklog를 건너뛰었으면 그 사실
- 아래 "남은 수동 조치" 중 해당되는 항목

세팅 직후 새 세션부터 `CLAUDE.md`·`settings.json`이 적용된다.
실행 중인 세션에는 반영되지 않으므로 사용자에게 세션 재시작을 안내한다.

---

## 남은 수동 조치

Claude가 자동으로 처리하지 않는 것들이다. 해당되면 보고 단계에서 안내한다.

- **권한 프롬프트** — 4단계 실행 시점엔 `settings.json`이 아직 연결 전이라 allowlist가 없으므로 승인 프롬프트가 뜨는 게 정상이다.
- **기존 `settings.json`의 `deny` 규칙** — 프롬프트가 아니라 **차단**으로 명령이 실패하면(`ln`·`mv`·`mkdir` 등) 그 `permissions.deny`가 원인이다.
- `deny`는 승인으로 통과시킬 수 없으니 스스로 우회하지 말고, 아래를 안내한 뒤 세팅을 중단한다.
  ```sh
  mv ~/.claude/settings.json ~/.claude/settings.json.before-sync
  ```
- **`settings.json`의 절대경로** — `extraKnownMarketplaces`의 gitkraken 경로가 특정 사용자 홈으로 하드코딩돼 있어, 다른 기기·다른 사용자명이면 안 맞는다.
- **worklog 저장소** — private이라 별도 clone·권한이 필요하다.
- **`git clean -dfx` 주의** — `CLAUDE.local.md`·`settings.local.json`은 gitignore 대상이라 이 명령에 지워진다.

---

## 왜 상태 검사가 필요한가

`ln -sfn`은 대상이 이미 있을 때 **에러 없이 잘못 동작한다.** 실측 결과는 이렇다.

- **대상이 실제 파일**이면 `-f`가 그 파일을 조용히 지우고 링크로 바꾼다 — 백업도 경고도 없다.
- `settings.json`이 이 경우에 걸리면 기존 설정이 그대로 사라진다.
- **대상이 실제 디렉터리**면 덮어쓰지 않고 **그 디렉터리 안에** 링크를 만든다 (`~/.claude/agents/agents`).
- `-n`은 대상이 *심링크*일 때만 작동하고 실제 디렉터리에는 통하지 않아, 명령은 exit 0으로 끝나지만 설정은 하나도 적용되지 않는다.

둘 다 조용히 실패하므로, 링크 전 분류(2단계)와 링크 후 검증(5단계)이 이 절차의 핵심이다.
