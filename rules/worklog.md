# worklog 기록 규칙

작업 기록·이어받기·완료 처리 규칙이다. 작업 유형과 무관하게 적용된다 — 개발이든 아니든 기록 방식은 같다.
개발 고유 규칙은 `~/.claude/rules/development.md`에 있다.

## 위치

기록 위치는 **어느 기기에서든 `~/.claude/worklog/`** 다. 이 경로 밖에 task 문서를 만들지 않는다.

- worklog 저장소를 어디에 clone했든 `~/.claude/worklog`가 심링크로 그 위치를 흡수하므로, 실제 clone 경로를 찾아 나서지 않는다.
- 작업 중인 코드 저장소 안에 task 문서를 만들지 않는다 — 남의 저장소를 오염시킨다.
- worklog는 git 저장소로 clone되어 있다고 전제한다 — 커밋·푸시는 세션 종료 훅(`hooks/save-docs.sh`)이 처리하므로 Claude는 Read/Write만 한다.

키는 매번 직접 계산한다. 이전 세션에서 본 값을 기억해 재사용하지 않는다.

- `<repo>` = `git remote get-url origin`의 마지막 세그먼트(`.git` 제외)
- `<branch>` = `git rev-parse --abbrev-ref HEAD`
- 기록 공간 = `~/.claude/worklog/<repo>/`

조회 순서는 이렇다.

1. `~/.claude/worklog/<repo>/overview.md`를 Read → 있으면 읽고 시작한다.
2. 없으면 그 repo의 첫 작업이므로, 공간을 만들지 사용자에게 확인한다.
3. `~/.claude/worklog` 자체가 없으면 아직 세팅이 안 된 기기이므로, 임의로 만들거나 다른 경로로 우회하지 않고 사용자에게 알린다. 사용자가 연결을 원하면 `~/.claude/rules/worklog-setup.md`를 Read해서 그 절차를 따른다.

## 작업 시작

- 세션 첫 요청에서 `overview.md`와 현재 브랜치의 `tasks/<branch>.md`를 안 읽고 시작하지 않는다.
- 자동 주입 훅이 없으므로 직접 Read 하는 것이 유일한 경로다.
- `tasks/<branch>.md`가 이미 있으면 이전 세션에서 진행하던 작업이므로, 새로 만들지 않고 이어받는다.

## 설계 문서

HOW TO WORK 1단계(설계)의 결과물을 남기는 규칙이다.

- 경로를 추측해서 쓰지 않고, 아래 기본값을 제시해서 확인받는다.
  - 브랜치를 파는 작업 → `~/.claude/worklog/<repo>/tasks/<대상 브랜치>.md`
  - 브랜치를 안 파는 작업 → `~/.claude/worklog/<repo>/tasks/<YYYYMMDD>-<슬러그>.md`
- `<대상 브랜치>`는 지금 체크아웃된 브랜치가 아니라 **작업할 브랜치**다 (`feature/authguard`로 작업할 거면 `tasks/feature/authguard.md`).
- `~/.claude/templates/task.md`를 안 읽고 임의 형식으로 쓰지 않는다.
- 대상 브랜치가 아직 없다고 문서를 미루지 않는다 — 경로는 폴더명일 뿐이라 브랜치 존재 여부와 무관하다.

## 진행 기록

- 세션을 미완료로 마치면서 아무것도 안 남기지 않는다.
- task 파일의 `## 진행 상황 (HH:MM)`에 "한 것 / 막힌 것 / 다음 할 것"을 적어 다음 세션·기기가 이어받게 한다.
- 미완료 문서를 `done/`으로 옮기지 않는다.

## 완료

HOW TO WORK 5단계에서 사용자가 통과로 확인한 뒤에만 수행한다.

- task 파일 끝에 `## 완료 (HH:MM)` 요약을 남기지 않은 채 옮기지 않는다.
- 사용자 허락 없이 `done/`으로 옮기지 않는다.
- 옮길 위치는 아래 둘 중 하나다.
  - 브랜치 작업 → `tasks/done/<branch>-YYYYMMDD.md`
  - 날짜-슬러그 작업 → 파일명 그대로 `tasks/done/<YYYYMMDD>-<슬러그>.md` (날짜를 또 붙이지 않는다)
- `done/` 아래에 하위 폴더를 만들지 않는다 (1-depth 평탄 유지).
- 브랜치명의 `/`는 `-`로 치환한다 (`feature/search-ignore-space` → `done/feature-search-ignore-space-YYYYMMDD.md`).

## 과거 작업 참조

- 이전에 한 작업을 찾을 때 기억에 의존하지 않고 `~/.claude/worklog/<repo>/tasks/done/`을 Grep 한다.
