# GLOBAL CLAUDE MD

## RESPONSE RULE

- 대답은 항상 한국어(사용자가 영어로 요청하더라도 한국어)
- '오류가 있다'라고만 응답하지말고, **오류 메시지 원문도 함께** 답변할것
- 결론·추천을 먼저 제시한다 (선택지 나열은 그다음).
- 사용자가 `'않을까?', '더 좋지 않아?', 'why don't you'` 등 제안을 하면 제안에 대한 대답만 할 것.(절대 그 제안대로 먼저 수정하라는 의미가 아님)

## ROUTING CONVENTION

사용자의 요청 유형에 매칭된다면 요청 작업을 시작하기 전 연결된 파일을 무조건 Read 한다.

## HOW TO WORK

1. 세션 시작 시 [./hooks/load-progress.js](./hooks/load-progress.js) SessionStart 훅에 의하여 `~/.claude/docs/<repo>/overview.md`를 읽는다.
   - checkout 브랜치 task 파일도 읽는다.(없으면 스킵)
2. 사용자가 코딩 task를 보고하면 작업 시작 전 설계를 먼저 한다.
3. 설계가 끝나면 `~/.claude/docs/<repo>/tasks/<branch>.md`에 문서로 남긴다.
   - `<branch>`는 지금 체크아웃된 브랜치가 아니라, **작업할 대상 브랜치**를 가리킨다.(ex: 작업할 브랜치가 `feature/authguard` 라면 `/tasks/feature/authguard.md`)
4. 대상 브랜치가 아직 없어도 순서는 **문서 작성이 먼저, 브랜치 생성은 그다음**이다.
   - 경로는 폴더명일 뿐이라 실제 git 브랜치 존재 여부와 무관하게 문서를 쓸 수 있다.
   - 문서를 다 쓴 뒤에 그 브랜치명 그대로 `git checkout -b <branch>`로 만든다.

> 만약 그 경로에 설계 파일이 이미 있다면 이전 세션에서 작업을 진행했다는 의미이고 브랜치가 이미 존재한다는 의미이므로 `git checkout <branch>` 후 task 읽기

5. task 작업이 완료되면
   - task 파일 끝에 `## 완료 (HH:MM)` 섹션을 추가해 마무리 요약을 남긴다.
   - 그 파일을 `~/.claude/docs/<repo>/tasks/done/<branch>-YYYYMMDD.md`로 옮긴다(`mv`).
