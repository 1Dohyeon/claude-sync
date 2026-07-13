# GLOBAL CLAUDE MD

## RESPONSE RULE

- 대답은 항상 한국어(사용자가 영어로 요청하더라도 한국어)
- '오류가 있다'라고만 응답하지말고, **오류 메시지 원문도 함께** 답변할것
- 결론·추천을 먼저 제시한다 (선택지 나열은 그다음).
- 사용자가 `'않을까?', '더 좋지 않아?', 'why don't you'` 등 제안을 하면 제안에 대한 대답만 할 것.(절대 그 제안대로 먼저 수정하라는 의미가 아님)

## ROUTING CONVENTION

아래 트리거에 매칭되면 요청 작업을 시작하기 전 연결된 파일을 무조건 Read 한다.

| 요청 유형 (트리거) | Read 대상 |
|---|---|
| 새 코딩 task 설계·문서 작성 | `~/.claude/.templates/task.md` |
| 커밋 · 브랜치 · worktree · PR | `~/.claude/.rules/git-workflow.md` |
| 과거·완료된 작업 참조·검색 | `~/.claude/docs/<repo>/tasks/done/INDEX.md` (없거나 부족하면 `done/` grep) |

## HOW TO WORK

1. 세션 시작 시 [./hooks/load-progress.js](./hooks/load-progress.js) SessionStart 훅에 의하여 `~/.claude/docs/<repo>/overview.md`를 읽는다.
   - checkout 브랜치 task 파일도 읽는다.(없으면 스킵)
2. 사용자가 코딩 task를 보고하면 작업 시작 전 설계를 먼저 한다.
3. 설계가 끝나면 `~/.claude/docs/<repo>/tasks/<branch>.md`에 문서로 남긴다.
   - `<branch>`는 지금 체크아웃된 브랜치가 아니라, **작업할 대상 브랜치**를 가리킨다.(ex: 작업할 브랜치가 `feature/authguard` 라면 `/tasks/feature/authguard.md`)
4. 대상 브랜치가 아직 없어도 순서는 **문서 작성이 먼저, 브랜치 생성은 그다음**이다.
   - 경로는 폴더명일 뿐이라 실제 git 브랜치 존재 여부와 무관하게 문서를 쓸 수 있다.
   - 브랜치/worktree 생성은 **반드시 사용자 승인 후** 진행한다. (상세: `~/.claude/.rules/git-workflow.md`)
     - 현재 브랜치가 `develop`/`main`(베이스) → 새 브랜치로 작업 (보통 사용자가 수동 생성)
     - 현재 브랜치가 `feature/`·`fix/`·`chore/` 등 → 이미 다른 작업 중이므로 **worktree**로 분리 (Claude가 만들 땐 허락 필수)
     - 단, 대상 브랜치 == 현재 브랜치면 새로 만들지 말고 그대로 이어서 작업한다.

> 만약 그 경로에 설계 파일이 이미 있다면 이전 세션에서 작업을 진행했다는 의미이고 브랜치가 이미 존재한다는 의미이므로 `git checkout <branch>` 후 task 읽기

5. 세션을 **미완료 상태로 마칠 때**는 task 파일에 `## 진행 상황 (HH:MM)`을 추가/갱신해 "한 것 / 막힌 것 / 다음 할 것"을 남긴다. (다음 세션·기기가 이어받도록)
   - 완료가 아니므로 `done/`으로 옮기지 않는다.

6. task 작업이 완료되면
   - task 파일 끝에 `## 완료 (HH:MM)` 섹션을 추가해 마무리 요약을 남긴다.
   - 그 파일을 `~/.claude/docs/<repo>/tasks/done/<branch>-YYYYMMDD.md`로 옮긴다(`mv`).
   - **`done/` 아래는 평탄(1-depth) 유지**: 브랜치명의 `/`는 `-`로 치환한다. (ex: `feature/search-ignore-space` → `done/feature-search-ignore-space-YYYYMMDD.md`) — `done/` 안에 `feature/` 등 하위폴더를 만들지 않는다.
