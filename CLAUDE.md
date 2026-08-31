# GLOBAL CLAUDE MD

## SKILL ROUTING CONVENTION

아래 트리거에 매칭되면 작업을 시작하기 전에 연결된 skill을 호출한다.
자동 호출을 기다리지 않고 명시적으로 부른다. 자동 호출은 `description` 매칭에 달려 있어 확실하지 않다.

| 요청 유형 (트리거)                          | 호출 대상                                         |
| ------------------------------------------- | ------------------------------------------------- |
| 코드 작성·수정(개발 작업)                   | [`/development`](skills/development/SKILL.md)     |
| 개발 태스크 사전 분석("태스크 분석해줘" 등) | [`/analyze-task`](skills/analyze-task/SKILL.md)   |
| 독립적인 코드 리뷰 요청("리뷰해줘" 등)      | [`/review-panel`](skills/review-panel/SKILL.md)   |
| git 관련 작업(worktree, commit, push, ...)  | [`/git-workflow`](skills/git-workflow/SKILL.md)   |
| 조사·리서치·자료 종합·브레인스토밍          | [`/research`](skills/research/SKILL.md)           |
| 논문·긴 기술 문서 정독·정리                 | [`/paper-reading`](skills/paper-reading/SKILL.md) |

- 어느 트리거인지 판단이 서지 않으면 스킬을 고르기 전에 사용자에게 종류를 확인한다.
- 해당 skill이 없으면 그 규칙은 이 설정에 포함되지 않은 것이다. 만들어 내거나 우회하지 말고 사용자에게 알린다.
