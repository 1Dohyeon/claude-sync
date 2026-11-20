---
description: 커밋을 원격에 push할 때 사용한다. 처음 push할 때 원격 브랜치를 만들고 upstream을 잡으며, 강제 푸시와 베이스 브랜치 직접 push를 막는다.
when_to_use: '예: "푸시해줘", "커밋 푸시"'
---

# push

작업 브랜치는 [`git-worktree`](../git-worktree/SKILL.md)대로 원격 브랜치 없이 만들어진다. 원격 브랜치는 처음 push할 때 생긴다.

- push 전에 `git status -sb`로 upstream을 확인하고 아래 표대로 push한다.

| status 출력                     | 상태                       | push 명령                                                                    |
| ------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `## <branch>`                   | 처음 push                  | `git push -u origin <branch>`                                                |
| `## <branch>...origin/<branch>` | 이미 원격 브랜치가 있음    | `git push`                                                                   |
| `## <branch>...origin/<base>`   | 베이스를 추적하도록 잘못 잡힘 | push하지 않고 `git branch --unset-upstream`으로 푼 뒤 처음 push처럼 한다 |

  - 사유: upstream이 베이스로 잡혀 있으면 평범한 `git push` 한 번에 커밋이 바로 베이스로 들어간다.
- 베이스 브랜치(`main`, `develop` 등)에 직접 push하지 않는다. 사용자가 그 브랜치를 지정해서 요청했을 때만 한다.
- 강제 푸시(`--force`, `--force-with-lease`)는 사용자가 요청할 때만 한다.
  - 사유: 원격의 커밋을 덮어써서 다른 사람이 받은 히스토리와 어긋난다.
- push할 커밋이 아직 리뷰되지 않았으면 [`review-commit`](../review-commit/SKILL.md)을 권한다. 사용자가 바로 push하라고 했으면 권하지 않고 push한다.
