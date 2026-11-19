# GLOBAL CLAUDE MD

## SKILL ROUTING CONVENTION

아래 트리거에 매칭되면 작업을 시작하기 전에 연결된 skill을 호출한다.
자동 호출을 기다리지 않고 명시적으로 부른다. 자동 호출은 `description` 매칭에 달려 있어 확실하지 않다.

| 요청 유형 (트리거)                          | 호출 대상                                                 |
| ------------------------------------------- | --------------------------------------------------------- |
| 코드 작성·수정(개발 작업)                   | [`/dev`](skills/dev/SKILL.md)                             |
| 요청사항 분석·설계("태스크 분석해줘" 등)    | [`/dev-plan`](skills/dev-plan/SKILL.md)                   |
| 테스트 먼저 작성(TDD)                       | [`/dev-tdd`](skills/dev-tdd/SKILL.md)                     |
| 코드 변경 리뷰(커밋 전·PR)                  | [`/review`](skills/review/SKILL.md)                       |
| git 관련 작업(worktree, commit, push, ...)  | [`/git-workflow`](skills/git-workflow/SKILL.md)           |
| 조사·리서치·자료 종합·브레인스토밍          | [`/research`](skills/research/SKILL.md)                   |
| 여러 출처를 종합하는 심층 조사·보고서       | [`/research-deep`](skills/research-deep/SKILL.md)         |
| 후보 가운데 무엇을 고를지 정하는 비교 조사  | [`/research-compare`](skills/research-compare/SKILL.md)   |
| 논문·긴 기술 문서 정독·정리                 | [`/paper-reading`](skills/paper-reading/SKILL.md)         |
| 세션 작업 일기 기록("worklog 써줘" 등)      | [`/worklog`](skills/worklog/SKILL.md)                     |
| Windows 디스크 용량 확인·정리               | [`/windows-disk-scan`](skills/windows-disk-scan/SKILL.md) |
| Google Calendar 일정 생성·수정              | [`/google-calendar`](skills/google-calendar/SKILL.md)     |
| Claude 세션 기록(`~/.claude/projects`) 정리 | [`/chore-sessions`](skills/chore-sessions/SKILL.md)       |
| 작업 규칙 위반을 지적받았거나 스스로 알아챔 | [`/ffc`](skills/ffc/SKILL.md)                             |
| rules에 규칙 추가·수정                      | [`/write-rule`](skills/write-rule/SKILL.md)               |

- 어느 트리거인지 판단이 서지 않으면 스킬을 고르기 전에 사용자에게 종류를 확인한다.
- 트리거는 맞으나 해당 skill의 적용 범위(입력 형태·전제)가 이번 요청과 맞지 않으면, 스킬 없이 진행하되 어느 전제가 맞지 않았는지 먼저 밝힌다.
- 해당 skill이 없으면 그 규칙은 이 설정에 포함되지 않은 것이다. 만들어 내거나 우회하지 말고 사용자에게 알린다.
