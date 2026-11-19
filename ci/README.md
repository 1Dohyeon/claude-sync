# PR 멘션 리뷰 (GitHub Actions)

PR 코멘트에 `@claude`를 쓰면 GitHub Actions 러너에서 Claude Code가 이 저장소의 `CLAUDE.md`, `rules/`, `skills/`, `agents/`를 싣고 동작합니다. 리뷰 요청이면 [`/review-pr`](../skills/review-pr/SKILL.md) 절차로 리뷰하고, 수정 요청이면 PR 브랜치에 커밋하고, 질문이면 답합니다. `settings.json`과 `hooks/`는 싣지 않습니다.

다른 저장소에 붙이는 방법입니다.

1. 대상 저장소에 [Claude GitHub App](https://github.com/apps/claude)을 설치합니다.
2. 로컬에서 `claude setup-token`으로 OAuth 토큰을 발급해, 대상 저장소의 Actions 시크릿 `CLAUDE_CODE_OAUTH_TOKEN`에 등록합니다. 토큰은 발급한 사람의 Claude 구독을 씁니다.
3. 대상 저장소에 [`.github/workflows/claude.yml`](../.github/workflows/claude.yml)과 같은 호출 파일을 둡니다. 이 저장소의 것을 그대로 복사하면 됩니다.

- 호출 파일은 기본 브랜치에 머지된 뒤부터 동작합니다. 코멘트 이벤트는 기본 브랜치의 워크플로로만 실행됩니다.
- 실제 동작은 재사용 워크플로 [`claude-mention.yml`](../.github/workflows/claude-mention.yml)과 CI에서만 달라지는 지시 [`prompts/pr-review.md`](prompts/pr-review.md)에 있습니다. 둘 다 이 저장소의 `main`을 따라가므로, 규칙을 고치면 모든 대상 저장소에 바로 반영됩니다.
- 러너의 `~/.claude`에 설정을 연결하는 작업은 [`load-claude-sync.sh`](load-claude-sync.sh)가 합니다.
