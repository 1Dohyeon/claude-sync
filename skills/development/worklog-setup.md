# worklog 최초 연결

`~/.claude/worklog`가 아직 없을 때만 읽는다. 연결된 뒤의 사용 규칙은 [`worklog.md`](./worklog.md).

## 1. 위치 결정

로컬로 시작할지, git으로 관리되는(다른 기기와 공유하는) 저장소를 연결할지 사용자에게 묻는다.

- **로컬**: `claude-sync` 저장소(`$SYNC`)와 형제 위치를 기본값으로 제시하고 확인받는다 — 예: `$(dirname "$SYNC")/worklog`. 추측해서 바로 쓰지 않는다.
- **git**: 기존 private 저장소의 **절대경로를 사용자에게 직접 묻는다.** 스스로 찾아 나서지 않는다 — 안 주면 다시 묻는다. 새로 만들지 않고 이미 clone된 곳을 가리킨다.

→ 이후 `$WORKLOG`.

## 2. 실체 준비

- **로컬을 골랐으면**: `$WORKLOG` 경로에 빈 디렉터리를 만든다(`mkdir -p`). git 저장소로 만들지 않는다.
- **git을 골랐으면**: 이미 존재하는 경로이므로 아무것도 만들지 않는다.

## 3. 상태 점검

```sh
ls -l "$HOME/.claude/worklog"
```

| 상태 | 조치 |
|---|---|
| 없음 / 이미 심링크 | 바로 링크 |
| 실제 파일·디렉터리 | `mv`로 백업 후 링크 |

백업 필요하면 링크 전에 보고한다.

## 4. 링크 생성

### Windows — 링크 전에 권한부터 확인

권한 없으면 `ln -s`가 에러 없이 복사본을 만든다. `~/.claude` 안에 이미 다른 심링크가 있으면(메인 SETTING_GUIDE로 세팅된 기기) 이 확인은 생략한다.

```sh
MSYS=winsymlinks:nativestrict ln -sfn "$HOME/.claude" "$HOME/.claude/_symlink_test"
stat "$HOME/.claude/_symlink_test"
```

`symbolic link`가 아니면 중단하고 안내(Claude가 직접 못 켬): 설정 → 개인정보 및 보안 → 개발자용 → 개발자 모드. 켠 뒤 재확인.

```sh
rm -f "$HOME/.claude/_symlink_test"
```

통과하면:

```sh
MSYS=winsymlinks:nativestrict ln -sfn "$WORKLOG" "$HOME/.claude/worklog"
```

### macOS · Linux

```sh
ln -sfn "$WORKLOG" "$HOME/.claude/worklog"
```

## 5. 검증

```sh
ls -l "$HOME/.claude/worklog"
```

`->` 화살표로 `$WORKLOG`를 가리켜야 한다.

## 6. 보고

- 연결 결과 (로컬/git 여부, `$WORKLOG` 경로, `~/.claude/worklog` 연결됨)
- 백업 발생 시 경로·목록 — 병합 여부 확인
