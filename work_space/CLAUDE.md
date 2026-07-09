# WORK CLAUDE MD

## ROUTING

### REPO CLAUDE MD

> 해당 폴더 작업 시 무조건 읽기

- [./repo_a/CLAUDE.md](./repo_a/CLAUDE.md) # repo A
- [./repo_b/CLAUDE.md](./repo_b/CLAUDE.md) # repo B

## ISSUE 자산화

1. `progress.md` 작업 중 이슈(에러)가 발생하면 중단하고 보고합니다.
   - 단, 다음 작업을 해야만 에러가 해결된다면 다음 작업을 진행합니다.(ex: 타입 미선언 이슈)
2. 보고 후 `chores.md`에 `[app] issue:` 형태로 작성하고, 이슈 해결을 먼저 진행합니다.(app 구분 없다면 생략 가능)
3. 이슈가 간단하지 않거나, 바로 해결되지 않는 이슈라면 `.claude-docs/issues/YYYYMMDDHHmm-<이슈 내용>.md` 형태로, [issues.template.md](./.claude-docs/rules/issues.template.md) 양식에 맞춰 기록합니다.
   - 간단한 이슈는 해결 후 체크박스 체크만 합니다.
   - 이슈 해결 이후 '어떻게' 기준으로 해결 방법을 기록합니다.

### '간단한 이슈'의 기준이란?

다음을 **모두** 만족하면 간단한 이슈 — `chores.md` 체크만 하고 `issues/` 파일은 만들지 않습니다.

- 원인이 바로 보인다 (조사 불필요)
- 한두 단계로 즉시 해결된다 (ex: 타입 미선언, import 누락, 오타, 린트 에러)
- 재발해도 다시 보면 바로 알 수 있어 따로 기록해둘 가치가 낮다

하나라도 어긋나면(원인 조사 필요 · 여러 번 시도 · 재발 대비 가치 있음) → `issues/` 파일로 기록합니다.
