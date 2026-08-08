# worklog 최초 연결

`~/.claude/worklog`를 worklog 저장소(별도, private)로 심링크 연결하는 절차. 연결된 뒤의 사용 규칙은 `rules/worklog.md`.

## 1. 경로 확인

worklog 저장소의 **절대경로를 사용자에게 직접 묻는다.** 스스로 찾아 나서지 않는다 — 안 주면 다시 묻는다.

→ `$WORKLOG`

## 2. 상태 점검

```sh
ls -l "$HOME/.claude/worklog"
```

| 상태 | 조치 |
|---|---|
| 없음 / 이미 심링크 | 바로 링크 |
| 실제 파일·디렉터리 | `mv`로 백업 후 링크 |

백업 필요하면 링크 전에 보고한다.

## 3. 링크 생성

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

## 4. 검증

```sh
ls -l "$HOME/.claude/worklog"
```

`->` 화살표로 `$WORKLOG`를 가리켜야 한다.

## 5. 보고

- 연결 결과 (`$WORKLOG` 경로)
- 백업 발생 시 경로·목록 — 병합 여부 확인
